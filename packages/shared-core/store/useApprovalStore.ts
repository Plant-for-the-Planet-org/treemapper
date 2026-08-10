import { create } from 'zustand';
import type {
  InterventionApprovalData,
  SiteApprovalData,
  ApprovalStatus,
  ReviewStatus,
} from '../types/approval.types';
import { mapReviewStatusToLegacyStatus } from '../types/approval.types';

interface ApprovalStore {
  approvals: InterventionApprovalData[];
  sites: SiteApprovalData[];
  selectedApproval: InterventionApprovalData | SiteApprovalData | null;
  loading: boolean;
  error: string | null;
  requiresApproval: boolean;

  setApprovals: (approvals: InterventionApprovalData[]) => void;
  setSites: (sites: SiteApprovalData[]) => void;
  selectApproval: (approval: InterventionApprovalData | SiteApprovalData | null) => void;
  updateApprovalStatus: (interventionId: number, newStatus: ApprovalStatus) => void;
  updateApprovalReviewStatus: (
    interventionId: number,
    reviewStatus: ReviewStatus
  ) => void;
  updateApproval: (approval: InterventionApprovalData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRequiresApproval: (requires: boolean) => void;
  clearApprovals: () => void;
}

const useApprovalStore = create<ApprovalStore>((set) => ({
  approvals: [],
  sites: [],
  selectedApproval: null,
  loading: false,
  error: null,
  requiresApproval: false,

  setApprovals: (approvals) => set({ approvals }),

  setSites: (sites) => set({ sites }),

  selectApproval: (approval) => set({ selectedApproval: approval }),

  updateApprovalStatus: (interventionId, newStatus) =>
    set((state) => ({
      approvals: state.approvals.map((approval) =>
        approval.interventionId === interventionId
          ? { ...approval, approvalStatus: newStatus }
          : approval
      ),
    })),

  updateApprovalReviewStatus: (interventionId, reviewStatus) =>
    set((state) => ({
      approvals: state.approvals.map((approval) =>
        approval.interventionId === interventionId
          ? {
              ...approval,
              reviewStatus,
              approvalStatus: mapReviewStatusToLegacyStatus(reviewStatus),
            }
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
      sites: [],
      selectedApproval: null,
      error: null,
    }),
}));

export default useApprovalStore;
