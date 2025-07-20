"use client";

import React, { useState, useCallback } from 'react';
import { Building2, Plus, Users, Calendar, User, TreePine, Search, ArrowRight, LucideIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Organization } from '@shared-core/types/interface.app';
import { CreateOrganizationForm } from './components/CreateOrganizationForm';
import { Footer } from './components/Footer';
import { OrganizationGrid } from './components/OrganizationGrid';
import { PageHeader } from './components/PageHeader';
import { EmptyState } from './components/EmptyState';
import { useTodos, useCreateTodo, useDeleteTodo } from '@shared-core/api/index';




// Main Component
export default function OrganizationSelector() {
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: todosResponse, isLoading, error } = useTodos();
  const todos = todosResponse?.data || [];
  console.log("KSJLDC", error)
  // Mock data - replace with actual API data
  const [organizations, setOrganizations] = useState<Organization[]>([
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

  const handleCreateOrganization = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('orgId', '123');
      router.replace('/dashboard');
      const newOrg: Organization = {
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
  }, [newOrgName, organizations, router]);

  const handleSelectOrganization = useCallback((orgId: number) => {
    localStorage.setItem('orgId', '123');
    router.replace('/dashboard');
    // Handle organization selection - redirect to main app
    console.log('Selected organization:', orgId);
    // window.location.href = `/dashboard?org=${orgId}`;
  }, [router]);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          isCreating={isCreating}
        />

        {/* Uncomment when search functionality is needed */}
        {/* {organizations.length > 0 && (
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )} */}

        {/* Organizations Grid or Empty State */}
        {filteredOrganizations.length > 0 ? (
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