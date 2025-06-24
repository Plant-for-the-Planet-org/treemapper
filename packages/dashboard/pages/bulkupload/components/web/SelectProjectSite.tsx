'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw, AlertCircle, MapPin, Calendar, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const SelectProjectSite = ({ onBack, onNext }) => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSites, setLoadingSites] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [sitesError, setSitesError] = useState('');

  // Mock API functions - replace with your actual API calls
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setProjectsError('');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data based on your schema
      const mockProjects = [
        {
          id: 1,
          uid: 'proj_001',
          projectName: 'Amazon Rainforest Conservation',
          projectType: 'Conservation',
          ecosystem: 'Tropical Rainforest',
          projectScale: 'Large',
          target: 50000,
          country: 'BR',
          purpose: 'Biodiversity Protection',
          description: 'Large-scale conservation project in the Amazon basin focusing on biodiversity protection and sustainable forestry practices.',
          isActive: true,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          uid: 'proj_002',
          projectName: 'Urban Forest Initiative',
          projectType: 'Reforestation',
          ecosystem: 'Urban Forest',
          projectScale: 'Medium',
          target: 15000,
          country: 'US',
          purpose: 'Air Quality Improvement',
          description: 'Urban reforestation project aimed at improving air quality and creating green spaces in metropolitan areas.',
          isActive: true,
          createdAt: new Date('2024-02-20')
        },
        {
          id: 3,
          uid: 'proj_003',
          projectName: 'Coastal Mangrove Restoration',
          projectType: 'Restoration',
          ecosystem: 'Mangrove',
          projectScale: 'Medium',
          target: 25000,
          country: 'PH',
          purpose: 'Coastal Protection',
          description: 'Mangrove restoration project to protect coastal communities and restore marine ecosystems.',
          isActive: true,
          createdAt: new Date('2024-03-10')
        }
      ];

      setProjects(mockProjects);
    } catch (error) {
      setProjectsError('Failed to load projects. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchSites = async (projectId) => {
    try {
      setLoadingSites(true);
      setSitesError('');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock data based on your schema - different sites for different projects
      const mockSitesData = {
        1: [
          {
            id: 1,
            uid: 'site_001',
            projectId: 1,
            name: 'North Amazon Sector A',
            description: 'Primary conservation area covering 1000 hectares of pristine rainforest.',
            status: 'monitoring',
            createdAt: new Date('2024-01-20')
          },
          {
            id: 2,
            uid: 'site_002',
            projectId: 1,
            name: 'South Amazon Sector B',
            description: 'Secondary conservation area with ongoing restoration activities.',
            status: 'planting',
            createdAt: new Date('2024-01-25')
          }
        ],
        2: [
          {
            id: 3,
            uid: 'site_003',
            projectId: 2,
            name: 'Central Park Extension',
            description: 'Urban forest expansion in downtown area.',
            status: 'planting',
            createdAt: new Date('2024-02-25')
          }
        ],
        3: [] // No sites for project 3
      };

      const projectSites = mockSitesData[projectId] || [];
      setSites(projectSites);
    } catch (error) {
      setSitesError('Failed to load sites. Please try again.');
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setSelectedSite(null);
      fetchSites(selectedProject.id);
    } else {
      setSites([]);
      setSelectedSite(null);
    }
  }, [selectedProject]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'planting': 'bg-green-100 text-green-800',
      'monitoring': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'planning': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="w-full h-full relative">
      {/* Header with Back Button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-[#007A49] transition-colors mr-4 mt-2 mb-3"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Previous step
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Select Project and Site</h1>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{position:'absolute', right:20, top:20}}
          >
            <button
              onClick={() => onNext({ project: selectedProject, site: selectedSite })}
              className="flex items-center px-6 py-3 bg-[#007A49] text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors"
            >
              Continue to Validation
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Choose a Project</h2>
          {projectsError && (
            <button
              onClick={fetchProjects}
              className="flex items-center text-sm text-[#007A49] hover:text-green-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </button>
          )}
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-[#007A49]" />
            <span className="ml-2 text-gray-600">Loading projects...</span>
          </div>
        ) : projectsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-800 mb-3">{projectsError}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 mt-2 ml-2 w-80 bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all ${selectedProject?.id === project.id
                  ? 'border-[#007A49] ring-2 ring-[#007A49] ring-opacity-20'
                  : 'border-gray-200 hover:border-[#007A49]'
                  }`}
                onClick={() => handleProjectSelect(project)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                      {project.projectName}
                    </h3>
                    {selectedProject?.id === project.id && (
                      <CheckCircle className="h-5 w-5 text-[#007A49] flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Type:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-[#007A49] bg-opacity-10 text-[#007A49]`}>
                        {project.projectType}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Ecosystem:</span>
                      <span>{project.ecosystem}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      <span className="font-medium mr-2">Target:</span>
                      <span>{project.target?.toLocaleString()} trees</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sites Section */}
      {selectedProject && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Choose a Site <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h2>
            {sitesError && (
              <button
                onClick={() => fetchSites(selectedProject.id)}
                className="flex items-center text-sm text-[#007A49] hover:text-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </button>
            )}
          </div>

          {loadingSites ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[#007A49]" />
              <span className="ml-2 text-gray-600">Loading sites...</span>
            </div>
          ) : sitesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-800 mb-3">{sitesError}</p>
              <button
                onClick={() => fetchSites(selectedProject.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sites.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <MapPin className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-800">No sites found for this project</p>
              <p className="text-sm text-yellow-600 mt-1">You can proceed without selecting a site</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4">
              {sites.map((site) => (
                <motion.div
                  key={site.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-shrink-0 w-72  mt-2 ml-2  bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all ${selectedSite?.id === site.id
                    ? 'border-[#007A49] ring-2 ring-[#007A49] ring-opacity-20'
                    : 'border-gray-200 hover:border-[#007A49]'
                    }`}
                  onClick={() => handleSiteSelect(site)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {site.name}
                      </h3>
                      {selectedSite?.id === site.id && (
                        <CheckCircle className="h-5 w-5 text-[#007A49] flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                          {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Created {formatDate(site.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3">
                      {site.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
    </div>
  );
};

export default SelectProjectSite;