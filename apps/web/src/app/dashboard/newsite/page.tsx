'use client'

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf,
    MapPin,
    Info,
    FileText,
    ArrowLeft,
    Loader2,
    TreePine,
    Plus,
    LandPlot,
    Upload,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import ProjectMap from '@/component/MapSelect';
import GeoJSONFileUpload, { calculateFarmArea, getLatLonFromGeoJSON } from '@/component/GeoJSONfileupload';
import useProjectStore from '@shared-core/store/useProjectStore';
import { toast } from 'react-toastify';
import { createNewDashboardSite } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { useRouter } from 'next/navigation';

// Header Component
const CreateSiteHeader = ({ onGoBack, projectName }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200"
    >
        <div className="px-6 py-4">
            <div className="flex items-center justify-between">
                <motion.button
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onGoBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Sites</span>
                </motion.button>

                <div className="text-right">
                    <h1 className="text-lg font-semibold text-gray-900">Create New Site</h1>
                    <p className="text-xs text-gray-500">Project: {projectName}</p>
                </div>
            </div>
        </div>
    </motion.div>
);

// Input Field Component
const InputField = ({ icon: Icon, label, required, children, error }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-gray-400" />
                </div>
            )}
            {children}
        </div>
        {error && (
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 flex items-center gap-1"
            >
                <AlertCircle className="w-3 h-3" />
                {error}
            </motion.p>
        )}
    </div>
);

// Site Type Card Component
const SiteTypeCard = ({ type, isSelected, onSelect }) => {
    const IconComponent = type.icon;

    return (
        <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-all ${isSelected
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
        >
            <input
                type="radio"
                name="projectType"
                value={type.id}
                checked={isSelected}
                onChange={() => onSelect(type.id)}
                className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-gray-900' : 'bg-gray-100'
                    }`}>
                    <IconComponent className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-500'
                        }`} />
                </div>
                <div className="flex-1">
                    <span className="block text-sm font-medium text-gray-900">
                        {type.label}
                    </span>
                    <span className="block text-xs text-gray-500">
                        {type.description}
                    </span>
                </div>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center"
                    >
                        <CheckCircle className="w-3 h-3 text-white" />
                    </motion.div>
                )}
            </div>
        </motion.label>
    );
};

// Form Section Component
const FormSection = ({
    formData,
    onInputChange,
    errors,
    projectTypes
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        {/* Site Name */}
        <InputField
            icon={FileText}
            label="Site Name"
            required
            error={errors.projectName}
        >
            <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={onInputChange}
                className="pl-10 block w-full rounded-lg border border-gray-200 text-sm py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors"
                placeholder="Enter site name"
            />
        </InputField>

        {/* Site Type */}
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Site Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
                {projectTypes.map((type) => (
                    <SiteTypeCard
                        key={type.id}
                        type={type}
                        isSelected={formData.projectType === type.id}
                        onSelect={(value) => onInputChange({ target: { name: 'projectType', value } })}
                    />
                ))}
            </div>
        </div>

        {/* Description */}
        <InputField
            icon={null}
            label="Site Description"
            required
            error={errors.aboutProject}
        >
            <textarea
                name="aboutProject"
                value={formData.aboutProject}
                onChange={onInputChange}
                rows={4}
                className="pl-10 block w-full rounded-lg border border-gray-200 text-sm py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors resize-none"
                placeholder="Describe the site purpose, goals, and any relevant details..."
            />
        </InputField>
    </motion.div>
);

// Location Status Component
const LocationStatus = ({ geoJSON, area }) => {
    if (!geoJSON) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
                <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">No location selected</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
        >
            <div className="flex items-center text-green-800">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <div>
                    <span className="block text-sm font-medium">Location selected</span>
                </div>
            </div>
        </motion.div>
    );
};

