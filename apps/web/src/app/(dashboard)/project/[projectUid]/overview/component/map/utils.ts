// Pure helpers for the overview map: geometry validation, formatting, color +
// icon lookups, camera helpers and the canvas tree-marker image.
import * as turf from '@turf/turf';
import { Trees, Sprout, Shield, Activity, Leaf, Target, type LucideIcon } from 'lucide-react';
import { cdnUrl } from '@/lib/cdn';
import { BRAND } from './constants';
import type { MapIntervention, MapTree, ProjectMapBounds } from './types';

export const validateGeoJSONGeometry = (geometry: any): boolean => {
    try {
        if (!geometry || !geometry.type || !geometry.coordinates) return false;
        switch (geometry.type) {
            case 'Point':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length >= 2 &&
                    typeof geometry.coordinates[0] === 'number' &&
                    typeof geometry.coordinates[1] === 'number' &&
                    isFinite(geometry.coordinates[0]) &&
                    isFinite(geometry.coordinates[1]) &&
                    Math.abs(geometry.coordinates[0]) <= 180 &&
                    Math.abs(geometry.coordinates[1]) <= 90
                );
            case 'Polygon':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0 &&
                    Array.isArray(geometry.coordinates[0]) &&
                    geometry.coordinates[0].length >= 3
                );
            case 'MultiPolygon':
                return (
                    Array.isArray(geometry.coordinates) &&
                    geometry.coordinates.length > 0
                );
            default:
                return false;
        }
    } catch {
        return false;
    }
};

// Build the pine-tree marker image used by the cluster + point symbol layers.
// Re-created on every style load (setStyle drops custom images), guarded so it
// is only added once per style.
export const createTreeIcon = (map: any) => {
    try {
        if (!map || map.hasImage?.('tree-icon')) return;
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(2, 10); ctx.lineTo(22, 10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(1, 16); ctx.lineTo(23, 16); ctx.closePath(); ctx.fill();
        ctx.fillRect(10, 15, 4, 7);
        if (!map.hasImage('tree-icon')) {
            map.addImage('tree-icon', ctx.getImageData(0, 0, size, size));
        }
    } catch { /* image add failed; icons fall back to circles */ }
};

export const getInterventionColor = (type: string): string => {
    const colors: Record<string, string> = {
        'single-tree-registration': BRAND,
        'multi-tree-registration': BRAND,
        'direct-seeding': '#005c37',
        'enrichment-planting': '#009a5c',
        'maintenance': '#00b36b',
        'monitoring': '#004d30',
        'removal-invasive-species': '#c53030',
    };
    return colors[type] ?? BRAND;
};

// Intervention type -> icon, mirroring the interventions list page so the
// overview reads consistently with the rest of the dashboard.
export const interventionTypeIcons: Record<string, LucideIcon> = {
    'enrichment-planting': Trees,
    'direct-seeding': Sprout,
    'removal-invasive-species': Shield,
    'maintenance': Activity,
    'fencing': Shield,
    'fire-patrol': Shield,
    'soil-improvement': Leaf,
    'grass-suppression': Leaf,
    'single-tree-registration': Trees,
    'multi-tree-registration': Trees,
    'other-intervention': Target,
};

export const getInterventionIcon = (type: string): LucideIcon =>
    interventionTypeIcons[type] ?? Target;

export const getTreeStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        alive: '#10b981',
        dead: '#dc2626',
        sick: '#f59e0b',
        unknown: '#6b7280',
        removed: '#374151',
    };
    return colors[status] ?? '#6b7280';
};

export const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
};

