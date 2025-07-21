'use client'

import React, { useState, useEffect } from 'react';

import useProjectStore from '@shared-core/store/useProjectStore';
import { useToken } from '@/context/useTokenContext';
import { getUserProjectSites } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import { findAreaInHa } from '@/utils/geoJSON.helper';
import { DeleteModal } from './component/DeleteModal';
import { EmptyState } from './component/EmptyState';
import { SiteDetails } from './component/SiteDetails';
import { SiteManagementHeader } from './component/SiteManagementHeader';
import { SitesList } from './component/SitesList';
import { useRouter } from 'next/navigation';

const SiteManagementPage = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSite, setEditedSite] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const selectedProject = useProjectStore(state => state.selectedProject);
  const { accessToken } = useToken();
  const router = useRouter()

  useEffect(() => {
    if (isEditing && selectedSite) {
      setEditedSite({ ...selectedSite });
    }
  }, [isEditing, selectedSite]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectSites();
    }
  }, [selectedProject]);

  const handleCreateNewSite=()=>{
    router.push('/dashboard/newsite')
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
        geometry: item.originalGeometry || null
      };
    });
  };

  const areaLabel = (geometry) => {
    const d = findAreaInHa(geometry);
    return d ? `${d} ha` : "Not available";
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => {
    if (editedSite) {
      const updatedSites = sites.map(site =>
        site.id === editedSite.id
          ? { ...editedSite, lastUpdate: new Date().toISOString().split('T')[0] }
          : site
      );
      setSites(updatedSites);
      setSelectedSite(editedSite);
      setIsEditing(false);
      setEditedSite(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedSite(null);
  };

  const handleDelete = () => {
    const updatedSites = sites.filter(site => site.id !== selectedSite.id);
    setSites(updatedSites);
    setSelectedSite(updatedSites[0] || null);
    setShowDeleteModal(false);
  };

  return (
    <div className="w-full h-full bg-gray-50/50">
      <SiteManagementHeader
        onCreateSite={handleCreateNewSite}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <SitesList
              sites={sites}
              selectedSite={selectedSite}
              onSiteSelect={setSelectedSite}
              loading={loading}
              filteredSites={filteredSites}
            />
          </div>

          <div className="lg:col-span-3">
            {selectedSite ? (
              <SiteDetails
                site={selectedSite}
                isEditing={isEditing}
                editedSite={editedSite}
                setEditedSite={setEditedSite}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={() => setShowDeleteModal(true)}
              />
            ) : (
              <EmptyState loading={loading} />
            )}
          </div>
        </div>
      </div>

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