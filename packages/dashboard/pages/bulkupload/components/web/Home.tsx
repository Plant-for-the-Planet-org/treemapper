'use client';

import React, { useState, useRef } from 'react';

import InfoSection from './InfoSection';
import SelectProjectSite from './SelectProjectSite';
import DataValidation from './DataValidation';
import UploadSuccess from './UploadSuccess';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToken } from '../../../../context/TokenContext'

const Home = ({ goback }) => {
    const { accessToken } = useToken()
    const [currentStep, setCurrentStep] = useState(1)
    const [fileData, setFileData] = useState([]);
    const [selectedProject, setSelectedProject] = useState({ name: '', id: '' });
    const [selectedSite, setSelectedSite] = useState({ name: '', id: '' });
    const [steps, setSteps] = useState([
        { id: 1, name: 'Project', status: 'current' },
        { id: 2, name: 'Upload', status: 'upcoming' },
        { id: 3, name: 'Validate', status: 'upcoming' },
        { id: 4, name: 'Success', status: 'upcoming' }
    ])

    const updateSteps = (i: number) => {
        if (i === 1) {
            setCurrentStep(2)
            setSteps([
                { id: 1, name: 'Project', status: 'complete' },
                { id: 2, name: 'Upload', status: 'current' },
                { id: 3, name: 'Validate', status: 'upcoming' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
        if (i === 2) {
            setCurrentStep(3)
            setSteps([
                { id: 1, name: 'Project', status: 'complete' },
                { id: 2, name: 'Upload', status: 'complete' },
                { id: 3, name: 'Validate', status: 'upcoming' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
        if (i === 3) {
            setCurrentStep(4)
            setSteps([
                { id: 1, name: 'Project', status: 'complete' },
                { id: 2, name: 'Upload', status: 'complete' },
                { id: 3, name: 'Validate', status: 'complete' },
                { id: 4, name: 'Success', status: 'current' }
            ])
        }
        if (i === 4) {
            setCurrentStep(0)
            setSteps([
                { id: 1, name: 'Project', status: 'current' },
                { id: 2, name: 'Upload', status: 'upcoming' },
                { id: 3, name: 'Validate', status: 'upcoming' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
    }

    const prviousStep = (i: number) => {
        if (i === 4) {
            setCurrentStep(3)
            setSteps([
                { id: 1, name: 'Project', status: 'complete' },
                { id: 2, name: 'Upload', status: 'complete' },
                { id: 3, name: 'Validate', status: 'current' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
        if (i === 3) {
            setCurrentStep(2)
            setSteps([
                { id: 1, name: 'Project', status: 'complete' },
                { id: 2, name: 'Upload', status: 'current' },
                { id: 3, name: 'Validate', status: 'upcoming' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
        if (i === 2) {
            setCurrentStep(1)
            setSteps([
                { id: 1, name: 'Project', status: 'current' },
                { id: 2, name: 'Upload', status: 'upcoming' },
                { id: 3, name: 'Validate', status: 'upcoming' },
                { id: 4, name: 'Success', status: 'upcoming' }
            ])
        }
    }

    const handleProjectValidations = (valdiatedData, i) => {
        updateSteps(i)
        setFileData(valdiatedData);
    }

    const handleFinalSelection = ({ projectName, siteName, projectId, siteId }, i) => {
        setSelectedProject({ name: projectName, id: projectId });
        setSelectedSite({ name: siteName, id: siteId || null});
        updateSteps(i)

    }

    return (
        <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 w-full h-full">
            <button
                onClick={goback}
                className="pb-2 flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors group"
            >
                <div className="rounded-lg group-hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Intervention</h1>
            <div style={{ marginTop: 40, marginBottom: 30 }}>
                <nav aria-label="Progress">
                    <ol className="flex items-center">
                        {steps.map((step, stepIdx) => (
                            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex-1`}>
                                {stepIdx !== steps.length - 1 && (
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className={`h-0.5 w-full ${step.status === 'complete' ? 'bg-[#007A49]' : 'bg-gray-200'}`} />
                                    </div>
                                )}

                                {/* Step Circle */}
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white">
                                    {step.status === 'complete' ? (
                                        <CheckCircle className="h-5 w-5 text-[#007A49]" />
                                    ) : step.status === 'current' ? (
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#007A49]" />
                                    ) : (
                                        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                                    )}
                                    <div className={`absolute -top-5 text-sm font-medium ${step.status === 'current' ? 'text-[#007A49]' : 'text-gray-500'
                                        }`}>
                                        {step.name}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {currentStep === 1 && <SelectProjectSite onBack={prviousStep} accessToken={accessToken}
                handleFinalSelection={handleFinalSelection} />}
            {currentStep === 2 && <InfoSection setFileData={setFileData} updateStep={updateSteps} />}
            {currentStep === 3 && < DataValidation fileData={fileData} onBack={prviousStep} onNext={handleProjectValidations} />}
            {currentStep === 4 && <UploadSuccess validatedData={fileData} selectedProject={selectedProject} selectedSite={selectedSite} onBack={prviousStep} onStartOver={updateSteps} accessToken={accessToken} />}
        </div>
    )

};

export default Home;