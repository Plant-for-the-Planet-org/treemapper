'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { FieldMapping } from '../utils/parseCSV';

interface Props {
    csvHeaders: string[];
    initialMapping?: Partial<FieldMapping>;
    onConfirm: (mapping: FieldMapping) => void;
    onCancel: () => void;
}

const FieldMappingModal = ({ csvHeaders, initialMapping = {}, onConfirm, onCancel }: Props) => {
    const [geoJSONColumn, setGeoJSONColumn] = useState(initialMapping.geoJSONFileName ?? '');
    const [dateColumn, setDateColumn] = useState(initialMapping.plantationDate ?? '');
    const [speciesRows, setSpeciesRows] = useState<string[]>(
        initialMapping.speciesColumns?.length ? initialMapping.speciesColumns : ['']
    );

    const addSpeciesRow = () => {
        if (speciesRows.length >= 20) return;
        setSpeciesRows(prev => [...prev, '']);
    };

    const removeSpeciesRow = (i: number) => {
        setSpeciesRows(prev => prev.filter((_, idx) => idx !== i));
    };

    const updateSpeciesRow = (i: number, value: string) => {
        setSpeciesRows(prev => prev.map((s, idx) => (idx === i ? value : s)));
    };

    const mappedSpecies = speciesRows.filter(s => s !== '');
    const isValid = geoJSONColumn && dateColumn && mappedSpecies.length > 0;

    const handleConfirm = () => {
        if (!isValid) return;
        onConfirm({
            geoJSONFileName: geoJSONColumn,
            plantationDate: dateColumn,
            speciesColumns: mappedSpecies,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Map CSV Fields</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Match your CSV column headers to the fields TreeMapper expects.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4 flex-shrink-0"
                    >
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* Auto-detect notice */}
                    {(initialMapping.geoJSONFileName || initialMapping.plantationDate || initialMapping.speciesColumns?.length) && (
                        <div className="flex items-center gap-2 text-xs text-[#007A49] bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <span className="font-medium">Fields were auto-detected.</span>
                            <span className="text-gray-500">Review and adjust if needed.</span>
                        </div>
                    )}

                    {/* Required fields */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Required fields</p>

                        <FieldRow label="GeoJSON File Name" required autoDetected={!!initialMapping.geoJSONFileName}>
                            <HeaderSelect
                                value={geoJSONColumn}
                                onChange={setGeoJSONColumn}
                                headers={csvHeaders}
                            />
                        </FieldRow>

                        <FieldRow label="Plantation Date" required autoDetected={!!initialMapping.plantationDate}>
                            <HeaderSelect
                                value={dateColumn}
                                onChange={setDateColumn}
                                headers={csvHeaders}
                            />
                        </FieldRow>
                    </div>

                    {/* Species fields */}
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                Species columns
                            </p>
                            <p className="text-xs text-gray-400">
                                {mappedSpecies.length} mapped, up to 20
                            </p>
                        </div>

                        {speciesRows.map((col, i) => (
                            <FieldRow key={i} label={`Species ${i + 1}`} autoDetected={!!initialMapping.speciesColumns?.[i]}>
                                <div className="flex items-center gap-2">
                                    <HeaderSelect
                                        value={col}
                                        onChange={val => updateSpeciesRow(i, val)}
                                        headers={csvHeaders}
                                        placeholder="Not mapped"
                                    />
                                    {speciesRows.length > 1 && (
                                        <button
                                            onClick={() => removeSpeciesRow(i)}
                                            className="p-1.5 hover:bg-red-50 rounded-md text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </FieldRow>
                        ))}

                        {speciesRows.length < 20 && (
                            <button
                                onClick={addSpeciesRow}
                                className="flex items-center gap-1.5 text-sm text-[#007A49] hover:text-[#006B3F] transition-colors mt-1"
                            >
                                <Plus className="h-4 w-4" />
                                Add species column
                            </button>
                        )}
                    </div>

                    {/* Hint when not valid */}
                    {!isValid && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>Map all required fields and at least one species column to continue.</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className="flex-1 px-4 py-2 bg-[#007A49] text-white rounded-lg text-sm font-medium hover:bg-[#006B3F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Apply Mapping
                    </button>
                </div>
            </div>
        </div>
    );
};

const FieldRow = ({
    label,
    required,
    autoDetected,
    children,
}: {
    label: string;
    required?: boolean;
    autoDetected?: boolean;
    children: React.ReactNode;
}) => (
    <div className="flex items-center gap-3">
        <div className="w-36 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </span>
            {autoDetected && (
                <span className="block text-xs text-[#007A49] mt-0.5">Auto-detected</span>
            )}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

const HeaderSelect = ({
    value,
    onChange,
    headers,
    placeholder = 'Select column',
}: {
    value: string;
    onChange: (v: string) => void;
    headers: string[];
    placeholder?: string;
}) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#007A49] bg-white"
    >
        <option value="">— {placeholder} —</option>
        {headers.map(h => (
            <option key={h} value={h}>{h}</option>
        ))}
    </select>
);

export default FieldMappingModal;
