"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreateOrganizationForm } from './components/CreateOrganizationForm';
import { Footer } from './components/Footer';
import { OrganizationGrid } from './components/OrganizationGrid';
import { PageHeader } from './components/PageHeader';
import { EmptyState } from './components/EmptyState';
import { useOrganizations, useCreateOrganization } from '@shared-core/api/index';
import Spinner from '@/component/Spinner';

// Main Component
export default function OrganizationSelector() {
  const [newOrgName, setNewOrgName] = useState('');
  const [searchTerm] = useState('');
  const router = useRouter();
  
  // React Query hooks
  const { data: orgResponse, isLoading, error } = useOrganizations();
  const organizations = orgResponse?.data || [];
  
  const createOrganization = useCreateOrganization({
    onSuccess: (data) => {
      console.log('Organization created successfully:', data);
      setNewOrgName('');
      
      // Store the new org ID and redirect to dashboard
      if (data?.data?.id) {
        localStorage.setItem('orgId', data.data.id);
        router.replace('/dashboard');
      }
    },
    onError: (error) => {
      console.error('Failed to create organization:', error);
      // You might want to show a toast notification here
      alert(`Failed to create organization: ${error.message}`);
    },
  });

  const handleCreateOrganization = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      // Use React Query mutation with async/await
      await createOrganization.mutateAsync({
        name: newOrgName.trim(),
        description: `New organization created for ${newOrgName.trim()}`,
      });
      
      // Success handling is done in the onSuccess callback above
      
    } catch (error) {
      // Error handling is done in the onError callback above
      console.error('Create organization error:', error);
    }
  }, [newOrgName, createOrganization]);

  const handleSelectOrganization = useCallback((orgId: number | string) => {
    localStorage.setItem('orgId', String(orgId));
    router.replace('/dashboard');
    console.log('Selected organization:', orgId);
  }, [router]);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show error state if there's an error loading organizations
  if (error) {
    return (
      <div className="h-full bg-white flex flex-col w-full">
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="h-full w-full flex flex-col justify-center items-center">
            <div className="text-red-500 text-center">
              <h2 className="text-xl font-semibold mb-2">Error Loading Organizations</h2>
              <p className="text-gray-600 mb-4">{error.message}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col w-full">
      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        <PageHeader
          title="Choose your workspace"
          description="Select an organization to continue, or create a new one."
        />

        <CreateOrganizationForm
          newOrgName={newOrgName}
          setNewOrgName={setNewOrgName}
          onCreateOrganization={handleCreateOrganization}
          isCreating={createOrganization.isPending} // Use React Query's loading state
        />
        {isLoading ? (
          <div className='h-full w-full flex flex-col justify-center items-center'>
            <Spinner/>
          </div>
        ) : filteredOrganizations.length > 0 ? (
          <OrganizationGrid
            organizations={filteredOrganizations}
            onSelectOrganization={handleSelectOrganization}
          />
        ) : (
          <EmptyState searchTerm={searchTerm} />
        )}
      </main>

      <Footer />
    </div>
  );
}