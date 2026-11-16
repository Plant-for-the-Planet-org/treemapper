// DOM markers for landmarks. These are few (tens, not hundreds), so DOM
// markers are fine here and give us lucide icons and CSS hover for free —
// unlike the tree/intervention layers, which need GeoJSON layers for scale.
import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';
import type { Landmark } from './api';
import { LANDMARK_TYPE_CONFIG, landmarkTypeLabel } from './config';

const LandmarkMarkers: React.FC<{
    landmarks: Landmark[];
    selectedUid: string | null;
    onSelect: (landmark: Landmark) => void;
}> = ({ landmarks, selectedUid, onSelect }) => (
    <>
        {landmarks.map(landmark => {
            const [lng, lat] = landmark.location.coordinates;
            if (!isFinite(lng) || !isFinite(lat)) return null;
            const cfg = LANDMARK_TYPE_CONFIG[landmark.type] ?? LANDMARK_TYPE_CONFIG.other;
            const Icon = cfg.icon;
            const selected = landmark.uid === selectedUid;
            return (
                <Marker key={landmark.uid} longitude={lng} latitude={lat} anchor="center">
                    <div className="group relative">
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                onSelect(landmark);
                            }}
                            title={landmark.name}
                            className={cn(
                                'flex items-center justify-center w-[30px] h-[30px] rounded-full shadow-md transition-transform cursor-pointer',
                                'ring-2 ring-white/90 hover:scale-110',
                                selected && 'scale-110 ring-[3px]',
                            )}
                            style={{ backgroundColor: cfg.color }}
                        >
                            <Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
                        </button>
                        {/* Hover tooltip: name + type */}
                        <div
                            className={cn(
                                'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none',
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                            )}
                        >
                            <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap">
                                <div className="text-xs font-medium">{landmark.name}</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {landmarkTypeLabel(landmark.type, landmark.otherLabel)}
                                </div>
                            </div>
                        </div>
                    </div>
                </Marker>
            );
        })}
    </>
);

export default LandmarkMarkers;
