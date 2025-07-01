'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { downloadTreeMapperTemplate } from '../../../../utils/downloadTemplate';


const InfoSection = (props: any) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false)

    const { setFileData, updateStep } = props

    const validateFile = (file) => {
        if (!file) {
            setError('Please select a file');
            return false;
        }

        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
            setError('Please upload a valid CSV file. Only .csv format is supported.');
            return false;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File size must be less than 10MB');
        }


        return true;
    };

    const handleConverion = async () => {
        setLoading(true)
        try {
            if (!fileInputRef?.current?.files?.[0]) {
                throw new Error('No file selected');
            }

            const file = fileInputRef.current.files[0];
            const text = await file.text();

            const result = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                trimHeaders: true,
                transformHeader: (header) => header.trim()
            });

            if (result.errors.length > 0) {
                console.warn("CSV parsing warnings:", result.errors);
            }

            console.log("Parsed CSV data:", result.data);
            setFileData(result.data);
            updateStep(2);
        } catch (error) {
            console.error("CSV parsing error:", error);
            setError("Error occurred while transforming data: " + error.message);
            setLoading(false);
        }
        setLoading(false);
    }
    const handleFileSelect = (file) => {
        setError('');

        if (validateFile(file)) {
            setSelectedFile(file);
            // Here you would typically process the file or move to next step
            console.log('File selected:', file.name);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadTemplate =  () => {
        // Placeholder function - you'll implement the actual download logic
         downloadTreeMapperTemplate()
    };

    return (
        <div className="h-full w-full bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Instructions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center mb-4">
                            <FileText className="h-5 w-5 text-[#007A49] mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">How to Bulk Upload Data</h2>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">1.</span>
                                <div>
                                    <span className="font-semibold">Download the Template:</span> Download the template provided. It follows the format required for bulk data uploads.
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">2.</span>
                                <div>
                                    <span className="font-semibold">Prepare Your Data:</span> We only support CSV format. After entering your data into Excel or Google Sheets using the template structure, export the file as a <code className="bg-gray-100 px-1 rounded">.csv</code>.
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">3.</span>
                                <div>
                                    <span className="font-semibold">Import the CSV:</span> Go to the dashboard and click <span className="font-semibold">"Import CSV"</span> to upload your file.
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">4.</span>
                                <div>
                                    <span className="font-semibold">Validate and Edit:</span> We'll automatically validate the required fields. On the next screen, you'll have a chance to review and edit any data that needs correction.
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">5.</span>
                                <div>
                                    <span className="font-semibold">Species Data:</span> We only support species that exist in our database of over 60,000 entries. Please search using the scientific name.
                                    <ul className="mt-1 ml-4 space-y-1">
                                        <li>• If you can't find a species, mark it as <span className="font-semibold">"Unknown"</span>.</li>
                                        <li>• You can also request the addition of new species.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="font-semibold text-gray-900 mr-2">6.</span>
                                <div>
                                    <span className="font-semibold">Final Upload:</span> Once everything looks good, click <span className="font-semibold">"Upload Data"</span> to complete the process.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </button>
                    </div>
                </div>

                {/* Right Column - File Upload */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Your CSV File</h3>

                        {/* File Upload Area */}
                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-[#007A49] transition-colors ${dragActive ? 'border-[#007A49] bg-green-50' : 'border-gray-300'
                                } ${selectedFile ? 'border-green-300 bg-green-50' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            {selectedFile ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-2"
                                >
                                    <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                                    <div className="flex items-center justify-center space-x-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                                        <button
                                            onClick={removeFile}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <X className="h-3 w-3 text-gray-400" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium text-[#007A49] hover:text-green-600 cursor-pointer">
                                            Click to upload
                                        </span>{' '}
                                        or drag and drop
                                    </div>
                                    <p className="text-xs text-gray-500">CSV files only (max 10MB)</p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 flex items-center space-x-2 text-red-600 text-sm"
                            >
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Next Button */}
                        {selectedFile && !error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6"
                            >
                                <button
                                    onClick={handleConverion}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#007A49] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors">
                                    {loading ? 'Processing' : <>
                                        Continue to Next Step
                                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg></>}
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* File Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">File Requirements:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Only CSV format is supported</li>
                                    <li>• Maximum file size: 10MB</li>
                                    <li>• Use the provided template structure</li>
                                    <li>• Ensure data is properly formatted</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoSection;