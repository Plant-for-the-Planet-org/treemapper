'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { getProjectIntervention, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useInterventionFilterStore } from '@shared-core/store/useInterventionFilterStore';
import { useToken } from '@/context/useTokenContext';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useUserStore } from '@shared-core/store/useUserStore';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';

import { InterventionsPanel } from './component/InterventionsPanel';
import { InterventionDetails } from './component/InterventionDetails';
import { useDebounce } from './component/hooks';
import BulkUpdateModal from './component/BulkUpdateModal';
import BulkSpeciesEditModal from './component/BulkSpeciesEditModal';
import BulkStartDateEditModal from './component/BulkStartDateEditModal';

// Types
interface Site {
  id: string | number;
  name: string;
  status?: string;
}

interface Intervention {
  id: string | number;
  uid: string;
  hid: string;
  type: string;
  captureStatus: string;
  interventionStatus: string;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
  flag?: boolean;
  site?: Site;
  treeCount: number;
  [key: string]: unknown;
}

interface Filters {
  type: string;
  captureMode: string;
  projectSiteId: string;
  registrationDate: string;
  userId: string;
  species: string[];
  flag: string;
  sortOrder: string;
  [key: string]: unknown;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_FILTERS: Filters = {
  type: '',
  captureMode: '',
  projectSiteId: '',
  registrationDate: '',
  userId: '',
  species: [],
  flag: '',
  sortOrder: 'desc',
};

const EmptyDetail = ({ hasInterventions, onCreate, onClear, filtered }: { hasInterventions: boolean; onCreate: () => void; onClear: () => void; filtered: boolean }) => (
  <div className="h-full flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {!hasInterventions && filtered ? 'No Matching Interventions' : 'Select an Intervention'}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5">
        {!hasInterventions && filtered
          ? 'Try adjusting your search criteria or filters to find interventions.'
          : 'Choose an intervention from the list to view detailed information, species data, tree records, and location mapping.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        {!hasInterventions && filtered && (
          <Button variant="outline" onClick={onClear}>Clear All Filters</Button>
        )}
        <Button onClick={onCreate}>
          <Plus size={14} />
          New Intervention
        </Button>
      </div>
    </div>
  </div>
);

