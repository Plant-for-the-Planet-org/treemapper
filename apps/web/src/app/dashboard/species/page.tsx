'use client'

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {

  Plus,
  Edit2,
  Trash2,
  Leaf,
  Heart,
  Save,

  AlertCircle,

  Check,
  ArrowLeft,
  Users,
  TreePine,
  LeafIcon,

} from 'lucide-react';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { createNewProjectSpecies, generatePreSignUrl, getProjectSpecies, getSciencetificSpecies, removePrjSpecies, requestNewSpecies, updateDisbaleSpecies, updateProjectSpecies, updateSpciesFav } from '@shared-core/fetchApi/api.fetch';
import { toast } from 'react-toastify';
import { BulkActionBar } from './components/BulkActionBar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Modal } from './components/Modal';
import { SpeciesCard } from './components/SpeciesCard';
import { SpeciesForm } from './components/SpeciesForm';
import { SpeciesHeader } from './components/SpeciesHeader';
import { SpeciesSearch } from './components/SpeciesSearch';
import { DeleteModal } from './components/DeleteModal';
import { SpeciesRequestModal } from './components/SpeciesRequestModal';

const SpeciesManagementDashboard = () => {
  const [scientificSpecies, setScientificSpecies] = useState([]);
  const [unknownSpecies, setUnknownSpecies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showDisabled, setShowDisabled] = useState(true);
  const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
  const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFromSearch, setSelectedFromSearch] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageDetails, setImageDetails] = useState(null);
  const [sortBy, setSortBy] = useState('name');
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

  // New filter states
  const [speciesTypeFilter, setSpeciesTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [interventionTypeFilter, setInterventionTypeFilter] = useState([]);

  // Bulk selection states
  const [selectedUnknownSpecies, setSelectedUnknownSpecies] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  const { accessToken } = useToken();
  const selectedProject = useProjectStore(state => state.selectedProject);

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


  // Get unique intervention types for filter
  const interventionTypes = [...new Set([
    ...scientificSpecies.flatMap(s => s.interventionTypes || []),
    ...unknownSpecies.map(s => s.interventionType).filter(Boolean)
  ])];

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
  const filteredSpecies = allSpecies.filter((species) => {
    const searchFields = [
      species.scientificName,
      species.speciesName,
      species.commonName,
      species.interventionHid
    ].filter(Boolean);

    const matchesSearch = searchFields.some(field =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesType = speciesTypeFilter === 'all' ||
      (speciesTypeFilter === 'scientific' && !species.isUnknown) ||
      (speciesTypeFilter === 'unknown' && species.isUnknown);

    // Fix source filter logic
    const matchesSource = sourceFilter === 'all' ||
      (sourceFilter === 'project' && species.sources?.includes('project')) ||
      (sourceFilter === 'intervention' && species.sources?.includes('intervention')) ||
      (sourceFilter === 'both' && species.sources?.includes('project') && species.sources?.includes('intervention'));

    const matchesInterventionType = interventionTypeFilter.length === 0 ||
      (species.interventionTypes && species.interventionTypes.some(type => interventionTypeFilter.includes(type))) ||
      (species.interventionType && interventionTypeFilter.includes(species.interventionType));

    return matchesSearch && matchesType && matchesSource && matchesInterventionType;
  });


  const sortedSpecies = [...filteredSpecies.filter(el => {
    if (showDisabled) {
      return el;
    }
    return !el.isDisabled && !el.disabled; // Check both possible field names
  })].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        const nameA = a.scientificName || a.speciesName || '';
        const nameB = b.scientificName || b.speciesName || '';
        return nameA.localeCompare(nameB);
      case 'date':
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      case 'favorite':
        return (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0);
      case 'interventionCount':
        const countA = a.interventionCount || 0;
        const countB = b.interventionCount || 0;
        return countB - countA;
      default:
        return 0;
    }
  });


  const totalSpeciesCount = allSpecies.length;
  const scientificCount = scientificSpecies.length;
  const unknownCount = unknownSpecies.length;

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

  return (
    <div className="bg-gray-50 flex flex-col h-screen w-full">
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

      <div className={selectedUnknownSpecies.length > 0 ? 'pt-16' : ''}>
        <SpeciesHeader
          speciesCount={totalSpeciesCount}
          scientificCount={scientificCount}
          unknownCount={unknownCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showDisabled={showDisabled}
          setShowDisabled={setShowDisabled}
          speciesTypeFilter={speciesTypeFilter}
          setSpeciesTypeFilter={setSpeciesTypeFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          interventionTypeFilter={interventionTypeFilter}
          setInterventionTypeFilter={setInterventionTypeFilter}
          interventionTypes={interventionTypes}
          onAddSpecies={handleStartAdd}
          onExport={() => downloadJsonAsCsv(allSpecies, 'species-data')}
        />

        <div className="flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner size="large" />
            </div>
          ) : sortedSpecies.length === 0 ? (
            <div className="text-center py-12">
              <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No species found</p>
              <p className="text-gray-400 text-sm">Start adding species to this project</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedSpecies.map((species) => (
                <SpeciesCard
                  key={species.uid}
                  species={species}

                  isSelected={selectedSpecies?.uid === species.uid}
                  onClick={() => handleSelectSpecies(species)}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleDisabled={handleToggleDisabled}
                  isUnknown={species.isUnknown}
                  showCheckbox={species.isUnknown} // Only show checkbox for unknown species
                  isChecked={selectedUnknownSpecies.includes(species.uid)} // This should work correctly now
                  onCheckboxChange={handleCheckboxChange}
                />
              ))}
            </div>
          )}
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
          <div className="space-y-6">
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
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedSpecies.image ? (
                      <img src={`${process.env.NEXT_PUBLIC_CDN}/species/${selectedSpecies.image}`} alt={selectedSpecies.commonName || selectedSpecies.speciesName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 italic">
                        {selectedSpecies.scientificName || selectedSpecies.speciesName}
                      </h3>
                      {selectedSpecies.isUnknown && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          Unknown
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedSpecies.commonName || `Intervention: ${selectedSpecies.interventionHid}`}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      {selectedSpecies.favourite && (
                        <span className="flex items-center gap-1 text-red-600">
                          <Heart size={12} fill="currentColor" />
                          Favorite
                        </span>
                      )}
                      {selectedSpecies.isNativeSpecies && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Native
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full ${selectedSpecies.disabled
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {selectedSpecies.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                {(selectedSpecies.totalCount > 0 || selectedSpecies.interventionCount > 0 || selectedSpecies.count > 0) && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Statistics</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {selectedSpecies.totalCount > 0 && (
                        <div className="flex items-center gap-1">
                          <TreePine size={14} />
                          <span>{selectedSpecies.totalCount} trees total</span>
                        </div>
                      )}
                      {selectedSpecies.interventionCount > 0 && (
                        <div className="flex items-center gap-1">
                          <LeafIcon size={14} />
                          <span>Used in {selectedSpecies.interventionCount} interventions</span>
                        </div>
                      )}
                      {selectedSpecies.count && (
                        <div className="flex items-center gap-1">
                          <TreePine size={14} />
                          <span>{selectedSpecies.count} trees</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedSpecies.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedSpecies.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedSpecies.metadata?.habitat && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Habitat</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.habitat}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.height && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Height</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.height}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.flowers && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Flowers/Fruits</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.flowers}</p>
                    </div>
                  )}
                  {selectedSpecies.metadata?.bloomingSeason && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Blooming Season</h5>
                      <p className="text-gray-600">{selectedSpecies.metadata.bloomingSeason}</p>
                    </div>
                  )}
                </div>

                {/* Sources */}
                {selectedSpecies.sources && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sources</h4>
                    <div className="flex items-center gap-2">
                      {selectedSpecies.sources.map((source) => (
                        <span
                          key={source}
                          className={`px-2 py-1 text-xs rounded-full ${source === 'project'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                            }`}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(selectedSpecies.updatedAt || selectedSpecies.createdAt).toLocaleString()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <LoadingSpinner size="small" /> : <Save size={14} />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  {selectedSpecies.sources && !selectedSpecies.sources.includes('intervention') ? <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button> : null}
                  {!selectedSpecies.isUnknown && selectedSpecies.projectSpeciesUid ? <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button> : null}
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
        <div className="space-y-6">
          {!selectedFromSearch ? (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">
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
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setSelectedFromSearch(false);
                    setEditForm({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <h4 className="text-sm font-medium text-gray-900">
                  Species Details
                </h4>
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
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="small" /> : <Plus size={14} />}
                {loading ? 'Adding...' : 'Add Species'}
              </button>
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
        <div className="space-y-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Search and select a scientific species to assign to all {selectedUnknownSpecies.length} selected unknown species.
            </p>
          </div>

          <SpeciesSearch
            searchTerm={speciesSearchTerm}
            onSearchChange={setSpeciesSearchTerm}
            searchResults={searchResults}
            isSearching={isSearchingSpecies}
            onRequestNew={handleRequestNew} onSelectSpecies={undefined} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
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