"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateOrganizationForm } from './components/CreateOrganizationForm';
import { Footer } from './components/Footer';
import { OrganizationGrid } from './components/OrganizationGrid';
import { PageHeader } from './components/PageHeader';
import { EmptyState } from './components/EmptyState';
import { getAllMyOrg, createNewOrg } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { toast } from 'react-toastify';
import Spinner from '@/component/Spinner';

// Main Component
export default function OrganizationSelector() {
  const [newOrgName, setNewOrgName] = useState('');
  const [searchTerm] = useState('');
  const router = useRouter();
  const [organizations, setAllOrganizations] = useState([])
  const { accessToken } = useToken()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setLoading] = useState(false)

  console.log("OPDCPop")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    console.log("Attached")
    const response = await getAllMyOrg(accessToken)
    if (response && response.data) {
      setAllOrganizations(response.data)
    } else {
      setErrorMessage("Error Loading your organizarion")
    }
    setLoading(false)
  }


  const handleCreateOrganization = useCallback(async (e: React.FormEvent) => {
    setLoading(true)
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      const response = await createNewOrg(accessToken, { name: newOrgName.trim() })
      setLoading(false)

      if (response.statusCode === 200 || response.statusCode === 201) {
        localStorage.setItem('orgId', String(response.data.uid));
        router.replace('/dashboard');
        return
      } else {
        toast.error(response.message || 'something went wrong')
      }

    } catch (error) {
      setLoading(false)

      // Error handling is done in the onError callback above
      toast.error(String(error) || 'something went wrong')
    }
  }, [newOrgName]);

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
  if (errorMessage) {
    return (
      <div className="h-full bg-white flex flex-col w-full">
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="h-full w-full flex flex-col justify-center items-center">
            <div className="text-red-500 text-center">
              <h2 className="text-xl font-semibold mb-2">Error Loading Organizations</h2>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <button
                onClick={fetchData}
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
          isCreating={isLoading} // Use React Query's loading state
        />
        {isLoading ? (
          <div className='h-full w-full flex flex-col justify-center items-center'>
            <Spinner />
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