const TreeMapperUI = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectUid } = useParams<{ projectUid: string }>();
  const deeplinkUid = searchParams.get('id');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showBulkSpeciesModal, setShowBulkSpeciesModal] = useState(false);
  const [showBulkStartDateModal, setShowBulkStartDateModal] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [hasMore, setHasMore] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const userDetails = useUserStore(state => state);
  const { startDate, endDate, resetDateRange } = useInterventionFilterStore();

  const observerRef = useRef<HTMLDivElement>(null);

  const interventionTypes = useMemo(() => [...new Set(interventions.map(i => i.type))], [interventions]);

  const lockedType = useMemo<string | null>(() => {
    if (!isBulkMode || selectedUids.size === 0) return null;
    const first = interventions.find(i => selectedUids.has(i.uid));
    return first?.type ?? null;
  }, [interventions, selectedUids, isBulkMode]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchInterventionData = async (page = 1, append = false, targetUid?: string) => {
    if (!selectedProject?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, unknown> = {
        page,
        limit: pagination.limit,
        searchHid: debouncedSearchTerm || undefined,
        type: filters.type || undefined,
        captureMode: filters.captureMode || undefined,
        projectSiteId: filters.projectSiteId ? parseInt(filters.projectSiteId) : undefined,
        interventionStartDate: startDate || undefined,
        interventionStartDateTo: endDate || undefined,
        registrationDate: filters.registrationDate || undefined,
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        species: filters.species && filters.species.length > 0 ? filters.species : undefined,
        flag: filters.flag !== '' ? filters.flag === 'true' : undefined,
        sortOrder: filters.sortOrder || 'desc',
      };

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      const response = await getProjectIntervention(accessToken || '', selectedProject.uid, queryParams);

      if (response && response.statusCode === 200) {
        const newInterventions = response.data.intervention || [];

        if (append) {
          setInterventions(prev => [...prev, ...newInterventions]);
        } else {
          setInterventions(newInterventions);

          if (targetUid) {
            const target = newInterventions.find((i: Intervention) => i.uid === targetUid);
            if (target) {
              setSelectedIntervention(target);
            } else {
              const deepResponse = await getProjectIntervention(accessToken || '', selectedProject.uid, { uid: targetUid, limit: 1 });
              if (deepResponse?.statusCode === 200 && deepResponse.data.intervention?.length > 0) {
                setSelectedIntervention(deepResponse.data.intervention[0]);
              }
            }
          } else if (selectedIntervention) {
            const updated = newInterventions.find(
              (i: Intervention) => i.uid === selectedIntervention.uid || i.id === selectedIntervention.id
            );
            if (updated) setSelectedIntervention(updated);
            else if (newInterventions.length === 0) setSelectedIntervention(null);
          } else if (newInterventions.length > 0) {
            setSelectedIntervention(newInterventions[0]);
          }
        }

        const newPagination = response.data.pagination;
        setPagination(newPagination);
        setHasMore(newPagination.page < newPagination.totalPages);
      } else {
        throw new Error(response?.message || 'Failed to fetch interventions');
      }
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch interventions');
      if (!append) {
        setInterventions([]);
        setSelectedIntervention(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    if (!selectedProject?.uid || !accessToken) return;
    try {
      const response = await getUserProjectSites(accessToken, selectedProject.uid);
      if (response && response.statusCode === 200) {
        setSites(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  // Initial load
  useEffect(() => {
    if (selectedProject) {
      fetchInterventionData(1, false, deeplinkUid || undefined);
      fetchSites();
    }
  }, [selectedProject]);

  // Refetch when filters / search / date range change
  useEffect(() => {
    if (selectedProject) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchInterventionData(1, false);
    }
  }, [filters, debouncedSearchTerm, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    resetDateRange();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchInterventionData(pagination.page + 1, true);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 1.0 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => { if (observerRef.current) observer.unobserve(observerRef.current); };
  }, [hasMore, loading]);

  const handleInterventionUpdate = async (uid: string, updates: Record<string, unknown>) => {
    try {
      if (selectedIntervention && selectedIntervention.uid === uid) {
        setSelectedIntervention(prev => prev ? ({ ...prev, ...updates }) : null);
      }
      setInterventions(prev => prev.map(i => i.uid === uid ? { ...i, ...updates } : i));
      await fetchInterventionData(pagination.page);
      if (!updates.originalGeometry) toast.success('Intervention updated successfully');
    } catch (err) {
      console.error('Error updating intervention:', err);
      if (!updates.originalGeometry) toast.error('Failed to update intervention');
    }
  };

  const handleSelectIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setMobileView('detail');
    router.replace(`?id=${intervention.uid}`, { scroll: false });
  };

  // Arrow up/down move through the list when not in bulk-select mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isBulkMode || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (interventions.length === 0) return;
      e.preventDefault();
      const idx = interventions.findIndex(i => i.uid === selectedIntervention?.uid);
      const next = e.key === 'ArrowDown'
        ? (idx < 0 ? 0 : Math.min(idx + 1, interventions.length - 1))
        : (idx < 0 ? 0 : Math.max(idx - 1, 0));
      const target = interventions[next];
      if (target && target.uid !== selectedIntervention?.uid) handleSelectIntervention(target);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interventions, selectedIntervention, isBulkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Anchor for shift+click range selection.
  const lastSelectedUidRef = useRef<string | null>(null);

  const handleToggleSelect = (uid: string, shiftKey = false) => {
    const anchor = lastSelectedUidRef.current;
    if (shiftKey && anchor && anchor !== uid) {
      const order = interventions.map(i => i.uid);
      const a = order.indexOf(anchor);
      const b = order.indexOf(uid);
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        // Keep the range to a single type (anchor's), since bulk edits require it.
        const rangeType = lockedType ?? interventions[a]?.type;
        setSelectedUids(prev => {
          const next = new Set(prev);
          for (let k = lo; k <= hi; k++) {
            const it = interventions[k];
            if (!rangeType || it.type === rangeType) next.add(it.uid);
          }
          return next;
        });
        lastSelectedUidRef.current = uid;
        return;
      }
    }
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
    lastSelectedUidRef.current = uid;
  };

  const handleEnterBulkMode = () => { setIsBulkMode(true); setSelectedUids(new Set()); lastSelectedUidRef.current = null; };
  const handleExitBulkMode = () => { setIsBulkMode(false); setSelectedUids(new Set()); lastSelectedUidRef.current = null; };
  const handleClearSelection = () => { setSelectedUids(new Set()); lastSelectedUidRef.current = null; };
  // Select all visible interventions of the locked type (or the first item's
  // type when nothing is selected yet), since bulk edits require one type.
  const handleSelectAll = () => {
    const type = lockedType ?? interventions[0]?.type;
    if (!type) return;
    setSelectedUids(new Set(interventions.filter(i => i.type === type).map(i => i.uid)));
  };
  const handleBulkUpdateComplete = () => { handleExitBulkMode(); fetchInterventionData(pagination.page); };

  const handleInterventionDelete = async () => {
    setSelectedIntervention(null);
    router.replace('?', { scroll: false });
    fetchInterventionData(pagination.page);
  };

  const goNewIntervention = () => router.push(`/project/${projectUid}/new-intervention`);

  const activeFilterCount =
    [filters.type, filters.captureMode, filters.projectSiteId, filters.registrationDate, filters.userId, filters.flag]
      .filter(v => v !== '' && v != null).length
    + (filters.species.length > 0 ? 1 : 0)
    + (searchTerm ? 1 : 0)
    + (startDate ? 1 : 0);

  return (
    <div className="w-full flex-1 min-h-0 flex overflow-hidden bg-muted/30">
      {/* List panel */}
      <div className={`w-full md:w-[320px] lg:w-[360px] flex-shrink-0 h-full ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} flex-col`}>
        <InterventionsPanel
          interventions={interventions}
          selectedIntervention={selectedIntervention}
          onSelect={handleSelectIntervention}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          interventionTypes={interventionTypes}
          sites={sites}
          pagination={pagination}
          activeFilterCount={activeFilterCount}
          clearAllFilters={clearAllFilters}
          hasMore={hasMore}
          observerRef={observerRef as React.RefObject<HTMLDivElement>}
          fetchInterventionData={() => fetchInterventionData()}
          onCreate={goNewIntervention}
          isBulkMode={isBulkMode}
          selectedUids={selectedUids}
          onToggleSelect={handleToggleSelect}
          onEnterBulkMode={handleEnterBulkMode}
          onExitBulkMode={handleExitBulkMode}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onOpenBulkUpdate={() => setShowBulkUpdateModal(true)}
          onOpenBulkSpeciesEdit={() => setShowBulkSpeciesModal(true)}
          onOpenBulkStartDateEdit={() => setShowBulkStartDateModal(true)}
          lockedType={lockedType}
        />
      </div>

      {/* Detail pane */}
      <div className={`flex-1 h-full overflow-y-auto p-4 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
        {selectedIntervention ? (
          <InterventionDetails
            intervention={selectedIntervention}
            onUpdate={handleInterventionUpdate}
            onDelete={handleInterventionDelete}
            accessToken={accessToken || ''}
            selectedProject={selectedProject?.uid || ''}
            userDetails={{ id: userDetails?.user?.uid }}
            selectedProjectDetails={selectedProject || { uid: '' }}
            sites={sites}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <EmptyDetail
            hasInterventions={interventions.length > 0}
            filtered={activeFilterCount > 0}
            onCreate={goNewIntervention}
            onClear={clearAllFilters}
          />
        )}
      </div>

      <BulkUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        selectedInterventions={interventions.filter(i => selectedUids.has(i.uid))}
        accessToken={accessToken || ''}
        currentProjectUid={selectedProject?.uid || ''}
        onComplete={handleBulkUpdateComplete}
      />

      <BulkSpeciesEditModal
        isOpen={showBulkSpeciesModal}
        onClose={() => setShowBulkSpeciesModal(false)}
        selectedInterventions={interventions.filter(i => selectedUids.has(i.uid))}
        accessToken={accessToken || ''}
        currentProjectUid={selectedProject?.uid || ''}
        onComplete={handleBulkUpdateComplete}
      />

      <BulkStartDateEditModal
        isOpen={showBulkStartDateModal}
        onClose={() => setShowBulkStartDateModal(false)}
        selectedInterventions={interventions.filter(i => selectedUids.has(i.uid))}
        accessToken={accessToken || ''}
        currentProjectUid={selectedProject?.uid || ''}
        onComplete={handleBulkUpdateComplete}
      />
    </div>
  );
};

const InterventionPage = () => (
  <React.Suspense>
    <TreeMapperUI />
  </React.Suspense>
);

export default InterventionPage;
