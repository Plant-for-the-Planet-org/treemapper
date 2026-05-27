'use client';

// TODO: shadcn migration — follow apps/web/UI_MIGRATION_GUIDE.md (sibling /bulkupload main flow already migrated)
import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useToken } from '@/context/useTokenContext';

import FileUploadStep from './components/FileUploadStep';
import DataReviewStep from './components/DataReviewStep';
import UploadProgressStep from './components/UploadProgressStep';
import ResultsStep from './components/ResultsStep';

import { Intervention, UploadResult } from './types';
import { uploadInterventions } from './utils/uploader';

type Step = 'upload' | 'review' | 'uploading' | 'results';

const STEP_LABELS: Record<Step, string> = {
    upload: 'Upload Files',
    review: 'Review Data',
    uploading: 'Uploading',
    results: 'Results',
};

const STEP_ORDER: Step[] = ['upload', 'review', 'uploading', 'results'];

const CustomFormatPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { accessToken } = useToken();

    const projectId = searchParams.get('projectId') ?? '';
    const projectName = searchParams.get('projectName') ?? '';
    const siteId = searchParams.get('siteId') ?? undefined;
    const siteName = searchParams.get('siteName') ?? '';

    const [step, setStep] = useState<Step>('upload');
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

    const handleDataLoaded = (
        loaded: Intervention[],
        _geojsonMap: Map<string, { data: any; fileName: string }>
    ) => {
        setInterventions(loaded);
        setStep('review');
    };

    const handleUpdate = (id: string, updates: Partial<Intervention>) => {
        setInterventions(prev =>
            prev.map(inv => (inv.id === id ? { ...inv, ...updates } : inv))
        );
    };

    const handleDelete = (id: string) => {
        setInterventions(prev => prev.filter(inv => inv.id !== id));
    };

    const handleDeleteAllInvalid = () => {
        setInterventions(prev => prev.filter(inv => inv.validation.isValid));
    };

    const handleDeleteMissingGeoJSON = () => {
        setInterventions(prev => prev.filter(inv => inv.geojson !== null));
    };

    const handleStartUpload = async () => {
        const ready = interventions.filter(inv => inv.validation.isValid && inv.geojson);
        setUploadProgress({ current: 0, total: ready.length });
        setStep('uploading');

        const result = await uploadInterventions(
            ready,
            accessToken,
            projectId,
            siteId,
            (current, total) => setUploadProgress({ current, total })
        );

        setUploadResult(result);
        setStep('results');
    };

    const handleStartOver = () => {
        setInterventions([]);
        setUploadResult(null);
        setUploadProgress({ current: 0, total: 0 });
        setStep('upload');
    };

    const currentStepIndex = STEP_ORDER.indexOf(step);

    return (
        <div className="min-h-full bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="pb-2 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors group"
            >
                <div className="rounded-lg group-hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Back</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mt-2">Upload Custom Format</h1>

            {/* Project / site pills */}
            {(projectName || siteName) && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                    {projectName && (
                        <span className="bg-green-50 text-[#007A49] border border-green-200 rounded px-2 py-0.5 font-medium text-xs">
                            {projectName}
                        </span>
                    )}
                    {siteName && (
                        <>
                            <span className="text-gray-400">/</span>
                            <span className="bg-gray-100 text-gray-600 border border-gray-200 rounded px-2 py-0.5 text-xs">
                                {siteName}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Step indicator */}
            <div className="mt-8 mb-8">
                <ol className="flex items-center gap-0">
                    {STEP_ORDER.filter(s => s !== 'uploading').map((s, idx, arr) => {
                        const visibleIndex = STEP_ORDER.filter(x => x !== 'uploading').indexOf(s);
                        const actualIndex = STEP_ORDER.indexOf(s);
                        const isDone = currentStepIndex > actualIndex;
                        const isCurrent = step === s || (step === 'uploading' && s === 'review');
                        return (
                            <li key={s} className={`relative flex-1 ${idx !== arr.length - 1 ? 'pr-8 sm:pr-16' : ''}`}>
                                {idx !== arr.length - 1 && (
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className={`h-0.5 w-full ${isDone ? 'bg-[#007A49]' : 'bg-gray-200'}`} />
                                    </div>
                                )}
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: isCurrent || isDone ? '#007A49' : 'lightgray' }}>
                                    {isDone ? (
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#007A49]" />
                                    ) : isCurrent ? (
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#007A49]" />
                                    ) : (
                                        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                                    )}
                                    <div className={`absolute -top-7 text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-[#007A49]' : 'text-gray-400'}`}>
                                        {STEP_LABELS[s]}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {/* Step content */}
            {step === 'upload' && (
                <FileUploadStep onDataLoaded={handleDataLoaded} />
            )}

            {step === 'review' && (
                <DataReviewStep
                    interventions={interventions}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onDeleteAllInvalid={handleDeleteAllInvalid}
                    onDeleteMissingGeoJSON={handleDeleteMissingGeoJSON}
                    onStartUpload={handleStartUpload}
                />
            )}

            {step === 'uploading' && (
                <UploadProgressStep current={uploadProgress.current} total={uploadProgress.total} />
            )}

            {step === 'results' && uploadResult && (
                <ResultsStep
                    result={uploadResult}
                    onStartOver={handleStartOver}
                    onGoToDashboard={() => router.push('/dashboard')}
                />
            )}
        </div>
    );
};

export default CustomFormatPage;
