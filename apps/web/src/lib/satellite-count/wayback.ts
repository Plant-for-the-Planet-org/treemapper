/**
 * Esri World Imagery Wayback: list of imagery releases and per-location
 * capture metadata (acquisition date, provider, native resolution).
 *
 * Follows the public contract used by Esri's own @esri/wayback-core
 * (Apache-2.0): a JSON config of releases, a WMTS tile template per release,
 * and a metadata feature service with one sub-layer per zoom level.
 */

const WAYBACK_CONFIG_URL =
  'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json';
const WAYBACK_SUBDOMAINS = ['wayback', 'wayback-a', 'wayback-b'];
const CURRENT_WORLD_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{level}/{row}/{col}';

export interface ImageryRelease {
  /** Wayback release number; 0 = the live World Imagery basemap (fallback) */
  releaseNum: number;
  /** e.g. "2024-06-27" */
  label: string;
  title: string;
  /** Tile URL template with {level}/{row}/{col} */
  urlTemplate: string;
  metadataLayerUrl: string | null;
}

export interface ImageryMetadata {
  /** acquisition date, ISO yyyy-mm-dd */
  date: string | null;
  provider: string | null;
  source: string | null;
  /** native resolution of the source imagery, metres */
  resolution: number | null;
  /** positional accuracy, metres */
  accuracy: number | null;
}

export const CURRENT_RELEASE: ImageryRelease = {
  releaseNum: 0,
  label: 'Current',
  title: 'World Imagery (current)',
  urlTemplate: CURRENT_WORLD_IMAGERY,
  metadataLayerUrl: null,
};

let releasesPromise: Promise<ImageryRelease[]> | null = null;

/** All Wayback releases, newest first. Cached for the session. */
export function getImageryReleases(): Promise<ImageryRelease[]> {
  if (!releasesPromise) {
    releasesPromise = fetch(WAYBACK_CONFIG_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Wayback config ${res.status}`);
        return res.json();
      })
      .then((config: Record<string, any>) =>
        Object.entries(config)
          .filter(([key, item]) => !isNaN(+key) && item?.itemURL && item?.itemTitle)
          .map(([key, item]) => {
            const label = String(item.itemTitle).match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
            return {
              releaseNum: +key,
              label,
              title: item.itemTitle as string,
              urlTemplate: item.itemURL as string,
              metadataLayerUrl: (item.metadataLayerUrl as string) || null,
            };
          })
          .filter(r => r.label)
          .sort((a, b) => b.label.localeCompare(a.label)),
      )
      .catch(err => {
        releasesPromise = null; // allow a retry later
        throw err;
      });
  }
  return releasesPromise;
}

export function tileUrl(release: ImageryRelease, z: number, x: number, y: number): string {
  let url = release.urlTemplate
    .replace('{level}', String(z))
    .replace('{row}', String(y))
    .replace('{col}', String(x));
  if (url.startsWith('https://wayback.maptiles.arcgis.com')) {
    // spread requests over Esri's sub-domains, as the Wayback app does
    const sub = WAYBACK_SUBDOMAINS[(x + y) % WAYBACK_SUBDOMAINS.length];
    url = url.replace('https://wayback.', `https://${sub}.`);
  }
  return url;
}

/** Tile template for map libraries ({z}/{y}/{x}). */
export const mapTileTemplate = (release: ImageryRelease) =>
  release.urlTemplate.replace('{level}', '{z}').replace('{row}', '{y}').replace('{col}', '{x}');

// ---------------------------------------------------------------------------
// Tile availability
//
// Esri imagery doesn't reach the same zoom everywhere: many rural areas stop
// at zoom 17 or 18. Requesting a tile that doesn't exist returns an error
// without CORS headers, which the browser reports as "Failed to fetch". The
// Wayback service exposes a "tilemap" that says which tiles exist, so we ask
// it first instead of requesting missing tiles.
// ---------------------------------------------------------------------------

const TILEMAP_BLOCK = 32; // max rows/cols asked in one tilemap request

const tilemapBase = (release: ImageryRelease) => {
  const m = release.urlTemplate.match(/^(.*\/MapServer)\/tile\//);
  return m ? `${m[1]}/tilemap/${release.releaseNum}` : null;
};

/** Does the tilemap say the tile at (z, x, y) exists? null = unknown. */
async function tilemapBlock(
  release: ImageryRelease, z: number, top: number, left: number, height: number, width: number,
): Promise<number[] | null> {
  const base = tilemapBase(release);
  if (!base || !release.releaseNum) return null;
  try {
    const res = await fetch(`${base}/${z}/${top}/${left}/${height}/${width}`);
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) && json.data.length === height * width ? json.data : null;
  } catch {
    return null;
  }
}

const tileOf = (lon: number, lat: number, z: number) => {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n),
  };
};

