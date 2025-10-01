'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Tractor, MapPin, Globe, Info, FileText, ChevronDown, ArrowLeft, Upload, Loader2Icon, TreePine, Target, Users, Shield, Plus } from 'lucide-react';
import ProjectMap from '@/component/MapSelect';
import { toast } from 'react-toastify'
import { createNewProject } from '@shared-core/fetchApi/api.fetch';
import GeoJSONUpload from '@/component/GeoJSONfileupload';
import { useRouter } from 'next/navigation';
import { useToken } from '@/context/useTokenContext';
import { useSearchParams } from 'next/navigation';
import Spinner from '@/component/Spinner';
import useProjectStore from '@shared-core/store/useProjectStore'

// Header Component
const ProjectHeader = ({ onBack }) => {
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Create New Project</h1>
                </div>
            </div>
        </div>
    );
};

// Project Type Selector Component
const ProjectTypeSelector = ({ value, onChange, projectTypes }) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Project Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
                {projectTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                        <label
                            key={type.id}
                            className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-sm ${value === type.id
                                ? `${type.color} shadow-sm`
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="projectType"
                                value={type.id}
                                checked={value === type.id}
                                onChange={onChange}
                                className="sr-only"
                            />
                            <div className="flex items-start gap-2 w-full">
                                <IconComponent className={`h-4 w-4 mt-0.5 ${value === type.id ? type.color.split(' ')[0] : 'text-gray-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <span className="block text-xs font-medium text-gray-900">
                                        {type.label}
                                    </span>
                                    <span className="block text-xs text-gray-500 mt-0.5 leading-tight">
                                        {type.description}
                                    </span>
                                </div>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

// Form Input Component
const FormInput = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    icon: Icon,
    required = false,
    min,
    rows,
    flex
}) => {
    const isTextarea = type === 'textarea';

    return (
        <div
            className={`space-y-2 ${flex ? 'flex-1 flex flex-col' : ''}`}
        >
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`relative ${flex && isTextarea ? 'flex-1 flex flex-col' : ''}`}>
                {Icon && (
                    <div className={`absolute ${isTextarea ? 'top-3' : 'inset-y-0'} left-0 pl-3 flex items-${isTextarea ? 'start' : 'center'} pointer-events-none z-10`}>
                        <Icon className="h-4 w-4 text-gray-400" />
                    </div>
                )}
                {isTextarea ? (
                    <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        rows={flex ? undefined : (rows || 4)} // Remove rows when flex is true
                        className={`${Icon ? 'pl-10' : ''} block w-full ${flex ? 'flex-1 h-full min-h-[6rem]' : ''} rounded-lg border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2.5 transition-colors resize-none placeholder-gray-400`}
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        type={type}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        required={required}
                        min={min}
                        className={`${Icon ? 'pl-10' : ''} block w-full rounded-lg border border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2.5 transition-colors placeholder-gray-400`}
                        placeholder={placeholder}
                    />
                )}
            </div>
        </div>
    );
};
// Project Details Form Component
const ProjectDetailsForm = ({ formData, onChange, projectTypes, handleSubmit, loading }) => {
    return (
        <div className="space-y-6 h-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Project Details</h2>
                <div className="space-y-4">
                    <FormInput
                        label="Project Name"
                        name="projectName"
                        value={formData.projectName}
                        onChange={onChange}
                        placeholder="Enter project name"
                        icon={FileText}
                        required
                    />

                    <ProjectTypeSelector
                        value={formData.projectType}
                        onChange={onChange}
                        projectTypes={projectTypes}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Target Trees"
                            name="target"
                            type="number"
                            value={formData.target}
                            onChange={onChange}
                            placeholder="e.g., 100"
                            icon={Target}
                            min="0"
                        />

                        <FormInput
                            label="Website"
                            name="projectWebsite"
                            type="url"
                            value={formData.projectWebsite}
                            onChange={onChange}
                            placeholder="https://example.com"
                            icon={Globe}
                        />
                    </div>

                    <FormInput
                        label="Project Description"
                        name="aboutProject"
                        type="textarea"
                        value={formData.aboutProject}
                        onChange={onChange}
                        placeholder="Describe your project goals and methods..."
                        icon={Info}
                        rows={4}
                        flex={true}
                    />
                </div>
            </div>
            <ProjectFooter agreeTerms={true} onAgreeTermsChange={undefined} onSubmit={handleSubmit} loading={loading} />
        </div>
    );
};

// Map Section Component
const MapSection = ({ finalGeoJSON, updateGeoJSON, onGeoJSONChange }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Project Location</h2>
                <p className="text-md text-gray-600">
                    Select the point location where this project belongs. You can later create sites (polygons) within the project for your tree planting and other interventions.
                </p>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 mb-3">
                    <ProjectMap
                        updateGeoJSON={updateGeoJSON}
                        mode="point"
                        uploadedGeoJSON={finalGeoJSON}
                    />
                </div>

                <div className="space-y-3">
                    {/* <GeoJSONUpload
                        onGeoJSONChange={onGeoJSONChange}
                        maxAreaHa={500}
                        className="text-xs"
                        allowedGeometryTypes='point'
                    /> */}

                    {finalGeoJSON && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center text-green-800">
                                <MapPin className="h-4 w-4 mr-2 text-green-600" />
                                <div>
                                    <span className="block text-xs font-medium">
                                        Location selected
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Footer Component
const ProjectFooter = ({ agreeTerms, onAgreeTermsChange, onSubmit, loading }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%'}}>
            <button
                type="submit"
                disabled={!agreeTerms || loading}
                onClick={onSubmit}
                className={` py-2 px-22 rounded text-sm font-medium text-base text-white transition-all duration-200 ${agreeTerms && !loading
                    ? 'bg-[#007A49] hover:bg-[#006B3F] cursor-pointer shadow-sm hover:shadow-md'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2Icon className="animate-spin h-5 w-5" />
                        Updating...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        Update and Continue
                    </div>
                )}
            </button>
        </div>
    );
};