// Resolve the stored tree image key into a full CDN URL. Mirrors the logic in
// TreeCard: migrated trees keep their legacy coordinate path, everything else
// lives under the project CDN's `tree/` folder. A value that is already a full
// URL is passed through untouched.
export const buildTreeImageUrl = (tree: MapTree): string | null => {
    if (!tree.image) return null;
    if (/^https?:\/\//i.test(tree.image)) return tree.image;
    if (tree.migratedTree && /\.(jpe?g|png)$/i.test(tree.image)) {
        return `https://cdn.plant-for-the-planet.org/media/cache/coordinate/large/${tree.image}`;
    }
    return cdnUrl('tree', tree.image);
};

// Scientific species reference image lives under the CDN's `species/` folder.
export const buildSpeciesImageUrl = (image?: string): string | null => {
    return cdnUrl('species', image);
};

export const formatHeight = (v?: number | null): string | null =>
    v == null ? null : `${v} m`;

export const formatWidth = (v?: number | null): string | null =>
    v == null ? null : `${v} cm`;

// Group a number with thousands separators, up to `digits` decimals.
export const formatNum = (n: number, digits = 0): string =>
    n.toLocaleString('en-US', { maximumFractionDigits: digits });

// Format an area in m² into a human-readable label.
// >= 10,000 m² (1 ha) → show in hectares; otherwise m². Thousands grouped.
export const formatArea = (sqm: number): string =>
    sqm >= 10_000
        ? `${formatNum(sqm / 10_000, 2)} ha`
        : `${formatNum(sqm, 2)} m²`;

// Resolve the display area for an intervention. Prefers the stored value;
// falls back to computing from the polygon geometry when it is missing.
export const resolveArea = (intervention: MapIntervention): string => {
    if (intervention.area) return formatArea(intervention.area);
    if (
        intervention.location.type === 'Polygon' ||
        intervention.location.type === 'MultiPolygon'
    ) {
        try {
            const sqm = turf.area(intervention.location as any);
            if (sqm > 0) return formatArea(sqm);
        } catch { /* ignore */ }
    }
    return '—';
};

// First-letter initials for an avatar fallback when no photo is available.
export const initialsOf = (name?: string | null): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

export const getMarkerPosition = (intervention: MapIntervention): [number, number] => {
    try {
        if (intervention.location.type === 'Point') {
            return intervention.location.coordinates as [number, number];
        }
        if (intervention.centroid) {
            return intervention.centroid.coordinates as [number, number];
        }
        const centroid = turf.centroid(intervention.location as any);
        return centroid.geometry.coordinates as [number, number];
    } catch {
        return [0, 0];
    }
};

export const zoomToIntervention = (intervention: MapIntervention, mapRef: any) => {
    if (!mapRef) return;
    try {
        if (intervention.location.type === 'Polygon' || intervention.location.type === 'MultiPolygon') {
            const [minLng, minLat, maxLng, maxLat] = turf.bbox(intervention.location as any);
            mapRef.fitBounds([minLng, minLat, maxLng, maxLat], {
                padding: { top: 80, bottom: 80, left: 80, right: 80 },
                duration: 1000,
                maxZoom: 18,
            });
        } else {
            const [lng, lat] = getMarkerPosition(intervention);
            if (isFinite(lng) && isFinite(lat)) {
                mapRef.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
            }
        }
    } catch { /* ignore */ }
};

export const calculateBounds = (interventions: MapIntervention[]): ProjectMapBounds => {
    try {
        if (interventions.length === 0) {
            return { bounds: [-180, -85, 180, 85], center: [0, 0] };
        }
        const allCoords: number[][] = [];
        interventions.forEach(i => {
            if (i.location.type === 'Point') {
                allCoords.push(i.location.coordinates as number[]);
            } else {
                try {
                    const c = turf.centroid(i.location as any);
                    allCoords.push(c.geometry.coordinates);
                } catch { /* skip */ }
            }
        });
        if (allCoords.length === 0) return { bounds: [-180, -85, 180, 85], center: [0, 0] };

        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const lngPad = (maxLng - minLng) * 0.1 || 0.01;
        const latPad = (maxLat - minLat) * 0.1 || 0.01;

        return {
            bounds: [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad],
            center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        };
    } catch {
        return { bounds: [-180, -85, 180, 85], center: [0, 0] };
    }
};
