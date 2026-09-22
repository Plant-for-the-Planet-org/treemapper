import type { StyleSpecification } from 'maplibre-gl';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { PolygonGeometry } from './mercator';
import { ImageryRelease, mapTileTemplate } from './wayback';

/**
 * Raster style for an imagery release. `maxzoom` makes the map over-zoom the
 * tiles of that level, so what you see is exactly what gets captured/analysed.
 */
export const imageryStyle = (release: ImageryRelease, maxzoom = 23): StyleSpecification => ({
  version: 8,
  sources: {
    imagery: {
      type: 'raster',
      tiles: [mapTileTemplate(release)],
      tileSize: 256,
      maxzoom,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'imagery', type: 'raster', source: 'imagery' }],
});

export const polygonFeature = (geometry: PolygonGeometry): Feature<Polygon | MultiPolygon> => ({
  type: 'Feature',
  properties: {},
  geometry: geometry as Polygon | MultiPolygon,
});

/** Ray-casting point-in-polygon (holes respected). */
export function pointInPolygon(lon: number, lat: number, geom: PolygonGeometry): boolean {
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const inPoly = (poly: number[][][]) => inRing(poly[0]) && !poly.slice(1).some(inRing);
  return geom.type === 'Polygon'
    ? inPoly(geom.coordinates as number[][][])
    : (geom.coordinates as number[][][][]).some(inPoly);
}