/**
 * Highest zoom (from `zooms`) at which this imagery version has a tile at the
 * point. Returns null if it can't be determined (then assume all zooms work).
 */
export async function getMaxAvailableZoom(
  release: ImageryRelease, lon: number, lat: number, zooms: number[],
): Promise<number | null> {
  const sorted = [...zooms].sort((a, b) => b - a);
  const results = await Promise.all(sorted.map(z => {
    const { x, y } = tileOf(lon, lat, z);
    return tilemapBlock(release, z, y, x, 1, 1);
  }));
  if (results.every(r => r === null)) return null;
  const idx = results.findIndex(r => r?.[0] === 1);
  return idx === -1 ? Math.min(...zooms) - 1 : sorted[idx];
}

/**
 * Which of the given tiles exist. Tiles in unknown blocks count as available.
 * Returned as a Set of "x/y" keys of MISSING tiles.
 */
export async function getMissingTiles(
  release: ImageryRelease, z: number, tiles: { x: number; y: number }[],
): Promise<Set<string>> {
  const missing = new Set<string>();
  if (!tiles.length || !tilemapBase(release) || !release.releaseNum) return missing;
  const minX = Math.min(...tiles.map(t => t.x)), maxX = Math.max(...tiles.map(t => t.x));
  const minY = Math.min(...tiles.map(t => t.y)), maxY = Math.max(...tiles.map(t => t.y));
  const jobs: Promise<void>[] = [];
  for (let top = minY; top <= maxY; top += TILEMAP_BLOCK) {
    for (let left = minX; left <= maxX; left += TILEMAP_BLOCK) {
      const h = Math.min(TILEMAP_BLOCK, maxY - top + 1);
      const w = Math.min(TILEMAP_BLOCK, maxX - left + 1);
      jobs.push(tilemapBlock(release, z, top, left, h, w).then(data => {
        if (!data) return;
        data.forEach((v, i) => {
          if (v !== 1) missing.add(`${left + (i % w)}/${top + Math.floor(i / w)}`);
        });
      }));
    }
  }
  await Promise.all(jobs);
  return missing;
}

/**
 * Acquisition metadata for the imagery shown at a point and zoom.
 * The metadata service has sub-layers 0..13 for zoom 23..10.
 */
export async function getImageryMetadata(
  release: ImageryRelease,
  lon: number,
  lat: number,
  zoom: number,
): Promise<ImageryMetadata | null> {
  if (!release.metadataLayerUrl) return null;
  const layerId = Math.min(23 - Math.round(zoom), 13);
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: 'SRC_DATE2,NICE_DESC,SRC_DESC,SAMP_RES,SRC_ACC',
    geometry: JSON.stringify({ spatialReference: { wkid: 4326 }, x: lon, y: lat }),
    returnGeometry: 'false',
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
  });
  const res = await fetch(`${release.metadataLayerUrl}/${layerId}/query?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  const a = data?.features?.[0]?.attributes;
  if (!a) return null;
  const date = typeof a.SRC_DATE2 === 'number' ? new Date(a.SRC_DATE2).toISOString().slice(0, 10) : null;
  return {
    date,
    provider: a.NICE_DESC ?? null,
    source: a.SRC_DESC ?? null,
    resolution: typeof a.SAMP_RES === 'number' ? a.SAMP_RES : null,
    accuracy: typeof a.SRC_ACC === 'number' ? a.SRC_ACC : null,
  };
}
