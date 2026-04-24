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

// Expects filenames like: "1_Santos Moo Pot - ECA BETANIA.geojson"
export function extractBeneficiaryFromFilename(filename: string): string | null {
    const match = filename.match(/^\d+_(.+)\.(geojson|json)$/i);
    return match ? match[1].trim() : null;
}
