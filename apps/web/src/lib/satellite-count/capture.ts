/**
 * Capture the imagery under an intervention polygon as one JPEG.
 *
 * Instead of screenshotting the map (which depends on the viewport, screen
 * DPI and whatever else is drawn), we download the imagery tiles that cover
 * the polygon's bounding box at a chosen zoom, stitch them on a canvas and cut
 * the canvas on exact pixel edges. The resulting image and the `bounds` we send
 * to the backend therefore line up perfectly.
 */
import {
  BBox,
  PixelWindow,
  TILE_SIZE,
  groundResolution,
  pixelWindow,
} from './mercator';
import { ImageryRelease, getMissingTiles, tileUrl } from './wayback';

/** Keep uploads and download time reasonable. */
export const MAX_TILES = 400;
export const MAX_PIXELS = 40_000_000;
const CONCURRENCY = 8;
const JPEG_QUALITY = 0.92;

export type ZoomQuality = 'best' | 'good' | 'usable' | 'too-coarse';

export interface ZoomOption {
  zoom: number;
  gsd: number; // metres per pixel
  width: number;
  height: number;
  tiles: number;
  quality: ZoomQuality;
  tooLarge: boolean;
  /** Esri has no imagery at this zoom for this location */
  unavailable: boolean;
}

export const qualityForGsd = (gsd: number): ZoomQuality =>
  gsd <= 0.35 ? 'best' : gsd <= 0.6 ? 'good' : gsd <= 1.0 ? 'usable' : 'too-coarse';

export const QUALITY_LABEL: Record<ZoomQuality, string> = {
  best: 'Best for tree crowns',
  good: 'Good',
  usable: 'Usable, lower accuracy',
  'too-coarse': 'Too coarse for individual trees',
};

export const CANDIDATE_ZOOMS = [16, 17, 18, 19, 20];

/**
 * Candidate zoom levels with their size and expected quality.
 * `maxAvailable`: highest zoom the imagery exists at here (null = unknown).
 */
export function zoomOptions(bbox: BBox, maxAvailable: number | null = null, zooms = CANDIDATE_ZOOMS): ZoomOption[] {
  const lat = (bbox[1] + bbox[3]) / 2;
  return zooms.map(zoom => {
    const win = pixelWindow(bbox, zoom);
    const gsd = groundResolution(lat, zoom);
    return {
      zoom,
      gsd,
      width: win.width,
      height: win.height,
      tiles: win.tiles.length,
      quality: qualityForGsd(gsd),
      tooLarge: win.tiles.length > MAX_TILES || win.width * win.height > MAX_PIXELS,
      unavailable: maxAvailable != null && zoom > maxAvailable,
    };
  });
}

/**
 * Highest zoom up to 19 that fits the size limits. Zoom 19 (~0.3 m/px) is
 * where Esri imagery is sharpest in most rural areas; going higher usually
 * just enlarges the same pixels.
 */
export function recommendedZoom(options: ZoomOption[]): number {
  const usable = options.filter(o => !o.tooLarge && !o.unavailable);
  const preferred = usable.filter(o => o.zoom <= 19);
  if (preferred.length) return preferred[preferred.length - 1].zoom;
  if (usable.length) return usable[0].zoom;
  return options[0].zoom;
}

export interface CaptureResult {
  blob: Blob;
  window: PixelWindow;
  gsd: number;
  /** tiles that failed to download (drawn grey) */
  missingTiles: number;
  /** tiles that look like "no imagery" placeholders (almost uniform colour) */
  blankTiles: number;
  totalTiles: number;
}

async function loadTile(url: string, signal?: AbortSignal): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(url, { signal, mode: 'cors' });
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return null;
  }
}

/** Standard deviation of a tile's brightness; ~0 means a flat placeholder. */
function tileContrast(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): number {
  if (w <= 0 || h <= 0) return 255;
  const { data } = ctx.getImageData(x, y, w, h);
  let sum = 0, sumSq = 0, n = 0;
  for (let i = 0; i < data.length; i += 4 * 7) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += v;
    sumSq += v * v;
    n++;
  }
  const mean = sum / n;
  return Math.sqrt(Math.max(0, sumSq / n - mean * mean));
}

export async function captureImagery(
  release: ImageryRelease,
  bbox: BBox,
  zoom: number,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<CaptureResult> {
  const win = pixelWindow(bbox, zoom);
  if (win.tiles.length > MAX_TILES || win.width * win.height > MAX_PIXELS) {
    throw new Error('This area is too large to capture at this zoom level. Choose a lower zoom.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = win.width;
  canvas.height = win.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, win.width, win.height);

  // Skip tiles Esri doesn't have (requesting them only produces CORS errors).
  const absent = await getMissingTiles(release, zoom, win.tiles);
  if (absent.size / win.tiles.length > 0.05) {
    throw new Error(
      `Esri has no imagery at zoom ${zoom} for ${Math.round((absent.size / win.tiles.length) * 100)}% of this area. ` +
      'Choose a lower zoom level or another imagery version.',
    );
  }

  let done = 0, missing = absent.size, blank = 0;
  const queue = win.tiles.filter(t => !absent.has(`${t.x}/${t.y}`));
  onProgress?.(missing, win.tiles.length);
  done = missing;
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift()!;
      const bmp = await loadTile(tileUrl(release, zoom, t.x, t.y), signal);
      const dx = t.x * TILE_SIZE - win.x0;
      const dy = t.y * TILE_SIZE - win.y0;
      if (bmp) {
        ctx.drawImage(bmp, dx, dy, TILE_SIZE, TILE_SIZE);
        bmp.close();
        // only measure the part of the tile that is inside the capture
        const cx = Math.max(0, dx), cy = Math.max(0, dy);
        const cw = Math.min(win.width, dx + TILE_SIZE) - cx;
        const ch = Math.min(win.height, dy + TILE_SIZE) - cy;
        if (tileContrast(ctx, cx, cy, cw, ch) < 2) blank++;
      } else {
        missing++;
      }
      done++;
      onProgress?.(done, win.tiles.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  if (missing === win.tiles.length) {
    throw new Error('Could not download any imagery for this area. Check your connection or try another imagery date.');
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode the image'))), 'image/jpeg', JPEG_QUALITY),
  );
  const lat = (bbox[1] + bbox[3]) / 2;
  return {
    blob,
    window: win,
    gsd: groundResolution(lat, zoom),
    missingTiles: missing,
    blankTiles: blank,
    totalTiles: win.tiles.length,
  };
}
