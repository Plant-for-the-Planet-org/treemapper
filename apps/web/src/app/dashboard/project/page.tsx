'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, MapPin, Globe, Info, FileText, ArrowLeft, Loader2, TreePine, Target, Shield, Plus } from 'lucide-react';
import ProjectMap from '@/component/MapSelect';
import { toast } from 'react-toastify'
import { createNewProject } from '@shared-core/fetchApi/api.fetch';
import GeoJSONUpload from '@/component/GeoJSONfileupload';
import { useRouter } from 'next/navigation';
import { useToken } from '@/context/useTokenContext';
import { useSearchParams } from 'next/navigation';
import Spinner from '@/component/Spinner';

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

// Validation types and utilities
interface ValidationErrors {
    projectName?: string;
    target?: string;
    projectWebsite?: string;
    aboutProject?: string;
}

const URL_REGEX = /^https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

const validateProjectName = (name: string): string | undefined => {
    if (!name || name.trim() === '') {
        return 'Project name is required';
    }
    if (name.trim().length < 3) {
        return 'Project name must be at least 3 characters';
    }
    if (name.trim().length > 100) {
        return 'Project name must be less than 100 characters';
    }
    return undefined;
};

const validateTarget = (target: string): string | undefined => {
    if (target === '') return undefined;
    const num = Number(target);
    if (isNaN(num)) {
        return 'Target must be a valid number';
    }
    if (num < 0) {
        return 'Target cannot be negative';
    }
    if (num > 1000000000) {
        return 'Target value is too large';
    }
    if (!Number.isInteger(num)) {
        return 'Target must be a whole number';
    }
    return undefined;
};

const validateWebsite = (url: string): string | undefined => {
    if (url === '') return undefined;
    if (!URL_REGEX.test(url)) {
        return 'Please enter a valid URL (e.g., https://example.com)';
    }
    return undefined;
};

const validateDescription = (description: string): string | undefined => {
    if (description.length > 2000) {
        return 'Description must be less than 2000 characters';
    }
    return undefined;
};

// Header Component
const ProjectHeader = ({ onBack }) => {
    return (
        <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2 text-muted-foreground">
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Button>
                <h1 className="text-xl font-semibold text-foreground">Create New Project</h1>
            </div>
        </div>
    );
};

