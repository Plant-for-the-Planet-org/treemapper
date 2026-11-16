// Landmark type catalogue: label, map icon and marker color per type.
// Mirrors the server's `landmark_type` pg enum; keep the two in step.
import type { LucideIcon } from 'lucide-react';
import {
    Sprout,
    Users,
    GraduationCap,
    Building2,
    Warehouse,
    Droplets,
    MapPin,
} from 'lucide-react';

export const LANDMARK_TYPES = [
    'nursery',
    'meeting_point',
    'school',
    'office',
    'storage',
    'water_source',
    'other',
] as const;

export type LandmarkType = (typeof LANDMARK_TYPES)[number];

export const LANDMARK_TYPE_CONFIG: Record<LandmarkType, { label: string; icon: LucideIcon; color: string }> = {
    nursery: { label: 'Nursery', icon: Sprout, color: '#15803d' },
    meeting_point: { label: 'Meeting point', icon: Users, color: '#2563eb' },
    school: { label: 'School', icon: GraduationCap, color: '#7c3aed' },
    office: { label: 'Office', icon: Building2, color: '#475569' },
    storage: { label: 'Storage', icon: Warehouse, color: '#b45309' },
    water_source: { label: 'Water source', icon: Droplets, color: '#0891b2' },
    other: { label: 'Other', icon: MapPin, color: '#db2777' },
};

/** The label shown to users: the custom label for 'other', the catalogue label otherwise. */
export function landmarkTypeLabel(type: LandmarkType, otherLabel?: string | null): string {
    if (type === 'other' && otherLabel) return otherLabel;
    return LANDMARK_TYPE_CONFIG[type]?.label ?? type;
}
