import * as turf from '@turf/turf';

/**
 * Plot boundary maths for the create-plot wizard.
 *
 * The circle and rectangle generators deliberately mirror the mobile app
 * (apps/mobile/src/components/map/CreatePlotMapDetail.tsx): same turf calls,
 * same 100-step circle, same corner order, so a plot drawn in the dashboard and
 * one drawn on a device produce comparable geometry for the same inputs.
 */

/** One [lng, lat] pair. */
export type Coord = [number, number];

const corner = (center: number[], distanceMetres: number, bearing: number): number[] =>
  turf.destination(turf.point(center), distanceMetres, bearing, { units: 'meters' })
    .geometry.coordinates;

/** Circle of `radius` metres about `center`, as a closed ring. */
export function circleRing(center: Coord, radius: number): number[][] {
  return turf.circle(center as number[], radius, { steps: 100, units: 'meters' })
    .geometry.coordinates[0];
}

/**
 * Axis-aligned rectangle about `center`: `length` runs north-south, `width`
 * east-west. Matches the orientation hint the mobile map shows the user.
 */
export function rectangleRing(center: Coord, length: number, width: number): number[][] {
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const topCenter = corner(center as number[], halfLength, 0);
  const bottomCenter = corner(center as number[], halfLength, 180);
  const topLeft = corner(topCenter, halfWidth, 270);
  const topRight = corner(topCenter, halfWidth, 90);
  const bottomLeft = corner(bottomCenter, halfWidth, 270);
  const bottomRight = corner(bottomCenter, halfWidth, 90);
  return [topRight, bottomRight, bottomLeft, topLeft, topRight];
}

/**
 * The boundary polygon for a centre plus dimensions, or null when the inputs are
 * not yet complete enough to draw anything.
 */
export function buildBoundary(
  shape: 'circle' | 'rectangle' | 'polygon',
  center: Coord | null,
  dims: { radius: number | null; length: number | null; width: number | null },
): GeoJSON.Polygon | null {
  if (!center) return null;
  if (shape === 'circle') {
    if (!dims.radius || dims.radius <= 0) return null;
    return { type: 'Polygon', coordinates: [circleRing(center, dims.radius)] };
  }
  if (shape === 'rectangle') {
    if (!dims.length || dims.length <= 0 || !dims.width || dims.width <= 0) return null;
    return { type: 'Polygon', coordinates: [rectangleRing(center, dims.length, dims.width)] };
  }
  return null;
}

/**
 * Reduce any uploaded GeoJSON or converted KML down to the bare Polygon the
 * server accepts. Throws with a message meant for the user.
 */
export function toBoundaryPolygon(input: any): GeoJSON.Polygon {
  if (!input) throw new Error('The file is empty.');

  let geometry: any = input;
  if (input.type === 'FeatureCollection') {
    const withGeometry = (input.features ?? []).find((f: any) => f?.geometry);
    if (!withGeometry) throw new Error('No shape found in the file.');
    geometry = withGeometry.geometry;
  } else if (input.type === 'Feature') {
    geometry = input.geometry;
  }
  if (!geometry?.type) throw new Error('No shape found in the file.');

  if (geometry.type === 'MultiPolygon') {
    if (!geometry.coordinates?.length) throw new Error('The shape has no coordinates.');
    // A plot is one boundary. Take the first polygon and say so in the UI.
    return asPolygon(geometry.coordinates[0]);
  }
  if (geometry.type === 'Polygon') {
    if (!geometry.coordinates?.length) throw new Error('The shape has no coordinates.');
    return asPolygon(geometry.coordinates);
  }
  throw new Error(`Unsupported shape type: ${geometry.type}. Upload a polygon.`);
}

/**
 * Close the rings and check the boundary is actually drawable. The server needs
 * at least four points per closed ring, so catching it here gives the user a
 * sentence instead of a rejected request.
 */
function asPolygon(rings: number[][][]): GeoJSON.Polygon {
  const closed = closeRings(rings);
  if (!closed[0] || closed[0].length < 4) {
    throw new Error('That boundary needs at least three corners.');
  }
  return { type: 'Polygon', coordinates: closed };
}

/** PostGIS rejects an unclosed ring, and some exports leave the last point off. */
function closeRings(rings: number[][][]): number[][][] {
  return rings.map((ring) => {
    if (ring.length < 3) return ring;
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    return firstLng === lastLng && firstLat === lastLat ? ring : [...ring, ring[0]];
  });
}

/** Area in square metres, or null when the polygon is unusable. */
export function polygonArea(polygon: GeoJSON.Polygon | null): number | null {
  if (!polygon) return null;
  try {
    const a = turf.area(polygon);
    return a > 0 ? a : null;
  } catch {
    return null;
  }
}

/** Centre of a polygon as [lng, lat], for the plot's coords Point. */
export function polygonCenter(polygon: GeoJSON.Polygon | null): Coord | null {
  if (!polygon) return null;
  try {
    const c = turf.center(polygon).geometry.coordinates;
    return [c[0], c[1]];
  } catch {
    return null;
  }
}

/** True when the point sits inside the boundary. Used to warn on stray trees. */
export function isInsideBoundary(
  polygon: GeoJSON.Polygon | null,
  lng: number,
  lat: number,
): boolean {
  if (!polygon) return true;
  try {
    return turf.booleanPointInPolygon(turf.point([lng, lat]), polygon);
  } catch {
    return true;
  }
}

// ─── file reading ────────────────────────────────────────────────────────────

/**
 * Read a boundary out of a GeoJSON or KML file.
 *
 * KML is handled with @tmcw/togeojson (already a dependency) rather than hand
 * parsing, so placemarks, MultiGeometry and altitude coordinates all come
 * through. Kept local to this module on purpose: the intervention importer has
 * its own copy and is queued for a rewrite, and the create flow should not break
 * when that moves.
 */
export async function readSpatialFile(file: File): Promise<any> {
  const text = await file.text();
  const isKml = /\.kml$/i.test(file.name);

  if (!isKml) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('That file is not valid GeoJSON.');
    }
  }

  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('That KML file could not be read.');
  const { kml } = await import('@tmcw/togeojson');
  const converted = kml(doc);
  if (!converted?.features?.length) throw new Error('No shape found in the KML file.');
  return converted;
}

export const formatArea = (sqm: number | null): string => {
  if (sqm == null) return 'unknown';
  if (sqm < 10000) return `${sqm.toLocaleString('en-US', { maximumFractionDigits: 0 })} m²`;
  return `${(sqm / 10000).toLocaleString('en-US', { maximumFractionDigits: 2 })} ha`;
};