// Project Type Selector Component
const ProjectTypeSelector = ({ value, onChange, projectTypes }) => {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">
                Project Type <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
                value={value}
                onValueChange={(v) => onChange({ target: { name: 'projectType', value: v } })}
                className="grid grid-cols-2 gap-3"
            >
                {projectTypes.map((type) => {
                    const IconComponent = type.icon;
                    const selected = value === type.id;
                    return (
                        <Label
                            key={type.id}
                            htmlFor={`type-${type.id}`}
                            className={cn(
                                'relative flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors font-normal',
                                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                            )}
                        >
                            <RadioGroupItem value={type.id} id={`type-${type.id}`} className="sr-only" />
                            <IconComponent className={cn('h-4 w-4 mt-0.5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                            <div className="flex-1 min-w-0">
                                <span className="block text-xs font-medium text-foreground">{type.label}</span>
                                <span className="block text-xs text-muted-foreground mt-0.5 leading-tight">{type.description}</span>
                            </div>
                        </Label>
                    );
                })}
            </RadioGroup>
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
    min = undefined,
    rows = undefined,
    flex = false,
    error = undefined,
    onBlur = undefined
}: {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
    required?: boolean;
    min?: string;
    rows?: number;
    flex?: boolean;
    error?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) => {
    const isTextarea = type === 'textarea';
    const hasError = !!error;

    return (
        <div className={cn('space-y-1.5', flex && 'flex-1 flex flex-col')}>
            <Label htmlFor={name} className="text-sm font-medium">
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <div className={cn('relative', flex && isTextarea && 'flex-1 flex flex-col')}>
                {Icon && (
                    <Icon className={cn(
                        'absolute left-3 h-4 w-4 pointer-events-none z-10',
                        isTextarea ? 'top-3' : 'top-1/2 -translate-y-1/2',
                        hasError ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                )}
                {isTextarea ? (
                    <Textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        required={required}
                        rows={flex ? undefined : (rows || 4)}
                        aria-invalid={hasError}
                        placeholder={placeholder}
                        className={cn('resize-none', Icon && 'pl-9', flex && 'flex-1 h-full min-h-[6rem]')}
                    />
                ) : (
                    <Input
                        type={type}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        required={required}
                        min={min}
                        aria-invalid={hasError}
                        placeholder={placeholder}
                        className={cn(Icon && 'pl-9')}
                    />
                )}
            </div>
            {hasError && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
};

// Project Details Form Component
const ProjectDetailsForm = ({ formData, onChange, projectTypes, handleSubmit, loading, errors, onBlur, isFormValid }) => {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex-1 flex flex-col">
                <h2 className="text-lg font-medium text-foreground mb-4">Project Details</h2>
                <div className="flex-1 flex flex-col space-y-4">
                    <FormInput
                        label="Project Name"
                        name="projectName"
                        value={formData.projectName}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Enter project name"
                        icon={FileText}
                        required
                        error={errors.projectName}
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
                            onBlur={onBlur}
                            placeholder="e.g., 100"
                            icon={Target}
                            min="0"
                            error={errors.target}
                        />

                        <FormInput
                            label="Website"
                            name="projectWebsite"
                            type="url"
                            value={formData.projectWebsite}
                            onChange={onChange}
                            onBlur={onBlur}
                            placeholder="https://example.com"
                            icon={Globe}
                            error={errors.projectWebsite}
                        />
                    </div>

                    <FormInput
                        label="Project Description"
                        name="aboutProject"
                        type="textarea"
                        value={formData.aboutProject}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Describe your project goals and methods..."
                        icon={Info}
                        rows={4}
                        flex={true}
                        error={errors.aboutProject}
                    />
                </div>
            </div>
            <ProjectFooter agreeTerms={isFormValid} onSubmit={handleSubmit} loading={loading} />
        </div>
    );
};

// Map Section Component
const MapSection = ({ finalGeoJSON, updateGeoJSON, onGeoJSONChange }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h2 className="text-lg font-medium text-foreground mb-2">Project Location</h2>
                <p className="text-sm text-muted-foreground">
                    Select the point location where this project belongs. You can later create sites (polygons) within the project for your tree planting and other interventions.
                </p>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex-1 rounded-lg overflow-hidden border border-border mb-3">
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
                        <Alert className="border-primary/30 bg-primary/5">
                            <MapPin className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-xs font-medium text-primary">
                                Location selected
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
};

// Footer Component
const ProjectFooter = ({ agreeTerms, onSubmit, loading }) => {
    return (
        <div className="flex items-center justify-end w-full">
            <Button type="submit" disabled={!agreeTerms || loading} onClick={onSubmit} size="lg" className="px-12">
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Updating...
                    </>
                ) : (
                    'Update and Continue'
                )}
            </Button>
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
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [finalGeoJSON, setFinalGeoJSON] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { accessToken } = useToken()
    const searchParams = useSearchParams();
    const [pageLoading, setPageLoading] = useState(true)

    // Validate a single field
    const validateField = useCallback((name: string, value: string): string | undefined => {
        switch (name) {
            case 'projectName':
                return validateProjectName(value);
            case 'target':
                return validateTarget(value);
            case 'projectWebsite':
                return validateWebsite(value);
            case 'aboutProject':
                return validateDescription(value);
            default:
                return undefined;
        }
    }, []);

    // Validate all fields and return errors
    const validateAllFields = useCallback((): ValidationErrors => {
        return {
            projectName: validateProjectName(formData.projectName),
            target: validateTarget(formData.target),
            projectWebsite: validateWebsite(formData.projectWebsite),
            aboutProject: validateDescription(formData.aboutProject),
        };
    }, [formData]);

    // Check if form is valid
    const isFormValid = useCallback((): boolean => {
        const allErrors = validateAllFields();
        return !Object.values(allErrors).some(error => error !== undefined);
    }, [validateAllFields]);

    // Handle field blur - validate and mark as touched
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validateField]);

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
        },
        {
            id: 'restoration',
            label: 'Restoration',
            icon: Leaf,
            description: 'Ecosystem restoration',
        },
        {
            id: 'conservation',
            label: 'Conservation',
            icon: Shield,
            description: 'Habitat protection',
        },
        {
            id: 'other',
            label: 'Other',
            icon: Plus,
            description: 'Custom project type',
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
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        // Validate on change if field was already touched
        if (touched[name]) {
            const error = validateField(name, newValue);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({
            projectName: true,
            target: true,
            projectWebsite: true,
            aboutProject: true,
        });

        // Validate all fields
        const validationErrors = validateAllFields();
        setErrors(validationErrors);

        // Check if there are any errors
        const hasErrors = Object.values(validationErrors).some(error => error !== undefined);
        if (hasErrors) {
            toast.error('Please fix the validation errors before submitting.');
            return;
        }

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
            const response = await createNewProject(accessToken, payLoad);
            if (response && response.statusCode === 200 || response.statusCode === 201) {
                toast.success('Project created successfully!');
                if (response.data?.uid) {
                    localStorage.setItem('project', response.data.uid);
                }
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
        return (
            <div className="flex h-full w-full flex-col items-center justify-center">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="min-h-full flex flex-col bg-muted/30">
            {/* Header */}
            <ProjectHeader onBack={router.back} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row-reverse overflow-hidden">
                <div className="w-full lg:w-1/2">
                    <div className="h-[60vh] md:h-[45vh] lg:h-full p-6">
                        <MapSection
                            finalGeoJSON={finalGeoJSON}
                            updateGeoJSON={updateGeoJSON}
                            onGeoJSONChange={handleGeoJSONChange}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-1/2 lg:border-r border-border bg-card">
                    <div className="h-full overflow-y-auto p-6">
                        <ProjectDetailsForm
                            formData={formData}
                            onChange={handleInputChange}
                            handleSubmit={handleSubmit}
                            loading={loading}
                            projectTypes={projectTypes}
                            errors={errors}
                            onBlur={handleBlur}
                            isFormValid={isFormValid()}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CreateProjectUI;
