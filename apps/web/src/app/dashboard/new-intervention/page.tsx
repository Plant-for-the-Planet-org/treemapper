'use client'
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Info, AlertCircle, ClipboardList } from 'lucide-react';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import { getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import { useRouter } from 'next/navigation';
import InterventionUploadModal from './component/InterventionUploadModal';
import { ProjectSiteSelector } from './components/ProjectSiteSelector';
import { InterventionTypeSelector } from './components/InterventionTypeSelector';
import { SpeciesSelector } from './components/SpeciesSelector';
import { LocationSelector } from './components/LocationSelector';
import { TreeRegistration } from './components/TreeRegistration';
import { DescriptionInput } from './components/DescriptionInput';
import { ImageUpload } from './components/ImageUpload';
import { Switch } from '@/components/ui/switch';
import { FormData, ValidationErrors } from './types';
import { interventionConfigurations } from './constants';
import { validateForm } from './utils/validation';
import { buildApiPayload, buildPlanningPayload } from './utils/payloadBuilder';

const PLANNABLE_TYPES = ['single-tree-registration', 'multi-tree-registration'];

// Mock data for demonstration
const mockSites = [
  { id: 'site1', name: 'Site Alpha', projectId: 'proj1' },
  { id: 'site2', name: 'Site Beta', projectId: 'proj1' }
];

const InterventionCreator = ({ goBack }) => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    projectId: null,
    siteId: null,
    selectedSite: null,
    interventionType: 'single-tree-registration',
    species: [],
    description: '',
    geoJSON: null,
    geoJSONFile: null,
    applyToEntireSite: false,
    isPlanningMode: false,
    treeDetails: {
      tag: '',
      height: '',
      width: '',
      plantingDate: new Date().toISOString().split('T')[0]
    },
    image: null
  });

  const togglePlanningMode = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPlanningMode: checked,
      interventionType: checked && !PLANNABLE_TYPES.includes(prev.interventionType)
        ? 'single-tree-registration'
        : prev.interventionType,
      image: checked ? null : prev.image,
    }));
  };

  // UI state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startUpload, setStartUpload] = useState<any>(null);
  const [sites, setSites] = useState(mockSites.filter(site => site.projectId === formData.projectId));
  const [fetchingSites] = useState(false);
  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRole = selectedProject?.userRole;
  const canCreateIntervention = ['owner', 'admin', 'contributor'].includes(userRole || '');

  useEffect(() => {
    if (selectedProject) {
      fetchAllSites();
    }
  }, [selectedProject]);

  const fetchAllSites = async () => {
    const response = await getUserProjectSites(accessToken, selectedProject?.uid || '');
    if (response && response.statusCode === 200) {
      setFormData(prev => ({ ...prev, siteId: null, projectId: selectedProject?.uid || null }));
      setSites(response.data);
    }
  };

  // Get current intervention config
  const currentConfig = interventionConfigurations[formData.interventionType];

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreateIntervention) {
      alert('You do not have permission to create interventions in this project.');
      return;
    }

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = formData.isPlanningMode
        ? buildPlanningPayload(formData)
        : buildApiPayload(formData);
      setStartUpload(payload);
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="w-full mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Create New Intervention
                </h1>
                <p className="text-slate-600">Add a new intervention to your project</p>
              </div>
            </div>
          </div>

          {formData.projectId && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200/60">
              <Info className="w-4 h-4" />
              <span>
                Adding intervention to: <strong>{selectedProject?.name}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mode toggle */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Planning mode</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Register an intended tree-planting intervention. Only species and location are required — no image, dimensions, or dates.
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isPlanningMode}
                onCheckedChange={togglePlanningMode}
                aria-label="Toggle planning mode"
              />
            </div>
          </div>

          {/* Project and Site Selection */}
          <ProjectSiteSelector
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            projects={selectedProject}
            sites={sites}
            fetchingSites={fetchingSites}
          />

          {/* Intervention Type Selection */}
          <InterventionTypeSelector
            formData={formData}
            setFormData={setFormData}
          />

          {/* Species Selection */}
          <SpeciesSelector
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
            accessToken={accessToken}
          />

          {/* Location Selection */}
          <LocationSelector
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
          />

          {/* Tree Registration Details */}
          <TreeRegistration
            formData={formData}
            setFormData={setFormData}
            currentConfig={currentConfig}
            errors={errors}
          />

          {/* Description */}
          <DescriptionInput
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />

          {/* Image Upload */}
          {!formData.isPlanningMode && (
            <ImageUpload
              formData={formData}
              setFormData={setFormData}
              fileInputRef={fileInputRef}
            />
          )}

          <InterventionUploadModal
            accessToken={accessToken}
            isOpen={startUpload !== null}
            onClose={() => { setStartUpload(null); router.back(); }}
            onSuccess={goBack}
            formData={startUpload}
            image={formData.isPlanningMode ? null : formData.image}
            isPlanning={formData.isPlanningMode}
          />

          {/* Form Actions */}
          <div className=" ">
            <div className="flex  sm:flex-row items-center justify-end gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !canCreateIntervention}
                className="cursor-pointer w-full sm:w-auto px-10 py-3 bg-green-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {formData.isPlanningMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {formData.isPlanningMode ? 'Save Plan' : 'Create Intervention'}
                  </>
                )}
              </button>
            </div>

            {!canCreateIntervention && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                You don't have permission to create interventions for this project. Only project owners, admins, and contributors can create interventions.
              </div>
            )}

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionCreator;