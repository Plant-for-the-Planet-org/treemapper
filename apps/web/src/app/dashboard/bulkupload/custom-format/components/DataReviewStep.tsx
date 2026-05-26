'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Trash2, Upload } from 'lucide-react';
import { Intervention } from '../types';
import InterventionCard from './InterventionCard';

interface Props {
    interventions: Intervention[];
    onUpdate: (id: string, updates: Partial<Intervention>) => void;
    onDelete: (id: string) => void;
    onDeleteAllInvalid: () => void;
    onDeleteMissingGeoJSON: () => void;
    onStartUpload: () => void;
}

const DataReviewStep = ({
    interventions,
    onUpdate,
    onDelete,
    onDeleteAllInvalid,
    onDeleteMissingGeoJSON,
    onStartUpload,
}: Props) => {
    const total = interventions.length;
    const invalid = interventions.filter(i => !i.validation.isValid).length;
    const missingGeoJSON = interventions.filter(i => i.validation.isValid && !i.geojson).length;
    const ready = interventions.filter(i => i.validation.isValid && i.geojson).length;
    const totalTrees = interventions.reduce((sum, i) => sum + i.species.reduce((s, sp) => s + sp.count, 0), 0);
    const readyPercent = total > 0 ? Math.round((ready / total) * 100) : 0;
    const canUpload = ready > 0 && invalid === 0 && missingGeoJSON === 0;

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{total}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Total records</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">{ready}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Ready</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-500">{missingGeoJSON}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Missing GeoJSON</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-500">{invalid}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Invalid</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{totalTrees.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Total trees</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Upload readiness</span>
                        <span>{readyPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#007A49] rounded-full transition-all duration-500"
                            style={{ width: `${readyPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {invalid > 0 && (
                        <button
                            onClick={onDeleteAllInvalid}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete all invalid ({invalid})
                        </button>
                    )}
                    {missingGeoJSON > 0 && (
                        <button
                            onClick={onDeleteMissingGeoJSON}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-yellow-200 text-yellow-700 rounded-md text-sm hover:bg-yellow-50 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete missing GeoJSON ({missingGeoJSON})
                        </button>
                    )}
                </div>

                <button
                    onClick={onStartUpload}
                    disabled={!canUpload}
                    className="flex items-center gap-2 px-5 py-2 bg-[#007A49] text-white rounded-lg text-sm font-medium hover:bg-[#006B3F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Upload className="h-4 w-4" />
                    Upload {ready} record{ready !== 1 ? 's' : ''}
                </button>
            </div>

            {!canUpload && (ready > 0 || invalid > 0 || missingGeoJSON > 0) && (
                <p className="text-xs text-gray-500">
                    Fix or remove all invalid and missing GeoJSON records before uploading.
                </p>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                    {interventions.map(inv => (
                        <InterventionCard
                            key={inv.id}
                            intervention={inv}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {interventions.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">No records remaining.</p>
                </div>
            )}
        </div>
    );
};

export default DataReviewStep;
