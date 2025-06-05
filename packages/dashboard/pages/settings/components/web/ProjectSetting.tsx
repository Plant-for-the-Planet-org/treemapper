'use client'

import React, { useState } from 'react';
import { 
  Settings, Users, MapPin, Bell, Shield, 
  Trash2, Save, ArrowLeft, Leaf, Tractor, 
  Globe, Info, FileText, ChevronDown, Upload,
  AlertTriangle, Lock, Menu, X, Plus, UserX
} from 'lucide-react';
import BackButton from '../../../../components/backButton/BackButton';

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
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      { id: 2, name: 'John Doe', email: 'john@example.com', role: 'Editor' },
      { id: 3, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Viewer' }
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
  
  // State for new collaborator form
  const [showAddCollaborator, setShowAddCollaborator] = useState<boolean>(false);
  
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
    const id = Date.now();
    setProjectData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, { ...newCollaborator, id }]
    }));
    setNewCollaborator({ name: '', email: '', role: 'Viewer' });
    setShowAddCollaborator(false);
  };

  // Handle project deletion
  const handleDeleteProject = () => {
    console.log('Deleting project:', projectData.projectName);
    alert(`Project "${projectData.projectName}" has been deleted.`);
  };

  const navItems = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'location', label: 'Location', icon: MapPin },
    // { id: 'collaborators', label: 'Collaborators', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true },
  ];

  const NavItem = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: (id: string) => void }) => (
    <button
      onClick={() => {
        onClick(item.id);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition-all duration-200 ${
        isActive
          ? item.danger
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm'
          : item.danger
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <item.icon size={20} className="mr-3 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
    </button>
  );

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600 shadow-inner"></div>
    </label>
  );

  // Tab components
  const GeneralSettings: React.FC = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">General Settings</h2>
        <p className="text-gray-600">Configure your project's basic information and settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Project Information</h3>
          
          {/* Project Name */}
          <div className="space-y-2 mb-6">
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
                value={projectData.projectName}
                onChange={handleInputChange}
                required
                className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* Project Type (Radio) */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-semibold text-gray-700">
              Project Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-6">
              {['Restoration', 'Conservation'].map((type) => (
                <label key={type} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    name="projectType"
                    type="radio"
                    value={type}
                    checked={projectData.projectType === type}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700 font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Two column layout for dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ecosystem Dropdown */}
            <div className="space-y-2">
              <label htmlFor="ecosystem" className="block text-sm font-semibold text-gray-700">
                Ecosystem <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Leaf className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="ecosystem"
                  name="ecosystem"
                  value={projectData.ecosystem}
                  onChange={handleInputChange}
                  required
                  className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="" disabled>Select ecosystem</option>
                  <option value="moist-forest">Moist Forest</option>
                  <option value="dry-land">Dry Land</option>
                  <option value="tropical">Tropical</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Project Scale Dropdown */}
            <div className="space-y-2">
              <label htmlFor="projectScale" className="block text-sm font-semibold text-gray-700">
                Project Scale <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="projectScale"
                  name="projectScale"
                  value={projectData.projectScale}
                  onChange={handleInputChange}
                  required
                  className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="" disabled>Select project scale</option>
                  <option value="large-scale">Large Scale</option>
                  <option value="agriculture">Agriculture</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Unity Type Dropdown */}
            <div className="space-y-2">
              <label htmlFor="unityType" className="block text-sm font-semibold text-gray-700">
                Unity Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tractor className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="unityType"
                  name="unityType"
                  value={projectData.unityType}
                  onChange={handleInputChange}
                  required
                  className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="" disabled>Select unity type</option>
                  <option value="tree">Tree</option>
                  <option value="m2">m²</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Target */}
            <div className="space-y-2">
              <label htmlFor="target" className="block text-sm font-semibold text-gray-700">
                Target
              </label>
              <input
                type="text"
                id="target"
                name="target"
                value={projectData.target}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* Project Website */}
          <div className="space-y-2 mb-6">
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
                value={projectData.projectWebsite}
                onChange={handleInputChange}
                className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* About Project - Text Area */}
          <div className="space-y-2 mb-6">
            <label htmlFor="aboutProject" className="block text-sm font-semibold text-gray-700">
              About Project <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                <Info className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="aboutProject"
                name="aboutProject"
                value={projectData.aboutProject}
                onChange={handleInputChange}
                required
                rows={5}
                className="pl-12 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );

  const LocationSettings: React.FC = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Location</h2>
        <p className="text-gray-600">Update the location of your project using the map or by uploading a file.</p>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Interactive Map</h3>
        
        {/* Map Component */}
        <div className="w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200 mb-8">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-green-700 font-medium">Interactive Map Component</p>
            <p className="text-green-600 text-sm">Map integration would be implemented here</p>
          </div>
        </div>
        
        {/* File Upload */}
        <div className="bg-gray-50/50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Upload Location File</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label htmlFor="locationFile" className="cursor-pointer bg-white py-3 px-6 border-2 border-dashed border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none transition-all flex items-center">
              <Upload className="h-4 w-4 mr-2" />
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
            <div className="flex-1">
              <span className="text-sm text-gray-600 font-medium">
                {fileName}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Accepted formats: KML, GeoJSON (Max size: 10MB)
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => alert('Location updated!')}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
        >
          <Save className="h-4 w-4 mr-2" />
          Update Location
        </button>
      </div>
    </div>
  );

  // const CollaboratorsSettings: React.FC = () => (
  //   <div className="space-y-8">
  //     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  //       <div>
  //         <h2 className="text-3xl font-bold text-gray-900 mb-2">Collaborators</h2>
  //         <p className="text-gray-600">Manage team members and their access levels.</p>
  //       </div>
  //       <button
  //         onClick={() => setShowAddCollaborator(true)}
  //         className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
  //       >
  //         <Plus className="h-4 w-4 mr-2" />
  //         Add Collaborator
  //       </button>
  //     </div>

  //     <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
  //       <div className="flex items-center">
  //         <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
  //         <p className="text-green-800 font-medium">
  //           {projectData.collaborators.length} team members are working on this project.
  //         </p>
  //       </div>
  //     </div>

  //     {/* Add Collaborator Form */}
  //     {/* {showAddCollaborator && (
  //       <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
  //         <h3 className="text-xl font-semibold text-gray-800 mb-6">Add New Collaborator</h3>
  //         <form onSubmit={handleAddCollaborator} className="space-y-6">
  //           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
  //               <input
  //                 type="text"
  //                 value={newCollaborator.name}
  //                 onChange={(e) => setNewCollaborator({...newCollaborator, name: e.target.value})}
  //                 required
  //                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
  //               />
  //             </div>
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
  //               <input
  //                 type="email"
  //                 value={newCollaborator.email}
  //                 onChange={(e) => setNewCollaborator({...newCollaborator, email: e.target.value})}
  //                 required
  //                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
  //               />
  //             </div>
  //           </div>
  //           <div>
  //             <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
  //             <select
  //               value={newCollaborator.role}
  //               onChange={(e) => setNewCollaborator({...newCollaborator, role: e.target.value})}
  //               className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white"
  //             >
  //               <option value="Viewer">Viewer</option>
  //               <option value="Editor">Editor</option>
  //               <option value="Admin">Admin</option>
  //             </select>
  //           </div>
  //           <div className="flex justify-end gap-3">
  //             <button
  //               type="button"
  //               onClick={() => setShowAddCollaborator(false)}
  //               className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-semibold transition-all"
  //             >
  //               Add Collaborator
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     )} */}

  //     {/* Collaborators List */}
  //     <div className="space-y-4">
  //       {projectData.collaborators.map((collaborator) => (
  //         <div key={collaborator.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
  //           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  //             <div className="flex items-center space-x-4">
  //               <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
  //                 <span className="text-white font-semibold text-lg">
  //                   {collaborator.name.charAt(0).toUpperCase()}
  //                 </span>
  //               </div>
  //               <div>
  //                 <h4 className="font-semibold text-gray-800">{collaborator.name}</h4>
  //                 <p className="text-gray-600 text-sm">{collaborator.email}</p>
  //               </div>
  //             </div>
  //             <div className="flex items-center gap-3">
  //               <select
  //                 value={collaborator.role}
  //                 onChange={(e) => {
  //                   setProjectData(prev => ({
  //                     ...prev,
  //                     collaborators: prev.collaborators.map(c => 
  //                       c.id === collaborator.id ? {...c, role: e.target.value} : c
  //                     )
  //                   }));
  //                 }}
  //                 className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
  //               >
  //                 <option value="Viewer">Viewer</option>
  //                 <option value="Editor">Editor</option>
  //                 <option value="Admin">Admin</option>
  //               </select>
  //               <button
  //                 onClick={() => removeCollaborator(collaborator.id)}
  //                 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  //               >
  //                 <UserX className="h-4 w-4" />
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  const NotificationSettings: React.FC = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h2>
        <p className="text-gray-600">Configure which notifications you receive for this project.</p>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h3>
        <div className="space-y-6">
          {[
            { 
              key: 'progressUpdates', 
              title: 'Progress Updates', 
              desc: 'Receive notifications about project milestones and progress',
              icon: FileText
            },
            { 
              key: 'treeAdditions', 
              title: 'Tree Additions', 
              desc: 'Get notified when new trees are added to the inventory',
              icon: Leaf
            },
            { 
              key: 'newCollaborators', 
              title: 'New Collaborators', 
              desc: 'Get notified when collaborators are added or removed',
              icon: Users
            }
          ].map(({ key, title, desc, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{title}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={projectData.notifications[key as keyof typeof projectData.notifications]}
                onChange={() => handleInputChange({
                  target: { name: `notifications.${key}`, type: 'checkbox', checked: !projectData.notifications[key as keyof typeof projectData.notifications] }
                } as any)}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => alert('Notification settings updated!')}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const DangerZone: React.FC = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-gray-600">Critical actions that cannot be undone.</p>
      </div>
      
      <div className="space-y-6">
        {/* Archive Project */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">Archive Project</h3>
              <p className="text-yellow-700 mb-6">
                Archiving a project will make it read-only. No new trees can be added, and settings cannot be changed,
                but the data will still be accessible for reporting.
              </p>
              <button
                type="button"
                onClick={() => alert('Project archived!')}
                className="px-6 py-3 bg-white border-2 border-yellow-600 text-yellow-700 rounded-xl hover:bg-yellow-50 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
              >
                <Lock className="h-4 w-4 mr-2" />
                Archive Project
              </button>
            </div>
          </div>
        </div>

        {/* Delete Project */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-red-800 mb-2">Delete Project</h3>
              <p className="text-red-700 mb-6">
                Once you delete a project, there is no going back. This action permanently removes all data, 
                trees, locations, and collaborator assignments associated with this project.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 flex items-center font-semibold shadow-md transition-all transform hover:scale-105"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-red-200">
                    <p className="text-sm font-semibold text-red-800 mb-3">
                      Are you absolutely sure you want to delete "<span className="font-bold">{projectData.projectName}</span>"?
                    </p>
                    <p className="text-xs text-red-600 mb-4">
                      This action cannot be undone and will permanently delete all project data.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold shadow-md transition-all transform hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Yes, Delete Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center font-medium transition-all"
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
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch(activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'location':
        return <LocationSettings />;
      // case 'collaborators':
      //   return <CollaboratorsSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'danger':
        return <DangerZone />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full h-full">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Sidebar Navigation */}
          <div className={`
            ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
            lg:w-80 bg-white/70 backdrop-blur-sm border-r border-gray-200/50
            absolute lg:relative z-40 w-full lg:w-auto h-full lg:h-auto
          `}>
            <div className="p-6 space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Project Configuration
              </h3>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={setActiveTab}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectSettings;