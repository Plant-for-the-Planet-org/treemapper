import React, { useState, useRef } from 'react';
import BackButton from '../../../components/backButton/BackButton';
import { Leaf, Tractor, MapPin, Globe, Info, FileText, ChevronDown, ArrowLeft, Upload } from 'lucide-react';

export function CreateProjectUI() {
  // State for form fields
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'Restoration',
    ecosystem: '',
    projectScale: '',
    unityType: '',
    target: '',
    projectWebsite: '',
    aboutProject: '',
    locationFile: null,
    agreeTerms: false
  });
  
  // Reference for file input
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('No file selected');

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
      setFileName(files[0].name);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your submission logic here
  };

  return (
    <div className="w-full h-full bg-white ">
        <BackButton />
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8">
          <h1 
          style={{color:"#007A49"}}
          className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Add new project</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    id="restoration"
                    name="projectType"
                    type="radio"
                    value="Restoration"
                    checked={formData.projectType === 'Restoration'}
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
                    value="Conservation"
                    checked={formData.projectType === 'Conservation'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="conservation" className="ml-2 block text-sm text-gray-700">
                    Conservation
                  </label>
                </div>
              </div>
            </div>
            
            {/* Two column layout for dropdowns on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ecosystem Dropdown */}
              <div className="space-y-2">
                <label htmlFor="ecosystem" className="block text-sm font-medium text-gray-700">
                  Ecosystem <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Leaf className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="ecosystem"
                    name="ecosystem"
                    value={formData.ecosystem}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border appearance-none pr-10 bg-white"
                  >
                    <option value="" disabled>Select ecosystem</option>
                    <option value="moist-forest">Moist Forest</option>
                    <option value="dry-land">Dry Land</option>
                    <option value="tropical">Tropical</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Project Scale Dropdown */}
              <div className="space-y-2">
                <label htmlFor="projectScale" className="block text-sm font-medium text-gray-700">
                  Project Scale <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="projectScale"
                    name="projectScale"
                    value={formData.projectScale}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border appearance-none pr-10"
                  >
                    <option value="" disabled>Select project scale</option>
                    <option value="large-scale">Large Scale</option>
                    <option value="agriculture">Agriculture</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Unity Type Dropdown */}
              <div className="space-y-2">
                <label htmlFor="unityType" className="block text-sm font-medium text-gray-700">
                  Unity Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tractor className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="unityType"
                    name="unityType"
                    value={formData.unityType}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border appearance-none pr-10"
                  >
                    <option value="" disabled>Select unity type</option>
                    <option value="tree">Tree</option>
                    <option value="m2">m²</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Target (Optional) */}
              <div className="space-y-2">
                <label htmlFor="target" className="block text-sm font-medium text-gray-700">
                  Target (Optional)
                </label>
                <input
                  type="text"
                  id="target"
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
                  placeholder="Enter target"
                />
              </div>
            </div>
            
            {/* Project Website (Optional URL) */}
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
            
            {/* About Project - Text Area */}
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
            
            {/* Location Selection with Map */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800">Select Location of the Project</h3>
              <p className="text-sm text-gray-600">
                Use the map to mark your project location. You can either place a point marker for a specific location 
                or draw a polygon to outline the entire project area.
              </p>
              
              {/* Map Placeholder */}
              <div className="w-full h-64 md:h-80 lg:h-96 bg-green-100 rounded-lg flex items-center justify-center">
                <p className="text-green-800 font-medium">Map will be loaded here</p>
              </div>
              
              {/* File Upload Option */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Or upload a KML/GeoJSON file instead:</p>
                <div className="flex items-center">
                  <label htmlFor="locationFile" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                    Choose File
                  </label>
                  <input 
                    id="locationFile" 
                    name="locationFile" 
                    type="file" 
                    accept=".kml,.geojson,.json" 
                    className="sr-only"
                    onChange={handleInputChange} 
                  />
                  <span className="ml-3 text-sm text-gray-500" id="file-name">
                    {fileName}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Note: Accepted formats: KML, GeoJSON
                </p>
              </div>
            </div>
            
            {/* Terms and Conditions Switch */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white w-full md:w-auto transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}

export default CreateProjectUI;