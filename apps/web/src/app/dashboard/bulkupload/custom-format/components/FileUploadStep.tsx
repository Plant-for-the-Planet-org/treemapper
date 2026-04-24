'use client';

import React, { useRef, useState } from 'react';
import { Upload, FolderOpen, FileText, CheckCircle, AlertCircle, X, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCsvSample, parseCSVWithMapping, autoMapFields, FieldMapping } from '../utils/parseCSV';
import { parseGeoJSONFile, extractBeneficiaryFromFilename } from '../utils/geojsonUtils';
import { Intervention } from '../types';
import FieldMappingModal from './FieldMappingModal';

interface Props {
    onDataLoaded: (interventions: Intervention[], geojsonMap: Map<string, { data: any; fileName: string }>) => void;
}

const FileUploadStep = ({ onDataLoaded }: Props) => {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [suggestedMapping, setSuggestedMapping] = useState<Partial<FieldMapping>>({});
    const [csvDragActive, setCsvDragActive] = useState(false);
    const [geojsonFiles, setGeojsonFiles] = useState<Map<string, { data: any; fileName: string }>>(new Map());
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const csvInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleCsvSelect = async (file: File) => {
        setError('');
        if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
            setError('Please upload a valid CSV file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            return;
        }
        setCsvFile(file);
        const { headers, sampleRows } = await getCsvSample(file);
        setCsvHeaders(headers);
        setSuggestedMapping(autoMapFields(headers, sampleRows));
    };

    const handleCsvDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setCsvDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleCsvSelect(file);
    };

    const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const geojsonOnly = files.filter(f => f.name.match(/\.(geojson|json)$/i));

        const map = new Map<string, { data: any; fileName: string }>();
        await Promise.all(
            geojsonOnly.map(async (file) => {
                const beneficiary = extractBeneficiaryFromFilename(file.name);
                if (!beneficiary) return;
                try {
                    const data = await parseGeoJSONFile(file);
                    map.set(beneficiary, { data, fileName: file.name });
                } catch {
                    // skip unparseable files
                }
            })
        );
        setGeojsonFiles(map);
    };

    const handleMappingConfirm = async (mapping: FieldMapping) => {
        setShowMappingModal(false);
        setLoading(true);
        setError('');
        try {
            const interventions = await parseCSVWithMapping(csvFile!, mapping);

            const matched = interventions.map(inv => {
                const match = geojsonFiles.get(inv.beneficiary);
                if (match) {
                    return { ...inv, geojson: match.data, geojsonFileName: match.fileName };
                }
                return inv;
            });

            onDataLoaded(matched, geojsonFiles);
        } catch (err: any) {
            setError('Failed to parse CSV: ' + (err?.message ?? 'Unknown error'));
        }
        setLoading(false);
    };

    return (
        <>
            {showMappingModal && (
                <FieldMappingModal
                    csvHeaders={csvHeaders}
                    initialMapping={suggestedMapping}
                    onConfirm={handleMappingConfirm}
                    onCancel={() => setShowMappingModal(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: CSV Upload */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload CSV File</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Your CSV can have any column headers. You will map them to TreeMapper fields in the next step.
                        </p>

                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${csvDragActive ? 'border-[#007A49] bg-green-50' : csvFile ? 'border-[#007A49] bg-green-50' : 'border-gray-300 hover:border-[#007A49]'}`}
                            onDragEnter={e => { e.preventDefault(); setCsvDragActive(true); }}
                            onDragLeave={e => { e.preventDefault(); setCsvDragActive(false); }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleCsvDrop}
                        >
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv"
                                onChange={e => e.target.files?.[0] && handleCsvSelect(e.target.files[0])}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {csvFile ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                                    <CheckCircle className="mx-auto h-8 w-8 text-[#007A49]" />
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">{csvFile.name}</span>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setCsvFile(null);
                                                setCsvHeaders([]);
                                                setSuggestedMapping({});
                                                if (csvInputRef.current) csvInputRef.current.value = '';
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded-full"
                                        >
                                            <X className="h-3 w-3 text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                                    {csvHeaders.length > 0 && (
                                        <p className="text-xs text-[#007A49]">{csvHeaders.length} columns detected</p>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium text-[#007A49] cursor-pointer">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">CSV files only (max 10MB)</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-medium mb-1">Any CSV format works</p>
                        <p className="text-xs text-blue-700">
                            After uploading, you will map your column headers to: GeoJSON file name, plantation date, and species columns (up to 20).
                        </p>
                    </div>
                </div>

                {/* Right: GeoJSON Folder */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Select GeoJSON Location Folder</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Select the folder containing GeoJSON files. Files must be named like{' '}
                            <span className="font-mono text-xs bg-gray-100 px-1 rounded">1_Beneficiary Name.geojson</span>.
                        </p>

                        <button
                            onClick={() => folderInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#007A49] rounded-lg p-6 text-center transition-colors group"
                        >
                            <input
                                ref={folderInputRef}
                                type="file"
                                multiple
                                onChange={handleFolderSelect}
                                className="hidden"
                                // @ts-ignore
                                webkitdirectory=""
                            />
                            <div className="space-y-2">
                                <FolderOpen className="mx-auto h-8 w-8 text-gray-400 group-hover:text-[#007A49] transition-colors" />
                                <p className="text-sm text-gray-600 group-hover:text-gray-800">
                                    <span className="font-medium text-[#007A49]">Select folder</span> with GeoJSON files
                                </p>
                                <p className="text-xs text-gray-500">Supports .geojson and .json files</p>
                            </div>
                        </button>

                        {geojsonFiles.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <MapIcon className="h-4 w-4 text-[#007A49]" />
                                    <span className="text-sm font-medium text-[#007A49]">
                                        {geojsonFiles.size} GeoJSON file{geojsonFiles.size !== 1 ? 's' : ''} loaded
                                    </span>
                                </div>
                                <ul className="mt-2 text-xs text-gray-600 space-y-0.5 max-h-28 overflow-y-auto">
                                    {Array.from(geojsonFiles.entries()).map(([name, { fileName }]) => (
                                        <li key={name} className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-[#007A49] flex-shrink-0" />
                                            <span className="truncate">{fileName}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

                        {geojsonFiles.size === 0 && (
                            <p className="mt-3 text-xs text-gray-400 text-center">
                                Optional. You can also add GeoJSON per record in the next step.
                            </p>
                        )}
                    </div>

                    {csvFile && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <button
                                onClick={() => setShowMappingModal(true)}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#007A49] hover:bg-[#006B3F] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                            >
                                {loading ? 'Loading data...' : (
                                    <>
                                        Map Fields and Load Data
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FileUploadStep;
