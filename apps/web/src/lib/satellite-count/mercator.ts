/**
 * Web Mercator (EPSG:3857) helpers for slippy-map tiles.
 *
 * "Global pixels" are pixel coordinates in the full world image at a zoom
 * level: the world is 256 * 2^z pixels wide, x grows east, y grows south.
 * The analysis backend uses the same spherical Web Mercator, so an image cut
 * on whole global pixels lines up exactly with the bounds we send it.
 */

export const TILE_SIZE = 256;
const EARTH_RADIUS_M = 6378137;
const MAX_LAT = 85.05112878;

export type LonLat = [number, number];
/** [west, south, east, north] in degrees */
export type BBox = [number, number, number, number];

const worldSize = (zoom: number) => TILE_SIZE * 2 ** zoom;

export const lonToGlobalX = (lon: number, zoom: number) => ((lon + 180) / 360) * worldSize(zoom);

export const latToGlobalY = (lat: number, zoom: number) => {
  const phi = (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * worldSize(zoom);
};

export const globalXToLon = (x: number, zoom: number) => (x / worldSize(zoom)) * 360 - 180;

export const globalYToLat = (y: number, zoom: number) =>
  (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / worldSize(zoom)))) * 180) / Math.PI;

/** Metres on the ground covered by one pixel at this latitude and zoom. */
export const groundResolution = (lat: number, zoom: number) =>
  (2 * Math.PI * EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180)) / worldSize(zoom);

/** Pixel window (whole global pixels) that covers a bbox at a zoom level. */
export interface PixelWindow {
  zoom: number;
  x0: number;
  y0: number;
  x1: number; // exclusive
  y1: number; // exclusive
  width: number;
  height: number;
  /** exact lon/lat extent of the window (pixel edges), [w, s, e, n] */
  bounds: BBox;
  tiles: { x: number; y: number }[];
}

export function pixelWindow(bbox: BBox, zoom: number): PixelWindow {
  const [w, s, e, n] = bbox;
  const x0 = Math.floor(lonToGlobalX(w, zoom));
  const x1 = Math.max(x0 + 1, Math.ceil(lonToGlobalX(e, zoom)));
  const y0 = Math.floor(latToGlobalY(n, zoom));
  const y1 = Math.max(y0 + 1, Math.ceil(latToGlobalY(s, zoom)));
  const tiles: { x: number; y: number }[] = [];
  for (let ty = Math.floor(y0 / TILE_SIZE); ty <= Math.floor((y1 - 1) / TILE_SIZE); ty++) {
    for (let tx = Math.floor(x0 / TILE_SIZE); tx <= Math.floor((x1 - 1) / TILE_SIZE); tx++) {
      tiles.push({ x: tx, y: ty });
    }
  }
  return {
    zoom,
    x0,
    y0,
    x1,
    y1,
    width: x1 - x0,
    height: y1 - y0,
    bounds: [globalXToLon(x0, zoom), globalYToLat(y1, zoom), globalXToLon(x1, zoom), globalYToLat(y0, zoom)],
    tiles,
  };
}

/** Image pixel (x right, y down) inside a window -> lon/lat. */
export const windowPixelToLonLat = (win: PixelWindow, px: number, py: number): LonLat => [
  globalXToLon(win.x0 + px, win.zoom),
  globalYToLat(win.y0 + py, win.zoom),
];

// ---------------------------------------------------------------------------
// GeoJSON helpers
// ---------------------------------------------------------------------------

type Position = number[];
export interface PolygonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: Position[][] | Position[][][];
}

/**
 * Pull the areal geometry out of whatever an intervention stores
 * (Feature, FeatureCollection, bare geometry, GeometryCollection).
 * Returns null for points/lines.
 */
export function extractPolygon(input: unknown): PolygonGeometry | null {
  const polys: Position[][][] = [];
  const visit = (g: any) => {
    if (!g || typeof g !== 'object') return;
    switch (g.type) {
      case 'FeatureCollection':
        (g.features || []).forEach((f: any) => visit(f));
        break;
      case 'Feature':
        visit(g.geometry);
        break;
      case 'GeometryCollection':
        (g.geometries || []).forEach(visit);
        break;
      case 'Polygon':
        if (Array.isArray(g.coordinates) && g.coordinates.length) polys.push(g.coordinates);
        break;
      case 'MultiPolygon':
        (g.coordinates || []).forEach((p: Position[][]) => p?.length && polys.push(p));
        break;
      default:
        // legacy shape: { geometry: {...} } without a type
        if (!g.type && g.geometry) visit(g.geometry);
    }
  };
  visit(input);
  if (!polys.length) return null;
  return polys.length === 1
    ? { type: 'Polygon', coordinates: polys[0] }
    : { type: 'MultiPolygon', coordinates: polys };
}

export function geometryBBox(geom: PolygonGeometry): BBox {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const rings = geom.type === 'Polygon'
    ? (geom.coordinates as Position[][])
    : (geom.coordinates as Position[][][]).flat();
  rings.forEach(ring => ring.forEach(([x, y]) => {
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }));
  return [w, s, e, n];
}

/** Geodesic-ish area in hectares (spherical excess on the WGS84 radius). */
export function areaHectares(geom: PolygonGeometry): number {
  const ringArea = (ring: Position[]) => {
    let total = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      total += ((x2 - x1) * Math.PI / 180) * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180));
    }
    return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
  };
  const polyArea = (p: Position[][]) => ringArea(p[0]) - p.slice(1).reduce((a, r) => a + ringArea(r), 0);
  const m2 = geom.type === 'Polygon'
    ? polyArea(geom.coordinates as Position[][])
    : (geom.coordinates as Position[][][]).reduce((a, p) => a + polyArea(p), 0);
  return m2 / 10_000;
}
