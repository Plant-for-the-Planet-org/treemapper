'use client'

import React, { useState, useRef } from 'react';
import { Leaf, Tractor, MapPin, Globe, Info, FileText, ChevronDown, ArrowLeft, Upload, Loader2Icon } from 'lucide-react';
import UnifiedMapComponent from './ProjectSelectMap'; // Your unified map component
import GeoJSONUpload, { calculateFarmArea, getLatLonFromGeoJSON } from './GeoJSONfileupload';
import { toast } from 'react-toastify';
import { createNewProject } from '../../../../api/api.fetch';

interface Props {
  token: string
}

export function CreateProjectUI({ token, goBack }: Props) {
  // State for form fields
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'personal',
    target: '',
    projectWebsite: '',
    aboutProject: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [finalGeoJSON, setFinalGeoJSON] = useState(null)
  const [laoding, setLoading] = useState(false)
  // Handle GeoJSON updates from map interactions
  const updateGeoJSON = (geoJSONData) => {
    setFinalGeoJSON(geoJSONData);
  };

  // Handle GeoJSON file upload
  const handleGeoJSONChange = (geoJson) => {
    if (geoJson) {
      // Update both the uploaded state and form data
      setFinalGeoJSON(geoJson);
    } else {
      // Clear uploaded data when file is removed
      setFinalGeoJSON(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
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

  return (
    <div className="w-full h-full bg-white">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="flex items-center gap-2 p-4 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8">
        <h1
          style={{ color: "#007A49" }}
          className="text-2xl md:text-3xl font-bold text-gray-800 mb-6"
        >
          Add new project
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                required
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
                placeholder="Enter project name"
              />
            </div>
          </div>

          {/* Project Type (Radio) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <input
                  id="personal"
                  name="projectType"
                  type="radio"
                  value="personal"
                  checked={formData.projectType === 'personal'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="personal" className="ml-2 block text-sm text-gray-700">
                  Personal
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="restoration"
                  name="projectType"
                  type="radio"
                  value="restoration"
                  checked={formData.projectType === 'restoration'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="restoration" className="ml-2 block text-sm text-gray-700">
                  Restoration
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="conservation"
                  name="projectType"
                  type="radio"
                  value="conservation"
                  checked={formData.projectType === 'conservation'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="conservation" className="ml-2 block text-sm text-gray-700">
                  Conservation
                </label>
              </div>
                            <div className="flex items-center">
                <input
                  id="other"
                  name="projectType"
                  type="radio"
                  value="other"
                  checked={formData.projectType === 'other'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="conservation" className="ml-2 block text-sm text-gray-700">
                  Other
                </label>
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="space-y-2">
            <label htmlFor="target" className="block text-sm font-medium text-gray-700">
              Target: Number of Trees (Optional)
            </label>
            <input
              type="number"
              id="target"
              name="target"
              value={formData.target}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
              placeholder="Number of trees to plant, area to restore, etc."
              min="0"
            />
          </div>

          {/* Project Website */}
          <div className="space-y-2">
            <label htmlFor="projectWebsite" className="block text-sm font-medium text-gray-700">
              Project Website (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="projectWebsite"
                name="projectWebsite"
                value={formData.projectWebsite}
                onChange={handleInputChange}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
                placeholder="https://www.example.com"
              />
            </div>
          </div>

          {/* About Project */}
          <div className="space-y-2">
            <label htmlFor="aboutProject" className="block text-sm font-medium text-gray-700">
              About Project <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <Info className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="aboutProject"
                name="aboutProject"
                value={formData.aboutProject}
                onChange={handleInputChange}
                required
                rows={5}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
                placeholder="Write about your project..."
              />
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-800">Select Location of the Project</h3>
            <p className="text-sm text-gray-600">
              Use the map to mark your project location, draw a polygon to outline the area, or upload a KML/GeoJSON file.
            </p>

            {/* File Upload Component */}

            {/* Map Component */}
            <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-100 rounded-lg overflow-hidden">
              <UnifiedMapComponent
                updateGeoJSON={updateGeoJSON}
                uploadedGeoJSON={finalGeoJSON}
              />
            </div>
            <div className="mb-4">
              <GeoJSONUpload
                onGeoJSONChange={handleGeoJSONChange}
                maxAreaHa={500}
                className="mb-4"
              />
            </div>

            {/* Location Status */}
            {formData.geoJSON && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center text-green-700">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Project Location selected
                    {formData.geoJSON.geometry?.type === 'Point' && ' (Point)'}
                    {formData.geoJSON.geometry?.type === 'Polygon' && ' (Area)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                required
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                I agree to the terms and conditions for creating the project on the platform
              </label>
            </div>
          </div>


          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!agreeTerms || laoding}
              style={{
                backgroundColor: (agreeTerms) ? "#007A49" : "#A0AEC0"
              }}
              className="px-6 py-3 text-white w-full md:w-auto transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg disabled:cursor-not-allowed"
            >
              {laoding ? <Loader2Icon className="animate-spin h-5 w-10 text-white" />
                : " Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectUI;