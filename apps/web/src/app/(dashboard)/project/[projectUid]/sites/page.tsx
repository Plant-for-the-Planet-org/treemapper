'use client'

import React, { useState, useEffect } from 'react';

import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import { getUserProjectSites, updateDashboardSite, syncSiteToTtc } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import { findAreaInHa } from '@/utils/geoJSON.helper';
import { DeleteModal } from './component/DeleteModal';
import { EmptyState } from './component/EmptyState';
import { SiteDetails } from './component/SiteDetails';
import { SitesPanel } from './component/SitesPanel';
import { useRouter } from 'next/navigation';
import SiteAccessModal from './component/SiteAccess';

const SiteManagementPage = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSite, setEditedSite] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(false);
  const selectedProject = useProjectStore(state => state.selectedProject);
  const { accessToken } = useToken();
  const router = useRouter()
  const userRole = selectedProject?.userRole;
  const canManageSites = ['owner', 'admin'].includes(userRole || '');
  // TTC sync only applies to projects in the Plant-for-the-Planet platform workspace.
  const isPlatformWorkspace = selectedProject?.workspace?.slug === 'platform-projects';
  const canSyncTtc = canManageSites && isPlatformWorkspace;
  const [siteAccessModal, setSiteAccessModal] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const [syncingTtc, setSyncingTtc] = useState(false)
  const [bulkSyncingTtc, setBulkSyncingTtc] = useState(false)

  useEffect(() => {
    if (isEditing && selectedSite) {
      setEditedSite({ ...selectedSite });
    }
  }, [isEditing]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectSites();
    }
  }, [selectedProject]);

  const handleCreateNewSite = () => {
    router.push(`/project/${selectedProject?.uid}/newsite`)
  }

  const fetchProjectSites = async () => {
    setLoading(true);
    setSelectedSite(null);
    try {
      const response = await getUserProjectSites(accessToken || '', selectedProject?.uid);
      if (!response || response === null) {
        toast.error("Error fetching project sites");
        return;
      }
      const mappedResponse = transformResponseData(response.data);
      setSites(mappedResponse);
      if (mappedResponse.length > 0) {
        setSelectedSite(mappedResponse[0]);
      }
    } catch (error) {
      toast.error("Error fetching project sites");
    } finally {
      setLoading(false);
    }
  };

  const transformResponseData = (responseArray) => {
    return responseArray.map(item => {
      const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const truncateDescription = (desc) => {
        if (!desc) return '';
        const sentences = desc.split(/[.!?]+/);
        return sentences.length > 2
          ? sentences.slice(0, 2).join('. ').trim() + '.'
          : desc;
      };
      return {
        name: item.name,
        id: item.uid,
        description: truncateDescription(item.description),
        status: item.status,
        createdBy: item.createdBy?.displayName || item.createdBy?.name || null,
        createdAt: formatDate(item.createdAt),
        lastUpdate: formatDate(item.updatedAt),
        area: areaLabel(item.originalGeometry),
        treeCapacity: null,
        image: null,
        geometry: item.originalGeometry,
        member: item.members,
        remoteId: item.remoteId ?? null,
        remoteSyncStatus: item.remoteSyncStatus ?? null
      };
    });
  };

  const areaLabel = (geometry) => {
    const d = findAreaInHa(geometry);
    return d ? `${d} ha` : "Not available";
  };

  const parseArea = (a) => {
    if (!a) return 0;
    const m = String(a).match(/([\d,.]+)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) || 0 : 0;
  };

  const filteredSites = sites
    .filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'area') return dir * (parseArea(a.area) - parseArea(b.area));
      return dir * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    });

  const handleEdit = () => setIsEditing(true);
  const handleSave = async () => {
    if (editedSite) {

      // Check if geometry was updated by comparing JSON strings
      const geometryChanged = JSON.stringify(editedSite.geometry) !== JSON.stringify(selectedSite.geometry);

      // Recalculate area if geometry was updated
      const updatedArea = geometryChanged
        ? areaLabel(editedSite.geometry)
        : editedSite.area;

      const updatedSiteData = {
        ...editedSite,
        area: updatedArea,
        lastUpdate: new Date().toISOString().split('T')[0]
      };

      const updatedSites = sites.map(site =>
        site.id === editedSite.id ? updatedSiteData : site
      );
      setSites(updatedSites);
      setSelectedSite(updatedSiteData);
      setIsEditing(false);
      setEditedSite(null);

      // Prepare update payload
      const updatePayload = {
        name: editedSite.name,
        description: editedSite.description,
        ...(geometryChanged && {
          geoJSON: editedSite.geometry
        })
      };
      await updateDashboardSite(accessToken, updatePayload, selectedProject?.uid, editedSite.id);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSite(null);
  };

  // Sites that still need a TTC sync (never synced, or last attempt failed).
  const sitesNeedingSync = sites.filter(s => !s.remoteId || s.remoteSyncStatus === 'failed');

  // Bulk sync: pushes every pending site to TTC, one at a time.
  const handleBulkSyncToTtc = async () => {
    const pending = sites.filter(s => !s.remoteId || s.remoteSyncStatus === 'failed');
    if (pending.length === 0) {
      toast.info('All sites are already synced to Platform');
      return;
    }
    setBulkSyncingTtc(true);
    let ok = 0;
    let failed = 0;
    for (const s of pending) {
      try {
        const response = await syncSiteToTtc(accessToken || '', selectedProject?.uid, s.id);
        if (response && (response.status === 'success' || response.statusCode === 200 || response.statusCode === 201)) {
          ok++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }
    if (failed === 0) {
      toast.success(`Synced ${ok} site${ok !== 1 ? 's' : ''} to Platform`);
    } else {
      toast.error(`Synced ${ok}, ${failed} failed. Try again to retry the rest.`);
    }
    setBulkSyncingTtc(false);
    await fetchProjectSites();
  };

  const handleSyncToTtc = async () => {
    if (!selectedSite) return;
    setSyncingTtc(true);
    try {
      const response = await syncSiteToTtc(accessToken || '', selectedProject?.uid, selectedSite.id);
      if (response && (response.status === 'success' || response.statusCode === 200 || response.statusCode === 201)) {
        toast.success('Site synced to Platform');
        await fetchProjectSites();
      } else {
        toast.error(response?.message || 'Failed to sync site to Platform');
      }
    } catch (error) {
      toast.error('Failed to sync site to Platform');
    } finally {
      setSyncingTtc(false);
    }
  };

  const handleDelete = () => {
    const updatedSites = sites.filter(site => site.id !== selectedSite.id);
    setSites(updatedSites);
    setSelectedSite(updatedSites[0] || null);
    setShowDeleteModal(false);

  };

  return (
    <div className="w-full flex-1 min-h-0 flex overflow-hidden bg-muted/30">
      {/* Sidebar: always visible on md+, hidden on mobile when viewing detail */}
      <div className={`w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-full ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} flex-col`}>
        <SitesPanel
          sites={sites}
          filteredSites={filteredSites}
          selectedSite={selectedSite}
          onSiteSelect={(s) => { setSelectedSite(s); setMobileView('detail') }}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
          canManageSites={canManageSites}
          canSyncTtc={canSyncTtc}
          unsyncedCount={sitesNeedingSync.length}
          onBulkSyncToTtc={handleBulkSyncToTtc}
          bulkSyncingTtc={bulkSyncingTtc}
        />
      </div>
      {/* Detail: always visible on md+, hidden on mobile when viewing list */}
      <div className={`flex-1 h-full overflow-y-auto p-4 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
        {selectedSite ? (
          <SiteDetails
            site={selectedSite}
            isEditing={isEditing}
            editedSite={editedSite}
            setEditedSite={setEditedSite}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onSyncToTtc={handleSyncToTtc}
            isSyncingTtc={syncingTtc}
            canManageSites={canManageSites}
            canSyncTtc={canSyncTtc}
            setSiteAccessModal={setSiteAccessModal}
            siteAccessModal={siteAccessModal}
            onDelete={() => setShowDeleteModal(true)}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <EmptyState loading={loading} />
        )}
      </div>

      <SiteAccessModal isOpen={siteAccessModal} setIsOpen={setSiteAccessModal} site={selectedSite} refreshData={fetchProjectSites}/>
      <DeleteModal
        isOpen={showDeleteModal}
        site={selectedSite}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default SiteManagementPage;