// Map Section Component
const MapSection = ({
    geoJSON,
    onUpdateGeoJSON,
    onGeoJSONChange,
    area
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full"
    >
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Site Location</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Draw on the map or upload a location file
            </p>
        </div>

        <div className="p-4 space-y-4 h-full">
            {/* Map Container */}
            <div className="h-[60vh] md:h-[45vh] lg:h-[60%] border border-gray-200">

                <ProjectMap
                    mode='polygon'
                    updateGeoJSON={onUpdateGeoJSON}
                    uploadedGeoJSON={geoJSON}
                />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
                <GeoJSONFileUpload
                    onGeoJSONChange={onGeoJSONChange}
                    maxAreaHa={500}
                    className="w-full"
                />

                <LocationStatus geoJSON={geoJSON} area={area} />
            </div>
        </div>
    </motion.div>
);

// Submit Section Component
const SubmitSection = ({
    agreeTerms,
    onAgreeTermsChange,
    onSubmit,
    loading,
    canSubmit
}) => (

    <button
        type="submit"
        disabled={!canSubmit || loading}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 ${canSubmit && !loading
            ? 'bg-[#007A49] hover:bg-[#006B3F] cursor-pointer text-white shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
    >
        {loading ? (
            <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                Creating Site...
            </div>
        ) : (
            <div className="flex items-center justify-center gap-2">
                {/* <LandPlot className="h-4 w-4" /> */}
                Create Site
            </div>
        )}
    </button>
);

// Main Component
export function CreateProjectUI() {
    const [formData, setFormData] = useState({
        projectName: '',
        projectType: 'planting',
        aboutProject: '',
    });

    const [agreeTerms, setAgreeTerms] = useState(true);
    const [finalGeoJSON, setFinalGeoJSON] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter()
    const SelectedProject = useProjectStore(state => state.selectedProject);
    const { accessToken } = useToken();

    const projectTypes = [
        {
            id: 'planting',
            label: 'Planting',
            icon: Leaf,
            description: 'Active tree planting area'
        },
        {
            id: 'planted',
            label: 'Planted',
            icon: TreePine,
            description: 'Successfully planted area'
        },
        {
            id: 'barren',
            label: 'Barren',
            icon: LandPlot,
            description: 'Vacant land for future use'
        },
        {
            id: 'reforestation',
            label: 'Reforestation',
            icon: Plus,
            description: 'Large scale restoration'
        }
    ];

    const updateGeoJSON = (geoJSONData) => {
        setFinalGeoJSON(geoJSONData);
    };

    const handleGeoJSONChange = (geoJson) => {
        setFinalGeoJSON(geoJson || null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.projectName.trim()) {
            newErrors.projectName = 'Site name is required';
        }

        if (!formData.aboutProject.trim()) {
            newErrors.aboutProject = 'Site description is required';
        }

        if (!finalGeoJSON) {
            toast.warning('Please select a location on the map or upload a location file.');
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = {
            name: formData.projectName,
            description: formData.aboutProject,
            location: finalGeoJSON,
            status: formData.projectType
        };

        setLoading(true);

        try {
            const response = await createNewDashboardSite(
                accessToken || '',
                payload,
                SelectedProject?.uid || ''
            );
            console.log('Create site response:', response);
            if (response.statusCode === 200) {
                toast.success('Site created successfully!');
                router.back();
            } else {
                toast.error(response.message || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to create site');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = agreeTerms &&
        formData.projectName.trim() &&
        formData.aboutProject.trim() &&
        finalGeoJSON;

    const area = finalGeoJSON ? calculateFarmArea(finalGeoJSON) : null;

    return (
        <div className="bg-gray-50">
            <CreateSiteHeader
                onGoBack={router.back}
                projectName={SelectedProject?.name}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full" >
                <div className="px-6 py-4">
                    <form onSubmit={handleSubmit} className="w-full mx-auto space-y-8">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Site Information</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Provide basic details about your new site location and purpose.
                            </p>

                            <FormSection
                                formData={formData}
                                onInputChange={handleInputChange}
                                errors={errors}
                                projectTypes={projectTypes}
                            />
                        </div>

                        <SubmitSection
                            agreeTerms={agreeTerms}
                            onAgreeTermsChange={(e) => setAgreeTerms(e.target.checked)}
                            onSubmit={handleSubmit}
                            loading={loading}
                            canSubmit={canSubmit}
                        />
                    </form>
                </div>

                <div className="border-l border-gray-200 p-6">
                    <MapSection
                        geoJSON={finalGeoJSON}
                        onUpdateGeoJSON={updateGeoJSON}
                        onGeoJSONChange={handleGeoJSONChange}
                        area={area}
                    />
                </div>
            </div>
        </div>
    );
}

export default CreateProjectUI;