'use client';

import React, { useEffect, useState } from 'react';
import { ApprovalBoard } from './component/ApprovalBoard';
import { ApprovalFilters } from './component/ApprovalFilters';
import useProjectStore from '@shared-core/store/useProjectStore';
import { checkProjectRequiresApproval } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useApprovalStore from '@shared-core/store/useApprovalStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

export default function ApprovalsPage() {
  const { accessToken } = useToken();
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const { requiresApproval, setRequiresApproval } = useApprovalStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedProject && accessToken) {
      checkApprovalStatus();
    }
  }, [selectedProject, accessToken]);

  const checkApprovalStatus = async () => {
    if (!selectedProject?.uid) return;

    try {
      const response = await checkProjectRequiresApproval(
        accessToken,
        selectedProject.uid
      );

      if (response.statusCode === 200) {
        setRequiresApproval(response.data?.requiresInterventionApproval || false);
      }
    } catch (error) {
      console.error('Failed to check approval status:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (!selectedProject) {
    return (
      <div className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please select a project to view approvals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (requiresApproval) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">
              Approval workflow is not enabled for this project.
            </div>
            <div className="text-sm text-gray-600">
              Contact a project owner or admin to enable the intervention approval
              workflow.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Approval Board
        </h1>
        <p className="text-gray-600">
          Review and manage intervention approvals for {selectedProject.name}
        </p>
      </div>

      <ApprovalFilters onSearch={handleSearch} />

      <ApprovalBoard
        projectId={selectedProject.uid}
        userRole={selectedProject.role || 'contributor'}
        searchQuery={searchQuery}
      />
    </div>
  );
}
