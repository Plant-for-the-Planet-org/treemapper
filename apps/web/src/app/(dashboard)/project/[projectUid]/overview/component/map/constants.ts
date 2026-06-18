// Palette + basemap config for the overview map.

export const BRAND = '#007A49';
export const FILL_COLOR = '#68B030';
// Muted gray for unselected interventions — quiet until focused (Felt-style),
// so the basemap reads and the selection stands out.
export const REST_COLOR = '#94A3B8';
// Brand green marks the selected intervention so it reads as "this one".
export const SELECTED_COLOR = '#7CC93C';
export const BORDER_COLOR = '#ffffff';
// Site boundary outline — amber reads clearly over satellite imagery and
// stays distinct from the green intervention polygons.
export const SITE_BOUNDARY_COLOR = '#FBBF24';

// ==================== BASEMAPS ====================
// Satellite uses Esri World Imagery (raster, no key). Light/Dark use CARTO's
// free vector styles (no key, attribution carried in the style).
export const SATELLITE_STYLE: any = {
    version: 8,
    name: 'Satellite',
    bearing: 0,
    pitch: 0,
    sources: {
        imagery: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 18,
            attribution: 'Imagery © Esri',
        },
    },
    layers: [
        { id: 'imagery', type: 'raster', source: 'imagery', minzoom: 0, layout: { visibility: 'visible' } },
    ],
};

export type BasemapKey = 'satellite' | 'light' | 'dark';

export const BASEMAP_STYLES: Record<BasemapKey, any> = {
    satellite: SATELLITE_STYLE,
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

export const BASEMAP_OPTIONS: { key: BasemapKey; label: string }[] = [
    { key: 'satellite', label: 'Satellite' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
];
