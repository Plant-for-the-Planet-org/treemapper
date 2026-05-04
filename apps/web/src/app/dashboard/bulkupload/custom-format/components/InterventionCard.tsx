'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Edit2, Trash2, Plus, Minus, Map as MapIcon, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Intervention, Species } from '../types';
import { validateIntervention } from '../utils/parseCSV';
import { parseGeoJSONFile, extractBeneficiaryFromFilename } from '../utils/geojsonUtils';

interface Props {
    intervention: Intervention;
    onUpdate: (id: string, updates: Partial<Intervention>) => void;
    onDelete: (id: string) => void;
}

type Status = 'ready' | 'missing-geojson' | 'invalid';

function getStatus(inv: Intervention): Status {
    if (!inv.validation.isValid) return 'invalid';
    if (!inv.geojson) return 'missing-geojson';
    return 'ready';
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string; border: string }> = {
    ready: { label: 'Ready', dot: 'bg-green-500', border: 'border-green-200' },
    'missing-geojson': { label: 'Missing GeoJSON', dot: 'bg-yellow-400', border: 'border-yellow-200' },
    invalid: { label: 'Invalid', dot: 'bg-red-500', border: 'border-red-200' },
};

const InterventionCard = ({ intervention, onUpdate, onDelete }: Props) => {
    const [editing, setEditing] = useState(false);
    const [editDate, setEditDate] = useState(intervention.plantDate);
    const [editSpecies, setEditSpecies] = useState<Species[]>(intervention.species);
    const [geojsonError, setGeojsonError] = useState('');
    const geojsonInputRef = useRef<HTMLInputElement>(null);

    const status = getStatus(intervention);
    const cfg = STATUS_CONFIG[status];
    const totalTrees = intervention.species.reduce((sum, s) => sum + s.count, 0);

    const handleSave = () => {
        const validation = validateIntervention(editDate, editSpecies);
        onUpdate(intervention.id, {
            plantDate: editDate,
            species: editSpecies,
            isEdited: true,
            validation: {
                ...validation,
                needsGeoJSON: !intervention.geojson,
            },
        });
        setEditing(false);
    };

    const handleCancel = () => {
        setEditDate(intervention.plantDate);
        setEditSpecies(intervention.species);
        setEditing(false);
    };

    const handleSpeciesChange = (index: number, field: keyof Species, value: string) => {
        setEditSpecies(prev => prev.map((s, i) =>
            i === index ? { ...s, [field]: field === 'count' ? (parseInt(value, 10) || 0) : value } : s
        ));
    };

    const addSpecies = () => {
        if (editSpecies.length >= 15) return;
        setEditSpecies(prev => [...prev, { name: '', count: 1 }]);
    };

    const removeSpecies = (index: number) => {
        setEditSpecies(prev => prev.filter((_, i) => i !== index));
    };

    const handleGeoJSONUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setGeojsonError('');
        try {
            const data = await parseGeoJSONFile(file);
            const beneficiary = extractBeneficiaryFromFilename(file.name) ?? intervention.beneficiary;
            const validation = validateIntervention(intervention.plantDate, intervention.species);
            onUpdate(intervention.id, {
                geojson: data,
                geojsonFileName: file.name,
                validation: { ...validation, needsGeoJSON: false },
            });
        } catch {
            setGeojsonError('Invalid GeoJSON file.');
        }
        if (geojsonInputRef.current) geojsonInputRef.current.value = '';
    };

    const removeGeoJSON = () => {
        const validation = validateIntervention(intervention.plantDate, intervention.species);
        onUpdate(intervention.id, {
            geojson: null,
            geojsonFileName: null,
            validation: { ...validation, needsGeoJSON: true },
        });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`bg-white rounded-lg border shadow-sm p-4 ${cfg.border}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <p className="font-semibold text-gray-900 text-sm truncate">{intervention.beneficiary}</p>
                    {intervention.isEdited && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 flex-shrink-0">Edited</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'ready' ? 'bg-green-50 text-green-700' : status === 'missing-geojson' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                        {cfg.label}
                    </span>
                    {!editing && (
                        <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                            <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                    )}
                    <button onClick={() => onDelete(intervention.id)} className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                </div>
            </div>

            {/* Errors */}
            {!intervention.validation.isValid && (
                <div className="mt-2 space-y-1">
                    {intervention.validation.errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{err}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* View mode */}
            {!editing && (
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                        <span><span className="text-gray-400 text-xs">Date</span> <span className="font-medium text-gray-800">{intervention.plantDate || '—'}</span></span>
                        <span><span className="text-gray-400 text-xs">Trees</span> <span className="font-medium text-gray-800">{totalTrees}</span></span>
                        <span><span className="text-gray-400 text-xs">Species</span> <span className="font-medium text-gray-800">{intervention.species.length}</span></span>
                    </div>

                    {intervention.species.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {intervention.species.map((s, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">
                                    {s.name.split('(')[0].trim()} × {s.count}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit mode */}
            {editing && (
                <div className="mt-3 space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 font-medium">Plantation Date (MM/DD/YYYY)</label>
                        <input
                            type="text"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            placeholder="e.g. 03/15/2024"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#007A49]"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-gray-500 font-medium">Species</label>
                            {editSpecies.length < 15 && (
                                <button onClick={addSpecies} className="flex items-center gap-1 text-xs text-[#007A49] hover:text-[#006B3F]">
                                    <Plus className="h-3 w-3" /> Add species
                                </button>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            {editSpecies.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={s.name}
                                        onChange={e => handleSpeciesChange(i, 'name', e.target.value)}
                                        placeholder="Species name"
                                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#007A49]"
                                    />
                                    <input
                                        type="number"
                                        value={s.count}
                                        min={1}
                                        onChange={e => handleSpeciesChange(i, 'count', e.target.value)}
                                        className="w-16 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#007A49]"
                                    />
                                    <button onClick={() => removeSpecies(i)} className="p-1 hover:bg-red-50 rounded">
                                        <Minus className="h-3 w-3 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-[#007A49] text-white rounded text-xs font-medium hover:bg-[#006B3F] transition-colors">
                            <Save className="h-3 w-3" /> Save
                        </button>
                        <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                            <X className="h-3 w-3" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* GeoJSON section */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                {intervention.geojson ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-green-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">{intervention.geojsonFileName}</span>
                        </div>
                        <button onClick={removeGeoJSON} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-yellow-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>No GeoJSON attached</span>
                        </div>
                        <button
                            onClick={() => geojsonInputRef.current?.click()}
                            className="flex items-center gap-1 text-xs text-[#007A49] hover:text-[#006B3F] font-medium transition-colors"
                        >
                            <MapIcon className="h-3.5 w-3.5" /> Upload GeoJSON
                        </button>
                        <input ref={geojsonInputRef} type="file" accept=".geojson,.json" onChange={handleGeoJSONUpload} className="hidden" />
                    </div>
                )}
                {geojsonError && <p className="mt-1 text-xs text-red-500">{geojsonError}</p>}
            </div>
        </motion.div>
    );
};

export default InterventionCard;
