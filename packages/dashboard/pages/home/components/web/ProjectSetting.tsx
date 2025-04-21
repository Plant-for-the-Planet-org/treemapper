'use client'

import React, { useState } from 'react';
import { 
  Settings, Users, MapPin, Bell, Shield, 
  Trash2, Save, ArrowLeft, Leaf, Tractor, 
  Globe, Info, FileText, ChevronDown, Upload,
  AlertTriangle, Lock
} from 'lucide-react';
import BackButton from '../../../../components/backButton/BackButton';
// import ProjectSelectMap from '../web/m';

interface ProjectData {
  projectName: string;
  projectType: string;
  ecosystem: string;
  projectScale: string;
  unityType: string;
  target: string;
  projectWebsite: string;
  aboutProject: string;
  location: File | null;
  collaborators: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
  }>;
  notifications: {
    progressUpdates: boolean;
    treeAdditions: boolean;
    newCollaborators: boolean;
  };
}

interface NewCollaborator {
  name: string;
  email: string;
  role: string;
}

const ProjectSettings: React.FC = () => {
  // Sample project data (would come from API in real implementation)
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: 'Forest Restoration Initiative',
    projectType: 'Restoration',
    ecosystem: 'moist-forest',
    projectScale: 'large-scale',
    unityType: 'tree',
    target: '10,000',
    projectWebsite: 'https://example.com/forest-initiative',
    aboutProject: 'A comprehensive project aimed at restoring degraded forest areas through native species reforestation.',
    location: null,
    collaborators: [
      { id: 1, name: 'Jane Smith', email: 'jane@example.com', role: 'Admin' },
      { id: 2, name: 'John Doe', email: 'john@example.com', role: 'Editor' }
    ],
    notifications: {
      progressUpdates: true,
      treeAdditions: true,
      newCollaborators: false
    }
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('general');
  
  // State for file upload
  const [fileName, setFileName] = useState<string>('No file selected');
  
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked, files } = e.target as HTMLInputElement;
    
    if (type === 'file' && files?.length > 0) {
      setProjectData(prev => ({
        ...prev,
        location: files[0]
      }));
      setFileName(files[0].name);
    } else if (name.includes('.')) {
      // Handle nested properties like notifications.progressUpdates
      const [parent, child] = name.split('.');
      setProjectData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ProjectData],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', projectData);
    // Add API call to update project data
    alert('Project settings updated!');
  };

  // Handle removing a collaborator
  const removeCollaborator = (id: number) => {
    setProjectData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(collab => collab.id !== id)
    }));
  };

  // Handle adding a new collaborator
  const [newCollaborator, setNewCollaborator] = useState<NewCollaborator>({ 
    name: '', 
    email: '', 
    role: 'Viewer' 
  });
  
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now(); // Simple ID generation
    setProjectData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, { ...newCollaborator, id }]
    }));
    setNewCollaborator({ name: '', email: '', role: 'Viewer' });
  };

  // Handle project deletion
  const handleDeleteProject = () => {
    // API call would go here
    console.log('Deleting project:', projectData.projectName);
    alert(`Project "${projectData.projectName}" has been deleted.`);
    // Redirect would happen here in real implementation
  };

  // Tab components
  const GeneralSettings: React.FC = () => (
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
            value={projectData.projectName}
            onChange={handleInputChange}
            required
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
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
              checked={projectData.projectType === 'Restoration'}
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
              checked={projectData.projectType === 'Conservation'}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor="conservation" className="ml-2 block text-sm text-gray-700">
              Conservation
            </label>
          </div>
        </div>
      </div>
      
      {/* Two column layout for dropdowns */}
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
              value={projectData.ecosystem}
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
              value={projectData.projectScale}
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
              value={projectData.unityType}
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
        
        {/* Target */}
        <div className="space-y-2">
          <label htmlFor="target" className="block text-sm font-medium text-gray-700">
            Target
          </label>
          <input
            type="text"
            id="target"
            name="target"
            value={projectData.target}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
          />
        </div>
      </div>
      
      {/* Project Website */}
      <div className="space-y-2">
        <label htmlFor="projectWebsite" className="block text-sm font-medium text-gray-700">
          Project Website
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="url"
            id="projectWebsite"
            name="projectWebsite"
            value={projectData.projectWebsite}
            onChange={handleInputChange}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
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
            value={projectData.aboutProject}
            onChange={handleInputChange}
            required
            rows={5}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border px-3"
          />
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </form>
  );

  const LocationSettings: React.FC = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800">Project Location</h3>
      <p className="text-sm text-gray-600">
        Update the location of your project by using the map below or by uploading a new file.
      </p>
      
      {/* Map Component */}
      <div className="w-full h-64 md:h-80 lg:h-96 bg-green-100 rounded-lg flex items-center justify-center border border-gray-200">
        {/* <ProjectSelectMap /> */}
      </div>
      
      {/* File Upload */}
      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Upload a KML/GeoJSON file:</p>
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
          <span className="ml-3 text-sm text-gray-500">
            {fileName}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Accepted formats: KML, GeoJSON
        </p>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => alert('Location updated!')}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Update Location
        </button>
      </div>
    </div>
  );


  const NotificationSettings: React.FC = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800">Notification Settings</h3>
      <p className="text-sm text-gray-600">
        Configure which notifications you receive for this project.
      </p>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Progress Updates</p>
                <p className="text-sm text-gray-500">Receive notifications about project milestones and progress</p>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="progressUpdates"
                  name="notifications.progressUpdates"
                  type="checkbox"
                  checked={projectData.notifications.progressUpdates}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </li>
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Tree Additions</p>
                <p className="text-sm text-gray-500">Get notified when new trees are added to the inventory</p>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="treeAdditions"
                  name="notifications.treeAdditions"
                  type="checkbox"
                  checked={projectData.notifications.treeAdditions}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </li>
          <li className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Collaborators</p>
                <p className="text-sm text-gray-500">Get notified when collaborators are added or removed</p>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="newCollaborators"
                  name="notifications.newCollaborators"
                  type="checkbox"
                  checked={projectData.notifications.newCollaborators}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => alert('Notification settings updated!')}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const DangerZone: React.FC = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
      <p className="text-sm text-gray-600">
        Critical actions that cannot be undone.
      </p>
      
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 w-full">
            <h3 className="text-sm font-medium text-red-800">Delete Project</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Once you delete a project, there is no going back. This action permanently removes all data, 
                trees, locations, and collaborator assignments associated with this project.
              </p>
            </div>
            <div className="mt-4">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you absolutely sure you want to delete "{projectData.projectName}"?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Yes, Delete Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Archive Project Option */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 w-full">
            <h3 className="text-sm font-medium text-yellow-800">Archive Project</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Archiving a project will make it read-only. No new trees can be added, and settings cannot be changed,
                but the data will still be accessible for reporting.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => alert('Project archived!')}
                className="inline-flex items-center px-4 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Archive Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'location':
        return <LocationSettings />;
      case 'collaborators':
        return <CollaboratorsSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'danger':
        return <DangerZone />;
      default:
        return <GeneralSettings />;
    }
  };

  interface NavItemProps {
    id: string;
    label: string;
    icon: React.ReactElement;
    danger?: boolean;
  }

  const NavItem: React.FC<NavItemProps> = ({ id, label, icon, danger = false }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left mb-1
        ${activeTab === id 
          ? danger 
            ? 'bg-red-100 text-red-900' 
            : 'bg-gray-100 text-gray-900' 
          : danger 
            ? 'text-red-600 hover:bg-red-50' 
            : 'text-gray-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full h-full">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold ml-4 mt-4" style={{color:"#262626"}}>Project Settings</h1>
      </div>
      
      <div className="flex flex-col md:flex-row w-full h-full gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 ml-3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-1">
              <NavItem id="general" label="General" icon={<Settings />} />
              <NavItem id="location" label="Location" icon={<MapPin />} />
              <NavItem id="notifications" label="Notifications" icon={<Bell />} />
              <NavItem id="danger" label="Danger Zone" icon={<Trash2 />} danger={true} />
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;