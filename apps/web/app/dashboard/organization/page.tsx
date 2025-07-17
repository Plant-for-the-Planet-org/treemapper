"use client";

import React, { useState, useCallback } from 'react';
import { Building2, Plus, Users, Calendar, User, TreePine, Search, ArrowRight } from 'lucide-react';

export default function OrganizationSelector() {
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API data
  const [organizations, setOrganizations] = useState([
    {
      id: 1,
      name: "Amazon Rainforest Project",
      description: "Large-scale reforestation initiative in the Amazon basin focusing on biodiversity restoration",
      createdBy: "Maria Santos",
      createdAt: "2024-01-15",
      memberCount: 24,
      icon: TreePine
    },
    {
      id: 2,
      name: "Urban Green Spaces",
      description: "Community-driven urban forestry program for metropolitan areas",
      createdBy: "John Smith",
      createdAt: "2024-02-20",
      memberCount: 12,
      icon: Building2
    },
    {
      id: 3,
      name: "Coastal Restoration Alliance",
      description: "Mangrove restoration and coastal ecosystem rehabilitation",
      createdBy: "Sarah Johnson",
      createdAt: "2024-03-10",
      memberCount: 8,
      icon: Users
    }
  ]);

  const handleCreateOrganization = useCallback(async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newOrg = {
        id: organizations.length + 1,
        name: newOrgName.trim(),
        description: `New organization created for ${newOrgName.trim()}`,
        createdBy: "You",
        createdAt: new Date().toISOString().split('T')[0],
        memberCount: 1,
        icon: Building2
      };
      
      setOrganizations([newOrg, ...organizations]);
      setNewOrgName('');
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsCreating(false);
    }
  }, [newOrgName, organizations]);

  const handleSelectOrganization = useCallback((orgId) => {
    // Handle organization selection - redirect to main app
    console.log('Selected organization:', orgId);
    // window.location.href = `/dashboard?org=${orgId}`;
  }, []);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full bg-white flex flex-col w-full">
      {/* Header */}


      {/* Main Content */}
      <main className="flex-1 w-full  px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your workspace</h2>
          <p className="text-gray-600">Select an organization to continue, or create a new one.</p>
        </div>

        {/* Create New Organization */}
        <div className="mb-8">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors focus-within:border-[#007A49] focus-within:bg-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-lg">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Create a new organization..."
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newOrgName.trim() && !isCreating) {
                      handleCreateOrganization(e);
                    }
                  }}
                  className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder-gray-500 text-gray-900 focus:placeholder-gray-400"
                  disabled={isCreating}
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter a name to create your organization workspace
                </p>
              </div>
              <button
                onClick={handleCreateOrganization}
                disabled={!newOrgName.trim() || isCreating}
                className="inline-flex items-center px-4 py-2 bg-[#007A49] text-white text-sm font-medium rounded-lg hover:bg-[#006B3F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {/* {organizations.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent outline-none"
              />
            </div>
          </div>
        )} */}

        {/* Organizations Grid */}
        {filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => {
              const IconComponent = org.icon;
              return (
                <div
                  key={org.id}
                  onClick={() => handleSelectOrganization(org.id)}
                  className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007A49] hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#007A49]/10 rounded-lg group-hover:bg-[#007A49]/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-[#007A49]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#007A49] transition-colors truncate">
                        {org.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {org.createdBy}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {org.memberCount} members
                        </span>
                      </div>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(org.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No organizations found' : 'No organizations yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms or create a new organization.'
                : 'Create your first organization to get started with TreeMapper.'
              }
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>© 2024 TreeMapper</span>
              <a href="#" className="hover:text-[#007A49] transition-colors">Help</a>
              <a href="#" className="hover:text-[#007A49] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#007A49] transition-colors">Terms</a>
            </div>
            <div className="text-sm text-gray-500">
              Made by Plant-for-the-Planet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}