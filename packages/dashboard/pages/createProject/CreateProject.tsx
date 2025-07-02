'use client'

import React, { useState, useRef } from 'react';
import { Leaf, Tractor, MapPin, Globe, Info, FileText, ChevronDown, ArrowLeft, Upload, Loader2Icon, TreePine, Target, Users, Shield, Plus } from 'lucide-react';
import ProjectMap from './components/web/ProjectSelectMap';
import GeoJSONFileUpload, { calculateFarmArea, getLatLonFromGeoJSON } from './components/web/GeoJSONfileupload';
import { toast } from 'react-toastify'
import { createNewProject } from '../../api/api.fetch';
// Mock components - replace with your actual imports



interface Props {
  token: string
  goBack: () => void
}

export function CreateProjectUI({ token, goBack }: Props) {
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'personal',
    target: '',
    projectWebsite: '',
    aboutProject: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [finalGeoJSON, setFinalGeoJSON] = useState(null)
  const [loading, setLoading] = useState(false)

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

    if (!finalGeoJSON) {
      toast.warning('Please select a location on the map or upload a location file.');
      return;
    }

    const payLoad = {
      "projectName": formData.projectName,
      "projectType": formData.projectType,
      "description": formData.aboutProject,
      "location": finalGeoJSON,
    };
    if (formData.target !== '') {
      payLoad["target"] = Number(formData.target)
    }

    if (formData.projectWebsite !== '') {
      payLoad["projectWebsite"] = formData.projectWebsite
    }

    console.log('Payload to submit:', payLoad);
    try {
      // Replace with your actual API call
      console.log('Submitting project:', payLoad);
      setLoading(true);
      const response = await createNewProject(token, payLoad);
      console.log('Response from project creation:', response);
      if (response && response.statusCode === 200 || response.statusCode === 201) {
        toast.success('Project created successfully!');
        goBack();
        return
      }

      if (response && response.statusCode !== 200) {
        toast.error(String(response.message));
      }
      setLoading(false);
      // Placeholder success
    } catch (error) {
      setLoading(false);
      console.error('Error creating project:', error);
      toast.error('Error creating project. Please try again.');
    }
  };

  const projectTypes = [
    {
      id: 'personal',
      label: 'Personal',
      icon: TreePine,
      description: 'Individual tree planting project',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'restoration',
      label: 'Restoration',
      icon: Leaf,
      description: 'Ecosystem restoration initiative',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      id: 'conservation',
      label: 'Conservation',
      icon: Shield,
      description: 'Wildlife and habitat protection',
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

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="h-full w-full px-2">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={goBack}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <div className="p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-medium">Back to Dashboard</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-12 text-white">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">Create New Project</h1>
              <p className="text-green-100 text-lg leading-relaxed">
                Start your environmental impact journey by creating a new tree management project.
                Define your goals, select your location, and make a difference.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Project Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
                </div>

                {/* Project Name */}
                <div className="space-y-2">
                  <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="projectName"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      required
                      className="pl-12 block w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-4 border-2 transition-colors"
                      placeholder="Enter a descriptive project name"
                    />
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <label
                          key={type.id}
                          className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.projectType === type.id
                            ? `${type.color} shadow-lg`
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="projectType"
                            value={type.id}
                            checked={formData.projectType === type.id}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-3 w-full">
                            <IconComponent className={`h-6 w-6 mt-1 ${formData.projectType === type.id ? type.color.split(' ')[0] : 'text-gray-400'
                              }`} />
                            <div className="flex-1">
                              <span className="block text-sm font-semibold text-gray-900">
                                {type.label}
                              </span>
                              <span className="block text-xs text-gray-500 mt-1">
                                {type.description}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Target and Website Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target */}
                  <div className="space-y-2">
                    <label htmlFor="target" className="block text-sm font-semibold text-gray-700">
                      Target (Number of Trees)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Target className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="target"
                        name="target"
                        value={formData.target}
                        onChange={handleInputChange}
                        className="pl-12 block w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-4 border-2 transition-colors"
                        placeholder="e.g., 100"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Project Website */}
                  <div className="space-y-2">
                    <label htmlFor="projectWebsite" className="block text-sm font-semibold text-gray-700">
                      Project Website
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="projectWebsite"
                        name="projectWebsite"
                        value={formData.projectWebsite}
                        onChange={handleInputChange}
                        className="pl-12 block w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-4 border-2 transition-colors"
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* About Project */}
                <div className="space-y-2">
                  <label htmlFor="aboutProject" className="block text-sm font-semibold text-gray-700">
                    About Your Project <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                      <Info className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="aboutProject"
                      name="aboutProject"
                      value={formData.aboutProject}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="pl-12 block w-full rounded-xl border-gray-200 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-4 border-2 transition-colors resize-none"
                      placeholder="Describe your project goals, methods, expected impact, and any other relevant details..."
                    />
                  </div>
                </div>
              </div>

              {/* Location Selection Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Location</h2>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Define your project area by using the interactive map below. You can place a marker for point locations,
                    draw a polygon to outline  larger areas, or upload a KML/GeoJSON file with precise boundaries.
                  </p>

                  <div className="w-full h-80 rounded-xl overflow-hidden shadow-inner">
                    <ProjectMap
                      updateGeoJSON={updateGeoJSON}
                      uploadedGeoJSON={finalGeoJSON}
                    />
                  </div>

                  {/* File Upload */}
                  <GeoJSONFileUpload
                    onGeoJSONChange={handleGeoJSONChange}
                    maxAreaHa={500}
                    className=""
                  />

                  {/* Location Status */}
                  {finalGeoJSON && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center text-green-800">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold">
                            Project location selected successfully
                          </span>
                          <span className="block text-xs text-green-600 mt-1">
                            Location data is ready for project creation
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Submit Section */}
              <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Review & Create</h2>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="agreeTerms"
                        name="agreeTerms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={() => setAgreeTerms(!agreeTerms)}
                        required
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors"
                      />
                    </div>
                    <div className="text-sm">
                      <label htmlFor="agreeTerms" className="font-medium text-gray-700 cursor-pointer">
                        I agree to the terms and conditions for creating projects on this platform
                      </label>
                      <p className="text-gray-500 mt-1">
                        By checking this box, you confirm that all information provided is accurate and you agree to our platform guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!agreeTerms || loading}
                    className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${agreeTerms && !loading
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-0.5'
                      : 'bg-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2Icon className="animate-spin h-5 w-5" />
                        Creating Project...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <TreePine className="h-5 w-5" />
                        Create Project
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProjectUI;