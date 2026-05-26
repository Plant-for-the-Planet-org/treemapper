'use client';

import React, { useEffect, useState } from 'react';
import { ApprovalBoard } from './component/ApprovalBoard';
import { ApprovalFilters } from './component/ApprovalFilters';
import useProjectStore from '@shared-core/store/useProjectStore';
import { checkProjectRequiresApproval } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useApprovalStore from '@shared-core/store/useApprovalStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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
        // The response indicates if approval workflow is enabled
        // If requiresInterventionApproval is true, approval workflow IS enabled, so show board
        // If false or missing, approval workflow is NOT enabled, so hide board
        const approvalEnabled = response.data?.requiresInterventionApproval ?? false;
        // Set requiresApproval to false means "approval is enabled, show board"
        // Set requiresApproval to true means "approval is NOT enabled, hide board"
        setRequiresApproval(!approvalEnabled);
      } else {
        // If endpoint doesn't exist or fails, assume approval board is available
        setRequiresApproval(false);
      }
    } catch (error) {
      console.error('Failed to check approval status:', error);
      // On error, assume approval board is available (don't block access)
      setRequiresApproval(false);
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

  // Note: Temporarily disabled this check to allow board to always render
  // The approval workflow check can be re-enabled once the API response structure is confirmed
  // if (requiresApproval) {
  //   return (
  //     <div className="p-6">
  //       <Alert>
  //         <AlertCircle className="h-4 w-4" />
  //         <AlertDescription>
  //           <div className="font-semibold mb-1">
  //             Approval workflow is not enabled for this project.
  //           </div>
  //           <div className="text-sm text-gray-600">
  //             Contact a project owner or admin to enable the intervention approval
  //             workflow.
  //           </div>
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground mb-1">Approval board</h1>
        <p className="text-sm text-muted-foreground">
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
