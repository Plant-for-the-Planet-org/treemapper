'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trees, ChevronLeft, Plus, Loader } from 'lucide-react';
import { getProjectIntervention, getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@shared-core/store/useUserStore';
import { toast } from 'react-toastify';

// Import modular components
import { Badge, Button } from './component/ui';
import { HeaderWithFilters } from './component/HeaderWithFilters';
import { InterventionCard } from './component/InterventionCard';
import { InterventionDetails } from './component/InterventionDetails';
import { useDebounce } from './component/hooks';

// Types
interface Site {
  id: string | number;
  name: string;
  status?: string;
}

interface Species {
  speciesName?: string;
  otherSpeciesName?: string;
  scientificSpeciesUid?: string;
  count: number;
  uid?: string;
}

interface TreeRecord {
  recordedAt: string;
  [key: string]: unknown;
}

interface Tree {
  id: string | number;
  hid: string;
  tag?: string;
  image?: string;
  status: string;
  speciesName?: string;
  height?: number;
  width?: number;
  plantingDate?: string;
  records?: TreeRecord[];
}

interface FlagReason {
  title: string;
  level: string;
  message: string;
  createdAt: string;
}

interface UserInfo {
  id?: string | number;
  name?: string;
  image?: string;
}

interface Intervention {
  id: string | number;
  uid: string;
  hid: string;
  type: string;
  captureStatus: string;
  interventionStatus: string;
  registrationDate: string;
  interventionStartDate?: string;
  interventionEndDate?: string;
  createdAt: string;
  updatedAt: string;
  flag?: boolean;
  flagReason?: FlagReason[];
  hasRecords?: boolean;
  site?: Site;
  treeCount: number;
  sampleTreeCount?: number;
  species?: Species[];
  trees?: Tree[];
  description?: string;
  captureMode?: string;
  isPrivate?: boolean;
  user?: UserInfo;
  userId?: string | number;
  owner?: UserInfo;
  originalGeometry?: {
    type?: string;
    [key: string]: unknown;
  };
  image?: string;
  metadata?: Record<string, unknown>;
}

interface Filters {
  type: string;
  captureMode: string;
  projectSiteId: string;
  interventionStartDate: string;
  registrationDate: string;
  userId: string;
  species: string[];
  flag: string;
  sortOrder: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Intervention List Sidebar Component
const InterventionListSidebar = ({
  interventions,
  selectedIntervention,
  setSelectedIntervention,
  loading,
  error,
  pagination,
  activeFilterCount,
  hasMore,
  observerRef,
  sidebarCollapsed,
  setSidebarCollapsed,
  clearAllFilters,
  fetchInterventionData,
  router
}: {
  interventions: Intervention[];
  selectedIntervention: Intervention | null;
  setSelectedIntervention: (intervention: Intervention) => void;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  activeFilterCount: number;
  hasMore: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  clearAllFilters: () => void;
  fetchInterventionData: () => void;
  router: ReturnType<typeof useRouter>;
}) => {
  return (
    <div className={`${sidebarCollapsed ? 'w-0 lg:w-16' : 'w-full md:w-96 lg:w-96'
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative`}>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
      >
        <ChevronLeft className={`h-3 w-3 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''
          }`} />
      </button>

      {!sidebarCollapsed && (
        <>
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Interventions</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {pagination.total || interventions.length}
                </Badge>
                {loading && (
                  <Loader className="w-4 h-4 animate-spin text-[#007A49]" />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {interventions.length === 0 && !loading ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Trees className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error ? 'Error Loading Interventions' :
                    activeFilterCount > 0 ? 'No Matching Interventions' : 'No Interventions Found'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {error ? 'Please try again later.' :
                    activeFilterCount > 0 ? 'Try adjusting your search or filters.' :
                      'Create your first intervention to get started.'}
                </p>
                {error ? (
                  <Button variant="primary" size="sm" onClick={() => fetchInterventionData()}>
                    Retry
                  </Button>
                ) : activeFilterCount > 0 ? (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => router.push('/dashboard/new-intervention')}>
                    Create Intervention
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {interventions.map((intervention) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    isSelected={selectedIntervention?.id === intervention.id}
                    onClick={() => setSelectedIntervention(intervention)}
                  />
                ))}

                {hasMore && (
                  <div ref={observerRef} className="py-4 text-center">
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin text-[#007A49] mx-auto" />
                    ) : (
                      <p className="text-xs text-gray-500">Load more...</p>
                    )}
                  </div>
                )}

                {!hasMore && interventions.length > 0 && (
                  <div className="py-4 text-center">
                    <p className="text-xs text-gray-400">
                      Showing all {pagination.total} results
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {sidebarCollapsed && (
        <div className="hidden lg:flex flex-col items-center py-6 space-y-4">
          <div className="w-8 h-8 bg-[#007A49] rounded-lg flex items-center justify-center">
            <Trees className="h-4 w-4 text-white" />
          </div>
          <div className="text-xs font-semibold text-gray-600 transform rotate-90 whitespace-nowrap">
            {pagination.total || interventions.length}
          </div>
          {activeFilterCount > 0 && (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{activeFilterCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyStateView = ({
  interventions,
  activeFilterCount,
  clearAllFilters,
  router
}: {
  interventions: Intervention[];
  activeFilterCount: number;
  clearAllFilters: () => void;
  router: ReturnType<typeof useRouter>;
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {interventions.length === 0 && activeFilterCount > 0
            ? 'No Matching Interventions'
            : 'Select an Intervention'}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {interventions.length === 0 && activeFilterCount > 0
            ? 'Try adjusting your search criteria or filters to find interventions.'
            : 'Choose an intervention from the sidebar to view detailed information, manage species data, update tree records, and access location mapping.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          {interventions.length === 0 && activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          ) : null}
          <Button variant="primary" onClick={() => { router.push('/dashboard/new-intervention') }} className='bg-[#007A49] hover:bg-[#006B3F]'>
            <Plus className="h-4 w-4 mr-2" />
            Create New Intervention
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main TreeMapperUI Component
const TreeMapperUI = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({
    type: '',
    captureMode: '',
    projectSiteId: '',
    interventionStartDate: '',
    registrationDate: '',
    userId: '',
    species: [],
    flag: '',
    sortOrder: 'desc'
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const userDetails = useUserStore(state => state);

  const observerRef = useRef<HTMLDivElement>(null);

  // Get unique intervention types
  const interventionTypes = useMemo(() => {
    return [...new Set(interventions.map(i => i.type))];
  }, [interventions]);

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch interventions data
  const fetchInterventionData = async (page = 1, append = false) => {
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
        interventionStartDate: filters.interventionStartDate || undefined,
        registrationDate: filters.registrationDate || undefined,
        userId: filters.userId ? parseInt(filters.userId) : undefined,
        species: filters.species && filters.species.length > 0 ? filters.species : undefined,
        flag: filters.flag !== '' ? (filters.flag === 'true' || filters.flag === true) : undefined,
        sortOrder: filters.sortOrder || 'desc'
      };

      // Remove empty/undefined filters
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

          if (selectedIntervention) {
            const updatedSelectedIntervention = newInterventions.find(
              (i: Intervention) => i.uid === selectedIntervention.uid || i.id === selectedIntervention.id
            );
            if (updatedSelectedIntervention) {
              setSelectedIntervention(updatedSelectedIntervention);
            } else if (newInterventions.length === 0) {
              setSelectedIntervention(null);
            }
          } else {
            if (newInterventions.length > 0) {
              setSelectedIntervention(newInterventions[0]);
            }
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

  // Fetch sites for the project
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
      fetchInterventionData();
      fetchSites();
    }
  }, [selectedProject]);

  // Refetch when filters change
  useEffect(() => {
    if (selectedProject) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchInterventionData(1, false);
    }
  }, [filters, debouncedSearchTerm, selectedProject]);

  // Enhanced filter handlers
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: value };
      return newFilters;
    });
  };

  const handleDateChange = (date: string) => {
    handleFilterChange('interventionStartDate', date);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      type: '',
      captureMode: '',
      projectSiteId: '',
      interventionStartDate: '',
      registrationDate: '',
      userId: '',
      species: [],
      flag: '',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  // Load more for pagination
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = pagination.page + 1;
      fetchInterventionData(nextPage, true);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loading]);

  const handleInterventionUpdate = async (uid: string, updates: Record<string, unknown>) => {
    try {
      if (selectedIntervention && selectedIntervention.uid === uid) {
        setSelectedIntervention(prev => prev ? ({
          ...prev,
          ...updates
        }) : null);
      }

      setInterventions(prev => prev.map(intervention =>
        intervention.uid === uid
          ? { ...intervention, ...updates }
          : intervention
      ));

      await fetchInterventionData(pagination.page);

      if (!updates.originalGeometry) {
        toast.success('Intervention updated successfully');
      }
    } catch (err) {
      console.error('Error updating intervention:', err);
      if (!updates.originalGeometry) {
        toast.error('Failed to update intervention');
      }
    }
  };

  const handleInterventionDelete = async (_uid: string) => {
    setSelectedIntervention(null);
    fetchInterventionData(pagination.page);
  };

  // Calculate active filter count for UI
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== '' && value !== null && value !== undefined;
  }).length + (searchTerm ? 1 : 0);

  return (
    <div className="bg-gray-50 flex flex-col h-screen overflow-hidden">
      <HeaderWithFilters
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        interventionTypes={interventionTypes}
        sites={sites}
        newIntervention={() => { router.push('/dashboard/new-intervention') }}
        bulkUpload={() => { router.push('/dashboard/bulkupload') }}
        userRole={selectedProject?.userRole}
        handleDateChange={handleDateChange}
        handleFilterChange={handleFilterChange}
        clearAllFilters={clearAllFilters}
        activeFilterCount={activeFilterCount}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        error={error}
        loading={loading}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <InterventionListSidebar
          interventions={interventions}
          selectedIntervention={selectedIntervention}
          setSelectedIntervention={setSelectedIntervention}
          loading={loading}
          error={error}
          pagination={pagination}
          activeFilterCount={activeFilterCount}
          hasMore={hasMore}
          observerRef={observerRef as React.RefObject<HTMLDivElement>}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          clearAllFilters={clearAllFilters}
          fetchInterventionData={fetchInterventionData}
          router={router}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedIntervention ? (
            <div className="flex-1 overflow-y-auto p-6">
              <InterventionDetails
                intervention={selectedIntervention}
                onUpdate={handleInterventionUpdate}
                onDelete={handleInterventionDelete}
                accessToken={accessToken || ''}
                selectedProject={selectedProject?.uid || ''}
                userDetails={{ id: userDetails?.user?.uid }}
                selectedProjectDetails={selectedProject || { uid: '' }}
                sites={sites}
              />
            </div>
          ) : (
            <EmptyStateView
              interventions={interventions}
              activeFilterCount={activeFilterCount}
              clearAllFilters={clearAllFilters}
              router={router}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeMapperUI;
