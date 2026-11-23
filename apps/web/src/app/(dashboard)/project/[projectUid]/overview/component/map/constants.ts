// Palette + basemap config for the overview map.
//
// Map style rules (see the "Map style rules" design board):
// - Color always means intervention type.
// - Dots always mean tree status.
// - Sites are a neutral white dashed line, so they never compete with data.

export const BRAND = '#007A49';

// ==================== INTERVENTION COLORS ====================
// Same palette as the mobile app, keyed by the server's intervention type.
export const INTERVENTION_COLORS: Record<string, string> = {
    'single-tree-registration': '#007A49',
    'sample-tree-registration': '#007A49',
    'generic-tree-registration': '#007A49',
    'multi-tree-registration': '#68B030',
    'plot-plant-registration': '#68B030',
    'removal-invasive-species': '#EB5757',
    'fire-suppression': '#F2C94C',
    'fire-patrol': '#F2994A',
    'fencing': '#48AADD',
    'marking-regenerant': '#27AE60',
    'liberating-regenerant': '#56CCF2',
    'grass-suppression': '#219653',
    'firebreaks': '#E86F56',
    'assisting-seed-rain': '#2F80ED',
    'soil-improvement': '#6D4230',
    'stop-tree-harvesting': '#4F4F4F',
    'direct-seeding': '#6FCF97',
    'enrichment-planting': '#EB67CE',
    'maintenance': '#6C63FF',
    'control-livestock': '#9B51E0',
    'other-intervention': '#9B51E0',
};
export const OTHER_INTERVENTION_COLOR = '#9B51E0';

export const INTERVENTION_LABELS: Record<string, string> = {
    'single-tree-registration': 'Single tree registration',
    'sample-tree-registration': 'Sample tree registration',
    'generic-tree-registration': 'Tree registration',
    'multi-tree-registration': 'Multi tree registration',
    'plot-plant-registration': 'Plot plant registration',
    'removal-invasive-species': 'Removing invasive species',
    'fire-suppression': 'Fire suppression team',
    'fire-patrol': 'Fire patrol',
    'fencing': 'Fencing',
    'marking-regenerant': 'Marking regenerant',
    'liberating-regenerant': 'Liberating regenerant',
    'grass-suppression': 'Grass suppression',
    'firebreaks': 'Firebreaks',
    'assisting-seed-rain': 'Seed rain',
    'soil-improvement': 'Soil improvement',
    'stop-tree-harvesting': 'Stop tree harvesting',
    'direct-seeding': 'Direct seeding',
    'enrichment-planting': 'Enrichment planting',
    'maintenance': 'Maintenance',
    'control-livestock': 'Control livestock',
    'other-intervention': 'Other intervention',
};

// ==================== TREE STATUS ====================
// Lightness differs between statuses (not only hue) so they stay apart for
// color-blind viewers. Each dot gets a white ring on the map.
export const TREE_STATUS_COLORS: Record<string, string> = {
    alive: '#22C55E',
    sick: '#F59E0B',
    dead: '#DC2626',
    removed: '#64748B',
    unknown: '#A1A1AA',
};
export const TREE_STATUS_ORDER = ['alive', 'sick', 'dead', 'removed', 'unknown'] as const;

// ==================== MAP STROKES ====================
export const HALO_COLOR = '#FFFFFF';
// Soft dark edge under every colored line, so light colors stay crisp on
// satellite imagery.
export const CASING_COLOR = '#000000';
export const SITE_BOUNDARY_COLOR = '#FFFFFF';
export const CLUSTER_COLOR = '#09090B';

// ==================== BASEMAPS ====================
// Satellite uses Esri World Imagery (raster, no key). Light/Dark use CARTO's
// free vector styles (no key, attribution carried in the style).
// Text on the map (site names, cluster counts) is rendered as HTML markers, so
// no style needs map glyphs.
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
