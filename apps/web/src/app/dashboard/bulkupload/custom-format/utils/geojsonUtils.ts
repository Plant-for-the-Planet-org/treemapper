export function convertGeometry(geojson: any): any {
    if (!geojson) throw new Error('No GeoJSON provided');

    let geometry = geojson;

    if (geojson.type === 'FeatureCollection') {
        if (!geojson.features?.length) throw new Error('FeatureCollection is empty');
        geometry = geojson.features[0].geometry;
    } else if (geojson.type === 'Feature') {
        geometry = geojson.geometry;
    }

    if (!geometry) throw new Error('No geometry found in GeoJSON');

    if (geometry.type === 'MultiPolygon') {
        return { type: 'Polygon', coordinates: geometry.coordinates[0] };
    }

    if (geometry.type === 'Polygon' || geometry.type === 'Point') {
        return geometry;
    }

    throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

export async function parseGeoJSONFile(file: File): Promise<any> {
    const text = await file.text();
    return JSON.parse(text);
}

// ─── KML parsing ─────────────────────────────────────────────────────────────

function parseKMLCoordinates(text: string): number[][] {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(pair => {
            const parts = pair.split(',').map(parseFloat);
            return [parts[0], parts[1]]; // lon, lat — drop altitude
        });
}

function kmlDocToGeoJSON(doc: Document): any {
    const polygonEl = doc.querySelector('Polygon');
    if (polygonEl) {
        const outerEl = polygonEl.querySelector('outerBoundaryIs LinearRing coordinates');
        if (outerEl) {
            const rings: number[][][] = [parseKMLCoordinates(outerEl.textContent ?? '')];
            polygonEl.querySelectorAll('innerBoundaryIs LinearRing coordinates').forEach(el => {
                rings.push(parseKMLCoordinates(el.textContent ?? ''));
            });
            return { type: 'Feature', geometry: { type: 'Polygon', coordinates: rings } };
        }
    }

    const multiEl = doc.querySelector('MultiGeometry');
    if (multiEl) {
        const coords: number[][][][] = [];
        multiEl.querySelectorAll('Polygon').forEach(p => {
            const outerEl = p.querySelector('outerBoundaryIs LinearRing coordinates');
            if (outerEl) coords.push([parseKMLCoordinates(outerEl.textContent ?? '')]);
        });
        if (coords.length > 0) {
            return { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: coords } };
        }
    }

    const pointEl = doc.querySelector('Point coordinates');
    if (pointEl) {
        const parts = (pointEl.textContent ?? '').trim().split(',').map(parseFloat);
        return { type: 'Feature', geometry: { type: 'Point', coordinates: [parts[0], parts[1]] } };
    }

    throw new Error('No supported geometry found in KML (expected Polygon, MultiPolygon, or Point)');
}

export async function parseKMLFile(file: File): Promise<any> {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('Invalid KML');
    return kmlDocToGeoJSON(doc);
}

export async function parseSpatialFile(file: File): Promise<any> {
    if (file.name.toLowerCase().endsWith('.kml')) return parseKMLFile(file);
    return parseGeoJSONFile(file);
}
