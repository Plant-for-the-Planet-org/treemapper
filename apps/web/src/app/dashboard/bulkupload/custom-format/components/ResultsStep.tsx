'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { UploadResult } from '../types';

interface Props {
    result: UploadResult;
    onStartOver: () => void;
    onGoToDashboard: () => void;
}

const ResultsStep = ({ result, onStartOver, onGoToDashboard }: Props) => {
    const allSucceeded = result.successCount > 0 && result.errorCount === 0;
    const allFailed = result.successCount === 0 && result.errorCount > 0;
    const partial = result.successCount > 0 && result.errorCount > 0;

    return (
        <div className="max-w-xl mx-auto py-10 space-y-5">

            {/* Status card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-6 text-center shadow-sm ${allSucceeded ? 'bg-green-50 border-green-200' : allFailed ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}
            >
                {allSucceeded && (
                    <>
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                        <h2 className="text-xl font-semibold text-green-800">Upload successful</h2>
                        <p className="text-sm text-green-700 mt-1">
                            {result.successCount} record{result.successCount !== 1 ? 's' : ''} uploaded successfully.
                        </p>
                    </>
                )}

                {allFailed && (
                    <>
                        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                        <h2 className="text-xl font-semibold text-red-800">Upload failed</h2>
                        <p className="text-sm text-red-700 mt-1">
                            {result.errorRecords[0]?.error ?? 'An error occurred. Please check your data and try again.'}
                        </p>
                    </>
                )}

                {partial && (
                    <>
                        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                        <h2 className="text-xl font-semibold text-yellow-800">Partially uploaded</h2>
                        <p className="text-sm text-yellow-700 mt-1">
                            {result.successCount} succeeded, {result.errorCount} failed.
                        </p>
                    </>
                )}

                {/* Counts */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-black/10">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{result.totalProcessed}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Total</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Successful</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-500">{result.errorCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Failed</p>
                    </div>
                </div>
            </motion.div>

            {/* Failed record details */}
            {result.errorRecords.length > 0 && !allFailed && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-red-200 rounded-xl p-4"
                >
                    <p className="text-sm font-semibold text-red-700 mb-2">Failed records</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                        {result.errorRecords.map((rec, i) => (
                            <div key={i} className="text-xs bg-red-50 rounded p-2 border border-red-100">
                                <p className="font-medium text-gray-800">{rec.intervention.beneficiary}</p>
                                <p className="text-red-600 mt-0.5">{rec.error}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onGoToDashboard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#007A49] text-white rounded-lg text-sm font-medium hover:bg-[#006B3F] transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                </button>
                <button
                    onClick={onStartOver}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                    Upload another file
                </button>
            </div>
        </div>
    );
};

export default ResultsStep;