// Main Component
export function CreateProjectUI() {
    const [formData, setFormData] = useState({
        projectName: '',
        projectType: 'personal',
        target: '',
        projectWebsite: '',
        aboutProject: '',
    });
    const selectedProject = useProjectStore(s => s.selectedProject)
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [finalGeoJSON, setFinalGeoJSON] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { accessToken } = useToken()
    const searchParams = useSearchParams();
    const [pageLoading, setPageLoading] = useState(true)
    useEffect(() => {
        const name = searchParams.get('name');
        const type = searchParams.get('type');
        if (!name) {
            router.replace('/dashboard/select-workspace')
            return
        }
        setPageLoading(false)
        setFormData({
            ...formData,
            projectName: name,
        })
    }, [])



    const projectTypes = [
        {
            id: 'personal',
            label: 'Personal',
            icon: TreePine,
            description: 'Individual planting project',
            color: 'text-blue-600 bg-blue-50 border-blue-200'
        },
        {
            id: 'restoration',
            label: 'Restoration',
            icon: Leaf,
            description: 'Ecosystem restoration',
            color: 'text-green-600 bg-green-50 border-green-200'
        },
        {
            id: 'conservation',
            label: 'Conservation',
            icon: Shield,
            description: 'Habitat protection',
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
        },
        {
            id: 'other',
            label: 'Other',
            icon: Plus,
            description: 'Custom project type',
            color: 'text-purple-600 bg-purple-50 border-purple-200'
        }
    ];

    const updateGeoJSON = (geoJSONData) => {
        setFinalGeoJSON(geoJSONData);
    };

    const handleGeoJSONChange = (geoJson) => {
        if (geoJson) {
            setFinalGeoJSON(geoJson);
        } else {
            setFinalGeoJSON(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payLoad = {
            "projectName": formData.projectName,
            "projectType": formData.projectType,
            "description": formData.aboutProject,

        };
        if (formData.target !== '') {
            payLoad["target"] = formData.target
        }

        if (formData.aboutProject !== '') {
            payLoad["description"] = formData.aboutProject
        }

        if (finalGeoJSON) {
            payLoad["location"] = finalGeoJSON
        }

        if (formData.projectWebsite !== '') {
            payLoad["projectWebsite"] = formData.projectWebsite
        }

        try {
            setLoading(true);
            const response = await createNewProject(accessToken, payLoad, selectedProject.uid);
            if (response && response.statusCode === 200 || response.statusCode === 201) {
                toast.success('Project created successfully!');
                router.replace('/dashboard');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                return
            }

            if (response && response.statusCode !== 200) {
                toast.error(String(response.message));
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error creating project:', error);
            toast.error('Error creating project. Please try again.');
        }
    };

    if (pageLoading) {
        return <div style={{ display: 'flex', height: "100%", width: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}><Spinner /></div>
    }

    return (
        <div className="min-h-full flex flex-col bg-gray-50">
            {/* Header */}
            <ProjectHeader onBack={router.back} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row-reverse overflow-hidden">
                <div className="w-full lg:w-1/2 bg-gray-50">
                    <div className="h-[60vh] md:h-[45vh] lg:h-full p-6">
                        <MapSection
                            finalGeoJSON={finalGeoJSON}
                            updateGeoJSON={updateGeoJSON}
                            onGeoJSONChange={handleGeoJSONChange}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-1/2 lg:border-r border-gray-200 bg-white">
                    <div className="h-full overflow-y-auto p-6">
                        <ProjectDetailsForm
                            formData={formData}
                            onChange={handleInputChange}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            projectTypes={projectTypes}
                        />
                    </div>
                </div>

            </div>

            {/* Footer */}
            {/* <ProjectFooter
                agreeTerms={agreeTerms}
                onAgreeTermsChange={() => setAgreeTerms(!agreeTerms)}
                onSubmit={handleSubmit}
                loading={loading}
            /> */}
        </div>
    );
}

export default CreateProjectUI;