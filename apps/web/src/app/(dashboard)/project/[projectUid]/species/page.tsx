'use client'

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Leaf, Heart, Save, ArrowLeft, TreePine, LeafIcon, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { createNewProjectSpecies, generatePreSignUrl, getProjectSpecies, getSciencetificSpecies, removePrjSpecies, requestNewSpecies, updateDisbaleSpecies, updateProjectSpecies, updateSpciesFav } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import { Download } from 'lucide-react';
import { useTopBarActions } from '@/component/header/TopBarActions';
import { BulkActionBar } from './components/BulkActionBar';
import { Modal } from './components/Modal';
import { SpeciesCard } from './components/SpeciesCard';
import { SpeciesForm } from './components/SpeciesForm';
import { SpeciesHeader } from './components/SpeciesHeader';
import { SpeciesStats } from './components/SpeciesStats';
import { SpeciesSidebar } from './components/SpeciesSidebar';
import { SpeciesSearch } from './components/SpeciesSearch';
import { DeleteModal } from './components/DeleteModal';
import { SpeciesRequestModal } from './components/SpeciesRequestModal';
import { cdnUrl } from '@/lib/cdn';

const SpeciesManagementDashboard = () => {
  const [scientificSpecies, setScientificSpecies] = useState([]);
  const [unknownSpecies, setUnknownSpecies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageDetails, setImageDetails] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [viewFilter, setViewFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    scientificName: '',
    commonName: '',
    description: '',
    requestReason: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);

  // Bulk selection states
  const [selectedUnknownSpecies, setSelectedUnknownSpecies] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);
  const userRole = selectedProject?.userRole;
  const canManageSpecies = ['owner', 'admin'].includes(userRole || '');

  // Combined species list for display
  const allSpecies = [
    ...scientificSpecies.map(s => ({
      ...s,
      isUnknown: false,
      type: 'scientific'
    })),
    ...unknownSpecies.map(s => ({
      ...s,
      isUnknown: true,
      type: 'unknown'
    }))
  ];


  useEffect(() => {
    if (speciesSearchTerm.length >= 3 && (isAddingNew || showBulkAssignModal)) {
      const timeoutId = setTimeout(async () => {
        const results = await searchSpeciesByName(speciesSearchTerm);
        setSearchResults(results);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [speciesSearchTerm, isAddingNew, showBulkAssignModal]);

  useEffect(() => {
    fetchProjectSpecies();
    setSelectedUnknownSpecies([])
  }, [selectedProject]);

  const fetchProjectSpecies = async () => {
    setLoading(true);
    if (!selectedProject?.uid) return;

    const response = await getProjectSpecies(accessToken || '', selectedProject?.uid);
    setLoading(false);

    if (response.statusCode !== 200) {
      toast.error(response.message || 'An error occurred while fetching species data.');
      return;
    }

    const data = response.data || {};

    // Transform known species to match expected format
    const transformedKnownSpecies = (data.knownSpecies || []).map(species => ({
      ...species,
      uid: species.scientificSpeciesId.toString(), // Convert to string for consistency
      favourite: species.isFavourite,
      interventionCount: species.interventionUsageCount,
      totalCount: species.totalSpecimenCount,
      isDisabled: species.isDisabled || false, // Add if missing
      projectSpeciesUid: species.projectSpeciesUid || null,
      // Create sources array based on boolean flags
      sources: [
        ...(species.isInProjectSpecies ? ['project'] : []),
        ...(species.interventionUsageCount > 0 ? ['intervention'] : [])
      ],

      // Map intervention types if available
      interventionTypes: species.interventionTypes || [],

      // Ensure all expected fields exist
      description: species.description || species.projectSpeciesNotes || '',
      isNativeSpecies: species.isNativeSpecies || false,
      disabled: species.isDisabled || false,
      notes: species.projectSpeciesNotes,

      // Keep original API fields for reference
      _originalData: species
    }));

    // Transform unknown species to match expected format
    const transformedUnknownSpecies = (data.unknownSpecies || []).map(species => ({
      ...species,
      // Add missing fields that UI expects
      favourite: false,
      isDisabled: false,
      disabled: false,
      sources: ['intervention'],
      interventionType: species.interventionType || 'unknown',
      interventionTypes: species.interventionTypes || [],

      // Map count fields
      count: species.speciesCount,
      totalCount: species.speciesCount,
      interventionCount: 1, // Unknown species are from single interventions

      // Ensure required fields
      isNativeSpecies: false,
      description: '',

      // Keep original API fields
      _originalData: species
    }));

    setScientificSpecies(transformedKnownSpecies);
    setUnknownSpecies(transformedUnknownSpecies);
  };


  const searchSpeciesByName = async (searchTerm) => {
    setIsSearchingSpecies(true);
    const response = await getSciencetificSpecies(accessToken || '', searchTerm);
    setIsSearchingSpecies(false);
    if (response.statusCode !== 200) {
      toast.error(response.message || 'An unexpected error occurred.');
      return [];
    }
    return response.data || [];
  };

  // Filter and sort logic
  const matchesSearch = (species) => {
    const searchFields = [
      species.scientificName,
      species.speciesName,
      species.commonName,
      species.interventionHid
    ].filter(Boolean);
    return searchFields.some(field =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const sortFn = (a, b) => {
    if (sortBy === 'date') {
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    }
    const nameA = a.scientificName || a.speciesName || '';
    const nameB = b.scientificName || b.speciesName || '';
    return nameA.localeCompare(nameB);
  };

  // Main grid shows scientific species; unknown species live in the sidebar.
  const gridSpecies = scientificSpecies
    .filter(matchesSearch)
    .filter((s) => {
      const disabled = s.isDisabled || s.disabled;
      switch (viewFilter) {
        case 'native': return s.isNativeSpecies && !disabled;
        case 'nonnative': return !s.isNativeSpecies && !disabled;
        case 'favourites': return s.favourite && !disabled;
        case 'disabled': return disabled;
        default: return !disabled; // 'all' -> active species
      }
    })
    .sort(sortFn);

  const sidebarUnknownSpecies = unknownSpecies.filter(matchesSearch);

  // Top 10 most planted scientific species by tree count.
  const topPlanted = [...scientificSpecies]
    .sort((a, b) => (b.totalCount || b.count || 0) - (a.totalCount || a.count || 0))
    .filter((s) => (s.totalCount || s.count || 0) > 0)
    .slice(0, 10);

  const totalSpeciesCount = allSpecies.length;
  const scientificCount = scientificSpecies.length;
  const unknownCount = unknownSpecies.length;

  // Stats (real data, no charts)
  const activeScientificCount = scientificSpecies.filter(s => !(s.isDisabled || s.disabled)).length;
  const nativeCount = scientificSpecies.filter(s => s.isNativeSpecies).length;
  const nativePercent = scientificCount ? Math.round((nativeCount / scientificCount) * 100) : 0;
  const totalInterventions = allSpecies.reduce((sum, s) => sum + (s.interventionCount || 0), 0);
  const topPlantedStat = topPlanted[0]
    ? { name: topPlanted[0].scientificName || topPlanted[0].speciesName, count: topPlanted[0].totalCount || topPlanted[0].count || 0 }
    : null;

  // Event handlers
  const handleSelectSpecies = (species) => {
    setSelectedSpecies(species);
    setShowDetailModal(true);
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
    setSelectedFromSearch(false);
    setShowAddModal(true);
  };

  const handleSelectSpeciesFromSearch = (species) => {
    setEditForm({
      ...species,
      uid: species.id,
      favourite: true,
      updatedAt: new Date().toISOString(),
      isNativeSpecies: false,
      disabled: false,
      habitat: '',
      height: '',
      hasFlowersOrFruits: '',
      bloomingSeason: ''
    });
    setSelectedFromSearch(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
  };

  const handleToggleFavorite = async (uid, fav, psid) => {
    // Find species in both arrays
    const scientificIndex = scientificSpecies.findIndex(s => s.uid === uid);
    const unknownIndex = unknownSpecies.findIndex(s => s.uid === uid);

    if (scientificIndex !== -1) {
      setScientificSpecies(prev => prev.map(species =>
        species.uid === uid
          ? { ...species, favourite: !species.favourite, updatedAt: new Date().toISOString() }
          : species
      ));
    }

    if (unknownIndex !== -1) {
      setUnknownSpecies(prev => prev.map(species =>
        species.uid === uid
          ? { ...species, favourite: !species.favourite, updatedAt: new Date().toISOString() }
          : species
      ));
    }

    if (selectedSpecies?.uid === uid) {
      setSelectedSpecies({ ...selectedSpecies, favourite: !selectedSpecies.favourite });
    }

    // Use the original scientificSpeciesId for API call if available
    const species = scientificSpecies.find(s => s.uid === uid) || unknownSpecies.find(s => s.uid === uid);
    const apiUid = species?._originalData?.scientificSpeciesId || uid;

    await updateSpciesFav(accessToken, { fav: fav }, selectedProject.uid, psid);
  };

  const handleToggleDisabled = async (uid, dis, psid) => {
    const scientificIndex = scientificSpecies.findIndex(s => s.uid === uid);
    const unknownIndex = unknownSpecies.findIndex(s => s.uid === uid);

    if (scientificIndex !== -1) {
      setScientificSpecies(prev =>
        prev.map(species =>
          species.uid === uid
            ? { ...species, isDisabled: !species.isDisabled, disabled: !species.disabled, updatedAt: new Date().toISOString() }
            : species
        )
      );
    }

    if (unknownIndex !== -1) {
      setUnknownSpecies(prev =>
        prev.map(species =>
          species.uid === uid
            ? { ...species, isDisabled: !species.isDisabled, disabled: !species.disabled, updatedAt: new Date().toISOString() }
            : species
        )
      );
    }

    if (selectedSpecies?.uid === uid) {
      setSelectedSpecies({
        ...selectedSpecies,
        isDisabled: !selectedSpecies.isDisabled,
        disabled: !selectedSpecies.disabled
      });
    }

    // Use original ID for API call
    const species = scientificSpecies.find(s => s.uid === uid) || unknownSpecies.find(s => s.uid === uid);
    const apiUid = species?._originalData?.scientificSpeciesId || uid;

    await updateDisbaleSpecies(accessToken, { disable: dis }, selectedProject.uid, psid);
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageDetails(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = () => {
    setEditForm({ ...selectedSpecies });
    setIsEditing(true);
  };




  const uploadViaAPI = async (selectedImage: File, uploadUrl: string) => {
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      const response = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(uploadUrl)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };



  const uploadImage = async () => {
    try {
      if (!imageDetails) {
        throw 'Image Details not found'
      }
      // Get pre-signed URL
      const presignedResponse = await generatePreSignUrl(accessToken, {
        fileName: String(new Date().getMilliseconds()),
        fileType: imageDetails?.type,
        folder: 'species'
      })

      if (presignedResponse.statusCode !== 200 && presignedResponse.statusCode !== 201) {
        throw new Error(presignedResponse.message || 'Failed to get upload URL');
      }

      const response = await uploadViaAPI(imageDetails, presignedResponse.data.data.uploadUrl)
      if (response.success) {
        return {
          fileName: presignedResponse.data.data.fileName,
          success: true
        }
      } else {
        throw 'Failed to upload image'
      }

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        fileName: '',
        success: false
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!canManageSpecies) {
        toast.error('You do not have permission to add or edit species.');
        setLoading(false);
        return;
      }
      let payLoad = {
        isDisbaledSpecies: editForm.disabled,
        isNativeSpecies: editForm.isNativeSpecies,
        favourite: editForm.favourite,
        metadata: {
          habitat: editForm.habitat,
          height: editForm.height,
          flowers: editForm.hasFlowersOrFruits,
          bloomingSeason: editForm.bloomingSeason
        }
      }
      if (editForm.commonName) {
        payLoad['commonName'] = editForm.commonName;
      }
      if (editForm.description) {
        payLoad['notes'] = editForm.description;
      }
      let fileName = ''
      if (imageDetails) {
        const uplaodResponse = await uploadImage()
        if (uplaodResponse.success) {
          fileName = uplaodResponse.fileName
        }
      }
      if (fileName) {
        payLoad['image'] = fileName
      }

      if (isAddingNew) {
        payLoad['scientificSpeciesId'] = editForm.uid;
        console.log('payLoad', payLoad);
        const resp = await createNewProjectSpecies(accessToken || '', payLoad, selectedProject?.uid);
        if (resp.statusCode === 201 || resp.statusCode === 200) {
          toast.success("Species Added")
        } else {
          toast.error(resp.message || "Failed to add species")
        }
        setSelectedSpecies(null)
      } else {
        const resp = await updateProjectSpecies(accessToken || '', payLoad, selectedProject?.uid, editForm.projectSpeciesUid);
        if (resp.statusCode === 201 || resp.statusCode === 200) {
          toast.success("Species Updated")
        } else {
          toast.error("Failed to updated species")
        }
        setSelectedSpecies(null)
      }
      setIsEditing(false);
      setIsAddingNew(false);
      setShowDetailModal(false);
      setShowAddModal(false);
      setImageDetails(null);
      await fetchProjectSpecies()
    } catch (error) {
      toast.error(`Error uploading data: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAddingNew(false);
    setShowDetailModal(false);
    setShowAddModal(false);
    setShowBulkAssignModal(false);
    setImageDetails(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    setIsRemoving(true);
    console.log('Deleting species with UID:', selectedSpecies);
    try {
      if (selectedSpecies.isUnknown) {
        // For unknown species, you might want to call a different API
        // await deleteInterventionSpecies(accessToken, selectedSpecies.interventionUid, selectedSpecies.uid);
        setUnknownSpecies(prev => prev.filter(s => s.uid !== selectedSpecies.uid));
        toast.success('Unknown species removed');
      } else {
        console.log('Removing scientific species with projectSpeciesUid:', selectedSpecies.projectSpeciesUid);
        // For project species
        const response = await removePrjSpecies(accessToken || '', selectedProject?.uid, selectedSpecies.projectSpeciesUid);
        if (response.statusCode === 200) {
          setScientificSpecies(prev => prev.filter(s => s.uid !== selectedSpecies.uid));
          toast.success('Species removed successfully');
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error) {
      toast.error(`Error removing species: ${String(error)}`);
    }

    setSelectedSpecies(null);
    setShowConfirmModal(false);
    setShowDetailModal(false);
    setIsRemoving(false);
  };

  const downloadJsonAsCsv = (jsonData, filename) => {
    if (!jsonData || jsonData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const flattenedData = jsonData.map(species => ({
      'Scientific Name': species.scientificName || species.speciesName || '',
      'Common Name': species.commonName || '',
      'Description': species.description || species.notes || '',
      'Type': species.isUnknown ? 'Unknown' : 'Scientific',
      'Sources': species.sources ? species.sources.join(', ') : '',
      'Total Count': species.totalCount || species.count || species.totalSpecimenCount || 0,
      'Intervention Count': species.interventionCount || species.interventionUsageCount || 0,
      'Is In Project': species.isInProjectSpecies ? 'Yes' : 'No',
      'Is Native': species.isNativeSpecies ? 'Yes' : 'No',
      'Is Favorite': species.favourite || species.isFavourite ? 'Yes' : 'No',
      'Is Disabled': species.disabled || species.isDisabled ? 'Yes' : 'No',
      'Intervention HID': species.interventionHid || '',
      'Intervention UIDs': species.interventionIds ? species.interventionIds.join(', ') : '',
      'Created At': species.createdAt || '',
      'Updated At': species.updatedAt || ''
    }));

    // Rest of CSV export logic remains the same...
    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row =>
        headers.map(header =>
          typeof row[header] === 'string' && row[header].includes(',')
            ? `"${row[header]}"`
            : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Data exported successfully');
  };

  const handleRequestNew = () => {
    setRequestForm({
      scientificName: speciesSearchTerm,
      commonName: '',
      description: '',
      requestReason: ''
    });
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    setRequestLoading(true);
    try {

      const response = await requestNewSpecies(
        accessToken || '',
        requestForm,
        selectedProject?.uid,
      );

      if (response.statusCode === 201 || response.statusCode === 200) {
        toast.success('Species request submitted successfully');
        setShowRequestModal(false);
        setRequestForm({
          scientificName: '',
          commonName: '',
          description: '',
          requestReason: ''
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(`Error submitting request: ${String(error)}`);
    } finally {
      setRequestLoading(false);
    }
  };

  // Bulk operations
  const handleCheckboxChange = (uid) => {
    console.log('Checkbox clicked for UID:', uid);
    console.log('Current selected:', selectedUnknownSpecies);

    setSelectedUnknownSpecies(prev => {
      const newSelection = prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid];

      console.log('New selection:', newSelection);
      return newSelection;
    });
  };


  const handleClearSelection = () => {
    setSelectedUnknownSpecies([]);
  };

  const handleBulkAssignSpecies = () => {
    setShowBulkAssignModal(true);
    setSpeciesSearchTerm('');
    setSearchResults([]);
  };

  const handleBulkAssignSave = async (selectedScientificSpecies) => {
    setLoading(true);
    try {
      // Update each selected unknown species with the scientific species
      const updatePromises = selectedUnknownSpecies.map(async (unknownUid) => {
        const unknownSpeciesItem = unknownSpecies.find(s => s.uid === unknownUid);
        if (unknownSpeciesItem) {
          // Call intervention edit API for each
          // await updateInterventionSpecies(
          //   accessToken, 
          //   unknownSpeciesItem.interventionUid, 
          //   {
          //     ...selectedScientificSpecies,
          //     count: unknownSpeciesItem.count
          //   }
          // );

          // For now, simulate the update
          return Promise.resolve();
        }
      });

      await Promise.all(updatePromises);

      setSelectedUnknownSpecies([]);
      setShowBulkAssignModal(false);
      await fetchProjectSpecies(); // Refresh data
      toast.success(`Updated ${selectedUnknownSpecies.length} species successfully`);
    } catch (error) {
      toast.error(`Error updating species: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useTopBarActions(
    [
      ...(canManageSpecies ? [{
        label: 'Add Species',
        onClick: handleStartAdd,
        icon: Plus,
        variant: 'primary' as const,
        hideLabelOnMobile: true,
      }] : []),
      {
        label: 'Export',
        onClick: () => downloadJsonAsCsv(allSpecies, 'species-data'),
        icon: Download,
        variant: 'outline' as const,
        hideLabelOnMobile: true,
      },
    ],
    [canManageSpecies, allSpecies.length]
  );

  return (
    <div className="bg-muted/20 flex flex-col h-screen w-full">
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedUnknownSpecies.length > 0 && (
          <BulkActionBar
            selectedCount={selectedUnknownSpecies.length}
            onAssignSpecies={handleBulkAssignSpecies}
            onClearSelection={handleClearSelection}
          />
        )}
      </AnimatePresence>

      <div className={cn('flex-1 overflow-y-auto p-6 space-y-5', selectedUnknownSpecies.length > 0 && 'pt-16')}>
        <SpeciesHeader
          projectName={selectedProject?.name}
          speciesCount={totalSpeciesCount}
          nativePercent={nativePercent}
          unknownCount={unknownCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewFilter={viewFilter}
          setViewFilter={setViewFilter}
        />

        <SpeciesStats
          activeCount={activeScientificCount}
          totalCount={scientificCount}
          topPlanted={topPlantedStat}
          totalInterventions={totalInterventions}
          unknownCount={unknownCount}
        />

        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* Species grid */}
          <div className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className="flex justify-center items-center py-24 text-muted-foreground/60">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : gridSpecies.length === 0 ? (
              <div className="text-center py-16">
                <Leaf size={48} className="mx-auto text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground mb-2">No species found</p>
                <p className="text-muted-foreground/60 text-sm">Start adding species to this project</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gridSpecies.map((species) => (
                  <SpeciesCard
                    key={species.uid}
                    species={species}
                    isSelected={selectedSpecies?.uid === species.uid}
                    onClick={() => handleSelectSpecies(species)}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleDisabled={handleToggleDisabled}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full xl:w-[320px] flex-shrink-0">
            <SpeciesSidebar
              unknownSpecies={sidebarUnknownSpecies}
              topPlanted={topPlanted}
              selectedUnknown={selectedUnknownSpecies}
              onToggleUnknown={handleCheckboxChange}
              onAssign={handleBulkAssignSpecies}
              onClear={handleClearSelection}
              onSelectSpecies={handleSelectSpecies}
            />
          </aside>
        </div>
      </div>

      {/* Species Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={isEditing ? "Edit Species" : (selectedSpecies?.scientificName || selectedSpecies?.speciesName)}
        size="large"
      >
        {selectedSpecies && (
          <div className="space-y-5">
            {isEditing ? (
              <SpeciesForm
                species={selectedSpecies}
                editForm={editForm}
                setEditForm={setEditForm}
                onImageUpload={handleImageUpload}
                isUnknown={selectedSpecies.isUnknown}
                isAddingNew={imageDetails || isAddingNew}
              />
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted/40 rounded-md overflow-hidden flex-shrink-0">
                    {selectedSpecies.image ? (
                      <img src={cdnUrl('species', selectedSpecies.image) ?? ''} alt={selectedSpecies.commonName || selectedSpecies.speciesName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf size={28} className="text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground italic break-words">
                        {selectedSpecies.scientificName || selectedSpecies.speciesName}
                      </h3>
                      {selectedSpecies.isUnknown && (
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px]">Unknown</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedSpecies.commonName || `Intervention: ${selectedSpecies.interventionHid}`}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedSpecies.favourite && (
                        <Badge variant="secondary" className="bg-red-50 text-red-600 text-[10px] gap-1">
                          <Heart size={10} fill="currentColor" /> Favorite
                        </Badge>
                      )}
                      {selectedSpecies.isNativeSpecies && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">Native</Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn('text-[10px]',
                          selectedSpecies.disabled
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {selectedSpecies.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                {(() => {
                  const trees = selectedSpecies.totalCount || selectedSpecies.count || 0
                  const interventions = selectedSpecies.interventionCount || 0
                  if (trees === 0 && interventions === 0) return null
                  return (
                    <div>
                      <h4 className="text-xs font-medium text-foreground uppercase tracking-wide mb-2">Usage</h4>
                      <div className="flex items-center gap-5 text-sm text-foreground flex-wrap">
                        {trees > 0 && (
                          <div className="flex items-center gap-1.5">
                            <TreePine size={14} className="text-muted-foreground/60" />
                            <span><span className="font-medium">{trees.toLocaleString('en-US')}</span> trees</span>
                          </div>
                        )}
                        {interventions > 0 && (
                          <div className="flex items-center gap-1.5">
                            <LeafIcon size={14} className="text-muted-foreground/60" />
                            <span><span className="font-medium">{interventions}</span> interventions</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {selectedSpecies.description && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground uppercase tracking-wide mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedSpecies.description}</p>
                  </div>
                )}

                {(selectedSpecies.metadata?.habitat || selectedSpecies.metadata?.height || selectedSpecies.metadata?.flowers || selectedSpecies.metadata?.bloomingSeason) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedSpecies.metadata?.habitat && (
                      <div><div className="text-[11px] text-muted-foreground">Habitat</div><p className="text-foreground">{selectedSpecies.metadata.habitat}</p></div>
                    )}
                    {selectedSpecies.metadata?.height && (
                      <div><div className="text-[11px] text-muted-foreground">Height</div><p className="text-foreground">{selectedSpecies.metadata.height}</p></div>
                    )}
                    {selectedSpecies.metadata?.flowers && (
                      <div><div className="text-[11px] text-muted-foreground">Flowers/Fruits</div><p className="text-foreground">{selectedSpecies.metadata.flowers}</p></div>
                    )}
                    {selectedSpecies.metadata?.bloomingSeason && (
                      <div><div className="text-[11px] text-muted-foreground">Blooming Season</div><p className="text-foreground">{selectedSpecies.metadata.bloomingSeason}</p></div>
                    )}
                  </div>
                )}

                {selectedSpecies.sources && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground uppercase tracking-wide mb-2">Sources</h4>
                    <div className="flex items-center gap-2">
                      {selectedSpecies.sources.map((source: string) => (
                        <Badge
                          key={source}
                          variant="secondary"
                          className={cn('text-[10px] capitalize',
                            source === 'project' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground/60">
                  Last updated: {format(parseISO(selectedSpecies.updatedAt || selectedSpecies.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="h-8">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading} className="h-8 gap-1.5 ">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  {canManageSpecies && selectedSpecies.sources && !selectedSpecies.sources.includes('intervention') && (
                    <Button variant="ghost" size="sm" onClick={() => setShowConfirmModal(true)} className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  )}
                  {canManageSpecies && !selectedSpecies.isUnknown && selectedSpecies.projectSpeciesUid && (
                    <Button size="sm" onClick={handleStartEdit} className="h-8 gap-1.5 ">
                      <Edit2 size={14} />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Species Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Species"
        size="large"
      >
        <div className="space-y-5">
          {!selectedFromSearch ? (
            <div>
              <h4 className="text-xs font-medium text-foreground uppercase tracking-wide mb-3">
                Search Species Database
              </h4>
              <SpeciesSearch
                searchTerm={speciesSearchTerm}
                onSearchChange={setSpeciesSearchTerm}
                searchResults={searchResults}
                isSearching={isSearchingSpecies}
                onSelectSpecies={handleSelectSpeciesFromSearch}
                onRequestNew={handleRequestNew}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSelectedFromSearch(false); setEditForm({}); }}
                  className="h-7 w-7"
                >
                  <ArrowLeft size={14} />
                </Button>
                <h4 className="text-xs font-medium text-foreground uppercase tracking-wide">Species Details</h4>
              </div>
              <SpeciesForm
                species={editForm}
                editForm={editForm}
                setEditForm={setEditForm}
                onImageUpload={handleImageUpload}
                isUnknown={false}
                isAddingNew={imageDetails || isAddingNew}
              />
            </div>
          )}

          {selectedFromSearch && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading || !canManageSpecies} className="h-8 gap-1.5 ">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {loading ? 'Adding...' : 'Add Species'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Bulk Assign Species Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => setShowBulkAssignModal(false)}
        title={`Assign Scientific Species to ${selectedUnknownSpecies.length} Unknown Species`}
        size="large"
      >
        <div className="space-y-5">
          <div className="bg-primary/10/60 border border-primary/20 p-3 rounded-md">
            <p className="text-sm text-primary">
              Search and select a scientific species to assign to all {selectedUnknownSpecies.length} selected unknown species.
            </p>
          </div>

          <SpeciesSearch
            searchTerm={speciesSearchTerm}
            onSearchChange={setSpeciesSearchTerm}
            searchResults={searchResults}
            isSearching={isSearchingSpecies}
            onRequestNew={handleRequestNew}
            onSelectSpecies={undefined}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="h-8">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <SpeciesRequestModal showRequestModal={showRequestModal} setShowRequestModal={setShowRequestModal} requestForm={requestForm} setRequestForm={setRequestForm} requestLoading={requestLoading} handleSubmitRequest={handleSubmitRequest} />
      <DeleteModal
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        selectedSpecies={selectedSpecies}
        isRemoving={isRemoving}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default SpeciesManagementDashboard;