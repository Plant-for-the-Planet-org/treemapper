'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Leaf, RefreshCw } from 'lucide-react';
import { getWorkspaceSpeciesRequests } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import type { SpeciesRequest, SpeciesRequestsResponse, SpeciesRequestStatus } from '../types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from './workspace-ui';
import { SpeciesReviewModal } from './SpeciesReviewModal';

const PAGE_SIZE = 20;

const TABS: { key: SpeciesRequestStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE: Record<SpeciesRequestStatus, { variant: 'default' | 'success' | 'destructive'; label: string }> = {
  pending: { variant: 'default', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function SpeciesRequestsSection() {
  const { accessToken } = useToken();
  const selectedWorkspace = useProjectStore((state) => state.selectedWorkspce);

  const [tab, setTab] = useState<SpeciesRequestStatus>('pending');
  const [requests, setRequests] = useState<SpeciesRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpeciesRequest | null>(null);

  const canManageSpecies = ['owner', 'admin'].includes(selectedWorkspace?.userRole || '');

  const fetchRequests = useCallback(async () => {
    if (!accessToken || !selectedWorkspace?.uid) return;
    setIsLoading(true);
    setError(null);

    const res = await getWorkspaceSpeciesRequests(accessToken, selectedWorkspace.uid, {
      status: tab,
      limit: PAGE_SIZE,
      page: 1,
    });

    setIsLoading(false);

    if (!res || res.error) {
      setError('Failed to load species requests.');
      return;
    }

    const payload: SpeciesRequestsResponse = res.data ?? res;
    setRequests(payload.data || []);
    setTotal(payload.total || 0);
  }, [accessToken, selectedWorkspace?.uid, tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReviewed = () => {
    setSelected(null);
    fetchRequests();
  };

  if (!selectedWorkspace) {
    return <div className="p-6 text-gray-500 text-sm">No workspace selected.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Species Requests</CardTitle>
            <p className="mt-0.5 text-sm text-gray-500">
              Species requested by members across every project in {selectedWorkspace.name}.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-[#007A49] text-[#007A49]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            <Leaf className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            No {tab} species requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Scientific name</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Common name</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested by</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Requested</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.uid}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <td className="p-3 text-sm italic text-gray-900">{req.scientificName}</td>
                    <td className="p-3 text-sm text-gray-600">{req.commonName || '—'}</td>
                    <td className="p-3 text-sm text-gray-600">{req.requestedBy?.name || req.requestedBy?.email || 'Unknown'}</td>
                    <td className="p-3 text-sm text-gray-600">{req.project?.projectName || '—'}</td>
                    <td className="p-3 text-sm text-gray-600">{formatDate(req.createdAt)}</td>
                    <td className="p-3">
                      <Badge variant={STATUS_BADGE[req.status].variant}>{STATUS_BADGE[req.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && requests.length > 0 && (
          <p className="mt-3 text-xs text-gray-400">
            Showing {requests.length} of {total}
          </p>
        )}
      </CardContent>

      {selected && (
        <SpeciesReviewModal
          request={selected}
          canReview={canManageSpecies}
          onClose={() => setSelected(null)}
          onReviewed={handleReviewed}
        />
      )}
    </Card>
  );
}
