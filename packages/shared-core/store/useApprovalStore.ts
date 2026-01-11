import { create } from 'zustand';
import type { InterventionApprovalData, ApprovalStatus } from '../types/approval.types';

interface ApprovalStore {
  approvals: InterventionApprovalData[];
  selectedApproval: InterventionApprovalData | null;
  loading: boolean;
  error: string | null;
  requiresApproval: boolean;

  setApprovals: (approvals: InterventionApprovalData[]) => void;
  selectApproval: (approval: InterventionApprovalData | null) => void;
  updateApprovalStatus: (interventionId: number, newStatus: ApprovalStatus) => void;
  updateApproval: (approval: InterventionApprovalData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRequiresApproval: (requires: boolean) => void;
  clearApprovals: () => void;
}

const useApprovalStore = create<ApprovalStore>((set) => ({
  approvals: [],
  selectedApproval: null,
  loading: false,
  error: null,
  requiresApproval: false,

  setApprovals: (approvals) => set({ approvals }),

  selectApproval: (approval) => set({ selectedApproval: approval }),

  updateApprovalStatus: (interventionId, newStatus) =>
    set((state) => ({
      approvals: state.approvals.map((approval) =>
        approval.interventionId === interventionId
          ? { ...approval, approvalStatus: newStatus }
          : approval
      ),
    })),

  updateApproval: (updatedApproval) =>
    set((state) => ({
      approvals: state.approvals.map((approval) =>
        approval.interventionId === updatedApproval.interventionId
          ? updatedApproval
          : approval
      ),
      selectedApproval:
        state.selectedApproval?.interventionId === updatedApproval.interventionId
          ? updatedApproval
          : state.selectedApproval,
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setRequiresApproval: (requires) => set({ requiresApproval: requires }),

  clearApprovals: () =>
    set({
      approvals: [],
      selectedApproval: null,
      error: null,
    }),
}));

export default useApprovalStore;
