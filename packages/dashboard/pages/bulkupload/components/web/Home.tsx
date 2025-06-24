'use client';

import React, { useState, useRef } from 'react';

import InfoSection from './InfoSection';
import SelectProjectSite from './SelectProjectSite';
import DataValidation from './DataValidation';
import UploadSuccess from './UploadSuccess';

const Home = () => {

    const [currentStep, setStep] = useState(1)
    const [fileData, setFileData] = useState([]);

    const steps = [
        { id: 1, name: 'Upload', status: 'current' },
        { id: 2, name: 'Project', status: 'upcoming' },
        { id: 3, name: 'Validate', status: 'upcoming' },
        { id: 4, name: 'Success', status: 'upcoming' }
    ];


    return (
        <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 min-w-full min-h-full">
            <div>
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
            </div>
            {/* {fileData.length === 0 && <InfoSection setFileData={setFileData} />} */}
            {/* <SelectProjectSite onBack={()=>{}} onNext={()=>{}}/> */}
            {/* {fileData && < DataValidation fileData={fileData} onBack={() => { }} onNext={() => { }} />} */}
            <UploadSuccess validatedData={[]} selectedProject={'undefined'} selectedSite={'undefined'} onBack={undefined} onStartOver={undefined} />
        </div>
    )

};

export default Home;