import React, { useState, useEffect } from 'react';
import {
    Search,
    Download,
    PlusCircle,
    Edit2,
    Trash2,
    Leaf,
    Heart,
    Save,
    X,
    Upload,
    Calendar,
    Hash,
    Eye,
    EyeOff,
    Flower,
    MapPin,
    AlertCircle,
    Plus,
    Loader
} from 'lucide-react';
import { useToken } from '../../context/TokenContext';
import useProjectStore from '../../store/useProjectStore';
import { createNewProjectSpecies, getProjectSpecies, getSciencetificSpecies, removePrjSpecies, updateProjectSpecies } from '../../api/api.fetch';
import { toast } from 'react-toastify';

const SpeciesManagementDashboard = () => {
    const [speciesList, setSpeciesList] = useState([
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState(speciesList[0]);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showDisabled, setShowDisabled] = useState(true);
    const [speciesSearchTerm, setSpeciesSearchTerm] = useState('');
    const [isSearchingSpecies, setIsSearchingSpecies] = useState(false);
    const [speciesNotFound, setSpeciesNotFound] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedFromSearch, setSelectedFromSearch] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [requestForm, setRequestForm] = useState({
        scientificName: '',
        commonName: '',
        description: '',
        requestReason: ''
    });

    const { accessToken } = useToken()
    const selectedProject = useProjectStore(state => state.selectedProject)
    // Mock API function to search for species by scientific name
    const searchSpeciesByName = async (searchTerm) => {
        setIsSearchingSpecies(true);
        const response = await getSciencetificSpecies(accessToken || '', searchTerm);
        if (response.statusCode !== 200) {
            setIsSearchingSpecies(false);
            if (response.message) {
                toast.error(String(response.message));
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
            return [];
        }

        setIsSearchingSpecies(false);
        return response.data || [];
    };

    // Debounced search effect
    useEffect(() => {
        if (speciesSearchTerm.length >= 3 && isAddingNew) {
            const timeoutId = setTimeout(async () => {
                const results = await searchSpeciesByName(speciesSearchTerm);
                setSearchResults(results);
                setShowDropdown(true);
                setSpeciesNotFound(results.length === 0);
                setSelectedFromSearch(false);
            }, 500); // 500ms debounce

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
            setSpeciesNotFound(false);
        }
    }, [speciesSearchTerm, isAddingNew]);

    useEffect(() => {
        fetchProjectSpecies();
    }, [])

    const fetchProjectSpecies = async () => {
        if (!selectedProject?.uid) return;
        const response = await getProjectSpecies(accessToken || '', selectedProject?.uid);
        if (response.statusCode !== 200) {
            toast.error(response.message || 'An error occurred while fetching species data.');
            return;
        }
        setSpeciesList(response.data || []);
    }


    const filteredSpecies = speciesList.filter((species) => {
        const matchesSearch = species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            species.commonName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVisibility = showDisabled || !species.disabled;
        return matchesSearch && matchesVisibility;
    });

    const favoriteCount = speciesList.filter((s) => s.favourite).length;
    const activeCount = speciesList.filter((s) => !s.disabled).length;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleSelectSpecies = (species) => {
        setSelectedSpecies(species);
        setIsEditing(false);
        setIsAddingNew(false);
        setSpeciesNotFound(false);
    };

    const handleStartEdit = () => {
        setEditForm({ ...selectedSpecies });
        setIsEditing(true);
        setIsAddingNew(false);
    };

    const handleStartAdd = () => {
        const newSpecies = {
            uid: 999999,
            scientificName: '',
            commonName: '',
            image: '',
            favourite: false,
            updatedAt: new Date().toISOString(),
            description: '',
            habitat: '',
            height: '',
            hasFlowersOrFruits: '',
            isNativeSpecies: false,
            bloomingSeason: '',
            disabled: false
        };
        setEditForm(newSpecies);
        setSelectedSpecies(newSpecies);
        setIsEditing(true);
        setIsAddingNew(true);
        setSpeciesSearchTerm('');
        setSpeciesNotFound(false);
        setSearchResults([]);
        setShowDropdown(false);
        setSelectedFromSearch(false);
    };

    const handleSelectSpeciesFromSearch = (species) => {
        setEditForm({
            ...editForm,
            ...species,
            uid: species.id,
            favourite: false,
            lastUpdated: new Date().toISOString(),
            isNativeSpecies: false,
            disabled: false
        });
        setSpeciesSearchTerm('');
        setSearchResults([]);
        setShowDropdown(false);
        setSpeciesNotFound(false);
        setSelectedFromSearch(false);
    };

    const handleSearchInputChange = (value) => {
        setSpeciesSearchTerm(value);
        if (selectedFromSearch) {
            setSelectedFromSearch(false);
            // Reset form if user starts typing again after selection
            setEditForm({
                ...editForm,
                scientificName: '',
                commonName: '',
                description: '',
                habitat: '',
                height: '',
                hasFlowersOrFruits: '',
                bloomingSeason: ''
            });
        }
    };


    const handleRequestNewSpecies = () => {
        setRequestForm({
            scientificName: speciesSearchTerm,
            commonName: '',
            description: '',
            requestReason: ''
        });
        setShowRequestModal(true);
    };

    const handleSubmitRequest = () => {
        // In real implementation, this would send the request to your backend
        console.log('New species request:', requestForm);
        alert('Request submitted successfully! We will review your request and add the species to our database.');
        setShowRequestModal(false);
        setRequestForm({
            scientificName: '',
            commonName: '',
            description: '',
            requestReason: ''
        });
    };

    const handleSave = async () => {
        let payLoad = {

            isNativeSpecies: editForm.isNativeSpecies,
            favourite: editForm.favourite,
        }
        if (editForm.commonName) {
            payLoad['commonName'] = editForm.commonName;
        }
        if (editForm.description) {
            payLoad['description'] = editForm.description;
        }

        if (isAddingNew) {
            payLoad['scientificSpeciesId'] = parseInt(editForm.uid)
            const response = await createNewProjectSpecies(accessToken || '', payLoad, selectedProject?.uid);
            if (response.statusCode !== 200) {
                toast.error(response.message || 'An error occurred while adding the species.')
                return
            }
            toast.success('Species added successfully!');
            setSpeciesList([...speciesList, editForm]);
        } else {
            const response = await updateProjectSpecies(accessToken || '', payLoad, selectedProject?.uid, editForm.uid);
            if (response.statusCode !== 200 && response.statusCode !== 201) {
                toast.error(response.message || 'An error occurred while adding the species.')
                return
            }
            toast.success('Updated successfully!');
            setSpeciesList(speciesList.map(species =>
                species.uid === editForm.uid ? { ...editForm, lastUpdated: new Date().toISOString() } : species
            ));
        }
        setSelectedSpecies(editForm);
        setIsEditing(false);
        setIsAddingNew(false);
        setSpeciesNotFound(false);
    };

    const handleCancel = () => {
        if (isAddingNew) {
            setSelectedSpecies(speciesList[0]);
        }
        setIsEditing(false);
        setIsAddingNew(false);
        setSpeciesNotFound(false);
    };

    const handleDelete = () => {
        setShowConfirmModal(true)
    };

    const handleConfirmDelete = async () => {
        setIsRemoving(true);
        const response = await removePrjSpecies(accessToken || '', selectedProject?.uid, selectedSpecies.uid);
        if (response.statusCode !== 200) {
            toast.error(response.message || 'An error occurred while deleting the species.');
            setShowConfirmModal(false)
            return
        }
        toast.success('Species deleted successfully!');
        const updatedList = speciesList.filter(s => s.uid !== selectedSpecies.uid);
        setSpeciesList(updatedList);
        setSelectedSpecies(updatedList[0] || null);
        setIsEditing(false);
        setShowConfirmModal(false)
        setIsAddingNew(false);
    }


    const handleToggleFavorite = (uid) => {
        setSpeciesList(speciesList.map(species =>
            species.uid === uid ? { ...species, favourite: !species.favourite, lastUpdated: new Date().toISOString() } : species
        ));
        if (selectedSpecies.uid === uid) {
            setSelectedSpecies({ ...selectedSpecies, favourite: !selectedSpecies.favourite });
        }
    };

    const handleToggleDisabled = (uid) => {
        setSpeciesList(speciesList.map(species =>
            species.uid === uid ? { ...species, disabled: !species.disabled, lastUpdated: new Date().toISOString() } : species
        ));
        if (selectedSpecies.uid === uid) {
            setSelectedSpecies({ ...selectedSpecies, disabled: !selectedSpecies.disabled });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm({ ...editForm, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const downloadJsonAsCsv = (jsonData, filename) => {
        if (!jsonData || !jsonData.length) return;

        const headers = Object.keys(jsonData[0]);
        const csvRows = [
            headers.join(','),
            ...jsonData.map(item =>
                headers.map(header => {
                    const cellValue = item[header] === null || item[header] === undefined ? '' : item[header];
                    const escapedValue = String(cellValue).replace(/"/g, '""').replace(/\n/g, ' ');
                    return /[,"\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
                }).join(',')
            )
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-bold text-gray-900">Species Management</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Hash size={16} />
                                Total: {speciesList.length}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye size={16} className="text-green-500" />
                                Active: {activeCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart size={16} className="text-red-500" />
                                Favorites: {favoriteCount}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search species..."
                                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>

                        <button
                            onClick={() => setShowDisabled(!showDisabled)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showDisabled
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {showDisabled ? <Eye size={18} /> : <EyeOff size={18} />}
                            {showDisabled ? 'Hide Disabled' : 'Show Disabled'}
                        </button>

                        <button
                            onClick={handleStartAdd}
                            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                        >
                            <PlusCircle size={18} />
                            Add Species
                        </button>

                        <button
                            onClick={() => downloadJsonAsCsv(speciesList, 'species-data')}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Left Panel - Species List */}
                <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        {filteredSpecies.length === 0 ? (
                            <div className="text-center py-12">
                                <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">No species found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredSpecies.map((species) => (
                                    <div
                                        key={species.uid}
                                        onClick={() => handleSelectSpecies(species)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedSpecies?.uid === species.uid
                                            ? 'bg-green-50 border-2 border-green-200'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                            } ${species.disabled ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                {species.image ? (
                                                    <img
                                                        src={species.image}
                                                        alt={species.scientificName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Leaf size={20} className="text-green-500" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 italic truncate">
                                                    {species.scientificName}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {species.commonName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {species.isNativeSpecies && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                            <MapPin size={10} />
                                                            Native
                                                        </span>
                                                    )}
                                                    {species.disabled && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                                                            <EyeOff size={10} />
                                                            Disabled
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(species.updatedAt)}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-center gap-2">
                                                {species.favourite && (
                                                    <Heart size={16} fill="#ef4444" className="text-red-500" />
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleDisabled(species.uid);
                                                    }}
                                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                                >
                                                    {species.disabled ? (
                                                        <EyeOff size={14} className="text-red-500" />
                                                    ) : (
                                                        <Eye size={14} className="text-green-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Species Details */}
                <div className="flex-1 bg-white overflow-y-auto">
                    {selectedSpecies ? (
                        <div className="p-6">
                            {/* Action Bar */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {isAddingNew ? 'Add new species to project' : 'Species Details'}
                                    </h2>
                                    {!isAddingNew && (
                                        <button
                                            onClick={() => handleToggleFavorite(selectedSpecies.uid)}
                                            className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                            {selectedSpecies.favourite ? (
                                                <Heart size={20} fill="#ef4444" className="text-red-500" />
                                            ) : (
                                                <Heart size={20} className="text-gray-400" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleCancel}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Save size={16} />
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleStartEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Edit2 size={16} />
                                                Edit
                                            </button>
                                            {!isAddingNew && (
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {isEditing ? (
                                /* Edit Form */
                                <div className="space-y-6">
                                    {/* Species Search Section (only when adding new) */}
                                    {isAddingNew && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <h3 className="font-medium text-green-900 mb-3">Add from Existing Species</h3>
                                            <div className="relative">
                                                <div className="flex gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={speciesSearchTerm}
                                                            onChange={(e) => handleSearchInputChange(e.target.value)}
                                                            placeholder="Start typing species name (min 3 characters)..."
                                                            className="w-full px-4 py-2 border border-green-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                        />
                                                        {isSearchingSpecies && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                <Loader size={16} className="animate-spin text-blue-500" />
                                                            </div>
                                                        )}

                                                        {/* Search Results Dropdown */}
                                                        {showDropdown && searchResults.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                                                {searchResults.map((species, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => handleSelectSpeciesFromSearch(species)}
                                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                                                                    >
                                                                        <div className="font-medium text-gray-900 italic">
                                                                            {species.scientificName}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">
                                                                            {species.commonName}
                                                                        </div>
                                                                        {species.description && (
                                                                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                                {species.description.substring(0, 100)}...
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* No results found - show after search is complete and no results */}
                                                {speciesNotFound && speciesSearchTerm.length >= 3 && !isSearchingSpecies && (
                                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-yellow-800 mb-2">No Species Found</h4>
                                                                <p className="text-yellow-700 text-sm mb-3">
                                                                    No species found matching "{speciesSearchTerm}". Would you like to request adding this species to our database?
                                                                </p>
                                                                <button
                                                                    onClick={handleRequestNewSpecies}
                                                                    className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                                                                >
                                                                    <Plus size={16} />
                                                                    Request New Species
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Search instructions */}
                                                {speciesSearchTerm.length > 0 && speciesSearchTerm.length < 3 && (
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        Type at least 3 characters to start searching...
                                                    </div>
                                                )}

                                                {/* Selected species confirmation */}
                                                {selectedFromSearch && (
                                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                        <div className="flex items-center gap-2 text-green-700">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="text-sm font-medium">Species selected and details populated</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Scientific Name
                                                <span className="text-red-500"> *</span>
                                            </label>
                                            <input
                                                type="text"
                                                disabled
                                                value={editForm.scientificName || ''}
                                                onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none italic"
                                                placeholder="e.g. Quercus robur"
                                                readOnly={isAddingNew}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Common Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.commonName || ''}
                                                onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. English Oak"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Image
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {editForm.image ? (
                                                    <img
                                                        src={editForm.image}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Leaf size={32} className="text-green-500" />
                                                )}
                                            </div>
                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                                <Upload size={16} />
                                                Choose Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                            placeholder="Describe the species characteristics, origin, and notable features..."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Habitat
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.habitat || ''}
                                                onChange={(e) => setEditForm({ ...editForm, habitat: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. Mixed forests"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Height
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.height || ''}
                                                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. 20-40 meters"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Flowers/Fruits
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.hasFlowersOrFruits || ''}
                                                onChange={(e) => setEditForm({ ...editForm, hasFlowersOrFruits: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. Produces acorns and small flowers"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Blooming Season
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.bloomingSeason || ''}
                                                onChange={(e) => setEditForm({ ...editForm, bloomingSeason: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. April-May"
                                            />
                                        </div>
                                    </div>

                                    {/* <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Conservation Status
                                        </label>
                                        <select
                                            value={editForm.conservationStatus || ''}
                                            onChange={(e) => setEditForm({ ...editForm, conservationStatus: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        >
                                            <option value="">Select conservation status</option>
                                            <option value="Least Concern">Least Concern</option>
                                            <option value="Near Threatened">Near Threatened</option>
                                            <option value="Vulnerable">Vulnerable</option>
                                            <option value="Endangered">Endangered</option>
                                            <option value="Critically Endangered">Critically Endangered</option>
                                            <option value="Extinct in the Wild">Extinct in the Wild</option>
                                            <option value="Extinct">Extinct</option>
                                        </select>
                                    </div> */}

                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.favourite || false}
                                                onChange={(e) => setEditForm({ ...editForm, favourite: e.target.checked })}
                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-700">
                                                Mark as favourite
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.isNativeSpecies || false}
                                                onChange={(e) => setEditForm({ ...editForm, isNativeSpecies: e.target.checked })}
                                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                                                <MapPin size={14} />
                                                Is native species
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.disabled || false}
                                                onChange={(e) => setEditForm({ ...editForm, disabled: e.target.checked })}
                                                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                                                <EyeOff size={14} />
                                                Disable species
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-80 h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {selectedSpecies.image ? (
                                                <img
                                                    src={selectedSpecies.image}
                                                    alt={selectedSpecies.scientificName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Leaf size={64} className="text-green-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 italic">
                                                    {selectedSpecies.scientificName}
                                                </h3>
                                                <p className="text-xl text-gray-600 mt-1">
                                                    {selectedSpecies.commonName}
                                                </p>

                                                <div className="flex items-center gap-2 mt-3">
                                                    {selectedSpecies.isNativeSpecies && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                            <MapPin size={14} />
                                                            Native Species
                                                        </span>
                                                    )}
                                                    {selectedSpecies.disabled && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                                                            <EyeOff size={14} />
                                                            Disabled
                                                        </span>
                                                    )}

                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={16} />
                                                Last updated: {formatDate(selectedSpecies.updatedAt)}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Habitat</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.habitat || 'Not specified'}</p>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Height</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.height || 'Not specified'}</p>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                                        <Flower size={16} />
                                                        Flowers/Fruits
                                                    </h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.hasFlowersOrFruits || 'Not specified'}</p>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Blooming Season</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.bloomingSeason || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedSpecies.description && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-3">Description</h4>
                                            <p className="text-gray-600 leading-relaxed">
                                                {selectedSpecies.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Leaf size={64} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">Select a species to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Request New Species Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request New Species</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Scientific Name
                                </label>
                                <input
                                    type="text"
                                    value={requestForm.scientificName}
                                    onChange={(e) => setRequestForm({ ...requestForm, scientificName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none italic"
                                    placeholder="e.g. Acer saccharum"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Common Name
                                </label>
                                <input
                                    type="text"
                                    value={requestForm.commonName}
                                    onChange={(e) => setRequestForm({ ...requestForm, commonName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="e.g. Sugar Maple"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={requestForm.description}
                                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="Brief description of the species..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Request Reason
                                </label>
                                <textarea
                                    value={requestForm.requestReason}
                                    onChange={(e) => setRequestForm({ ...requestForm, requestReason: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="Why do you need this species in the database?"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRequest}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 20 }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Remove User
                        </h3>

                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete <strong>{selectedSpecies.scientificName}</strong> from this project?
                            This action cannot be undone.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isRemoving}
                                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isRemoving}
                                className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors ${isRemoving
                                    ? 'bg-red-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {isRemoving ? 'Removing...' : 'Yes, Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeciesManagementDashboard;