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
import Spinner from '../../../../apps/web/components/Spinner';

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
    const [loading, setLoading] = useState(false)
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
        setLoading(true)
        if (!selectedProject?.uid) return;
        const response = await getProjectSpecies(accessToken || '', selectedProject?.uid);
        setLoading(false)
        if (response.statusCode !== 200) {
            toast.error(response.message || 'An error occurred while fetching species data.');
            return;
        }
        if (response.data.length === 0) {
            handleStartAdd()
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
        <div className="bg-gray-50 flex flex-col h-full w-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-sm py-4 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-6" style={{alignItems:'center',justifyContent:'center'}}>
                        <h1 className="text-2xl font-bold text-gray-900" style={{margin:0}}>Species Management</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Hash size={16} />
                                Total: {speciesList.length}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye size={16} className="text-green-800" />
                                Active: {activeCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart size={16} className="text-red-500" fill="#ef4444" />
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

            <div className="flex" style={{width:'100%',height:'100%'}}>
                {/* Left Panel - Species List */}
                <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        {filteredSpecies.length === 0 ? (
                            <div className="text-center py-12">
                                {loading ? <div className='w-full h-full' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Spinner />
                                </div> :
                                    <>
                                        <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500">No species found</p>
                                        <p className="text-gray-400">Start adding species to this project. </p>
                                    </>}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredSpecies.map((species) => (
                                    <div
                                        key={species.uid}
                                        onClick={() => handleSelectSpecies(species)}
                                        className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${selectedSpecies?.uid === species.uid
                                            ? 'ring-2 ring-green-500 border-green-200 shadow-green-100'
                                            : 'border-gray-200 hover:border-gray-300'
                                            } ${species.disabled ? 'opacity-60' : ''}`}
                                    >
                                        {/* Favorite indicator - top right */}
                                        {species.favourite && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <Heart size={16} fill="#ef4444" className="text-red-500 drop-shadow-sm" />
                                            </div>
                                        )}

                                        <div className="p-5">
                                            {/* Header with image and main info */}
                                            <div className="flex items-start gap-4 mb-4">
                                                {/* Species Image */}
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-inner">
                                                    {species.image ? (
                                                        <img
                                                            src={species.image}
                                                            alt={species.scientificName || 'Species image'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Leaf size={24} className="text-green-500" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Species Names */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 italic text-lg leading-tight mb-1">
                                                        {species.scientificName || 'Unknown Species'}
                                                    </h3>
                                                    {species.commonName && (
                                                        <p className="text-gray-600 font-medium mb-2 leading-tight">
                                                            {species.commonName}
                                                        </p>
                                                    )}

                                                    {/* Status badges */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {species.isNativeSpecies && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <MapPin size={12} />
                                                                Native
                                                            </span>
                                                        )}
                                                        {species.disabled && (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                <EyeOff size={12} />
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer with date and actions */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                {/* Last updated */}
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                    <span>Updated {formatDate(species.updatedAt)}</span>
                                                </div>

                                                {/* Toggle visibility button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleDisabled(species.uid);
                                                    }}
                                                    className={`p-2 rounded-lg transition-all duration-200 ${species.disabled
                                                        ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                                        : 'bg-green-50 hover:bg-green-100 text-green-600'
                                                        } group-hover:scale-105`}
                                                    title={species.disabled ? 'Enable species' : 'Disable species'}
                                                >
                                                    {species.disabled ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Selected indicator */}
                                        {selectedSpecies?.uid === species.uid && (
                                            <div className="absolute inset-0 rounded-xl bg-green-500/5 pointer-events-none"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Species Details */}
                <div className="flex-1 h-full w-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto" style={{paddingBottom:'500px'}}>
                    {selectedSpecies ? (
                        <div className="w-full p-6">
                            {/* Modern Action Bar with Glass Effect */}
                            <div className="sticky top-1 z-20 backdrop-blur-md bg-white/80 border border-white/20 rounded-2xl  mb-8 p-6 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {isAddingNew ? 'Add New Species' : 'Species Details'}
                                            </h2>
                                        </div>
                                        {!isAddingNew && (
                                            <button
                                                onClick={() => handleToggleFavorite(selectedSpecies.uid)}
                                                className="ml-4 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                                            >
                                                {selectedSpecies.favourite ? (
                                                    <Heart size={24} fill="#ef4444" className="text-red-500" />
                                                ) : (
                                                    <Heart size={24} className="text-gray-400" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleCancel}
                                                    className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                                                >
                                                    <X size={18} />
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                                >
                                                    <Save size={18} />
                                                    Save Changes
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                                >
                                                    <Edit2 size={18} />
                                                    Edit
                                                </button>
                                                {!isAddingNew && (
                                                    <button
                                                        onClick={handleDelete}
                                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                                    >
                                                        <Trash2 size={18} />
                                                        Delete
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            {isEditing ? (
                                /* Modern Edit Form */
                                <div className="space-y-8">
                                    {/* Species Search Section (only when adding new) */}
                                    {isAddingNew && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                                    <Plus size={16} className="text-white" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-800">Add from Existing Species</h3>
                                            </div>

                                            <div className="relative">
                                                <div className="flex gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={speciesSearchTerm}
                                                            onChange={(e) => handleSearchInputChange(e.target.value)}
                                                            placeholder="Start typing species name (min 3 characters)..."
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
                                                        />
                                                        {isSearchingSpecies && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                <Loader size={20} className="animate-spin text-blue-500" />
                                                            </div>
                                                        )}

                                                        {/* Modern Search Results Dropdown */}
                                                        {showDropdown && searchResults.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-80 overflow-y-auto">
                                                                {searchResults.map((species, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => handleSelectSpeciesFromSearch(species)}
                                                                        className="w-full text-left px-4 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none transition-colors"
                                                                    >
                                                                        <div className="font-semibold text-gray-900 italic text-lg">
                                                                            {species.scientificName}
                                                                        </div>
                                                                        <div className="text-gray-600 font-medium">
                                                                            {species.commonName}
                                                                        </div>
                                                                        {species.description && (
                                                                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                                {species.description.substring(0, 100)}...
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Enhanced No Results Found */}
                                                {speciesNotFound && speciesSearchTerm.length >= 3 && !isSearchingSpecies && (
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                                                                <AlertCircle size={16} className="text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-yellow-800 mb-2">No Species Found</h4>
                                                                <p className="text-yellow-700 text-sm mb-3">
                                                                    No species found matching "{speciesSearchTerm}". Would you like to request adding this species to our database?
                                                                </p>
                                                                <button
                                                                    onClick={handleRequestNewSpecies}
                                                                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 text-sm font-medium shadow-md"
                                                                >
                                                                    <Plus size={16} />
                                                                    Request New Species
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Search Status Messages */}
                                                {speciesSearchTerm.length > 0 && speciesSearchTerm.length < 3 && (
                                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                                        Type at least 3 characters to start searching...
                                                    </div>
                                                )}

                                                {/* Success Confirmation */}
                                                {selectedFromSearch && (
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                                                        <div className="flex items-center gap-3 text-green-700">
                                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            </div>
                                                            <span className="font-medium">Species selected and details populated</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Fields in Modern Cards */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                                                <Edit2 size={12} className="text-white" />
                                            </div>
                                            Basic Information
                                        </h3>

                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Scientific Name
                                                    <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={editForm.scientificName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none italic bg-gray-50"
                                                    placeholder="e.g. Quercus robur"
                                                    readOnly={isAddingNew}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Common Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.commonName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder="e.g. English Oak"
                                                />
                                            </div>
                                        </div>

                                        {/* Image Upload Section */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                Species Image
                                            </label>
                                            <div className="flex items-start gap-6">
                                                <div className="w-40 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                                                    {editForm.image ? (
                                                        <img
                                                            src={editForm.image}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Leaf size={40} className="text-green-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <label className="cursor-pointer group">
                                                        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-6 py-4 rounded-xl transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-gray-400">
                                                            <Upload size={20} className="text-gray-600 group-hover:text-gray-700" />
                                                            <div>
                                                                <div className="font-medium text-gray-700">Choose Image</div>
                                                                <div className="text-sm text-gray-500">PNG, JPG up to 10MB</div>
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={editForm.description || ''}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                                placeholder="Describe the species characteristics, origin, and notable features..."
                                            />
                                        </div>
                                    </div>

                                    {/* Additional Details Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                                                <Flower size={12} className="text-white" />
                                            </div>
                                            Additional Details
                                        </h3>

                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Habitat
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.habitat || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, habitat: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder="e.g. Mixed forests"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Height
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.height || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder="e.g. 20-40 meters"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Flowers/Fruits
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.hasFlowersOrFruits || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, hasFlowersOrFruits: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder="e.g. Produces acorns and small flowers"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Blooming Season
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.bloomingSeason || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, bloomingSeason: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder="e.g. April-May"
                                                />
                                            </div>
                                        </div>

                                        {/* Settings Checkboxes */}
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.favourite || false}
                                                    onChange={(e) => setEditForm({ ...editForm, favourite: e.target.checked })}
                                                    className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Heart size={16} className="text-red-500" />
                                                    <span className="font-medium text-gray-700">Mark as favourite</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.isNativeSpecies || false}
                                                    onChange={(e) => setEditForm({ ...editForm, isNativeSpecies: e.target.checked })}
                                                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-green-500" />
                                                    <span className="font-medium text-gray-700">Is native species</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.disabled || false}
                                                    onChange={(e) => setEditForm({ ...editForm, disabled: e.target.checked })}
                                                    className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <EyeOff size={16} className="text-red-500" />
                                                    <span className="font-medium text-gray-700">Disable species</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Modern View Mode */
                                <div className="space-y-8">
                                    {/* Hero Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Image Section */}
                                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative" style={{ width: '30%' }}>
                                                {selectedSpecies.image ? (
                                                    <img
                                                        src={selectedSpecies.image}
                                                        alt={selectedSpecies.scientificName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <Leaf size={80} className="text-green-500 mx-auto mb-4" />
                                                        <p className="text-gray-500 font-medium">No image available</p>
                                                    </div>
                                                )}

                                                {/* Overlay gradient for better text readability */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="flex-1 p-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h1 className="text-4xl font-bold text-gray-900 italic mb-2">
                                                            {selectedSpecies.scientificName}
                                                        </h1>
                                                        {selectedSpecies.commonName && (
                                                            <h2 className="text-2xl text-gray-600 font-medium mb-4">
                                                                {selectedSpecies.commonName}
                                                            </h2>
                                                        )}

                                                        {/* Status Badges */}
                                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                                            {selectedSpecies.isNativeSpecies && (
                                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                                                                    <MapPin size={16} />
                                                                    Native Species
                                                                </span>
                                                            )}
                                                            {selectedSpecies.disabled && (
                                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200">
                                                                    <EyeOff size={16} />
                                                                    Disabled
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Last Updated */}
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                                            <Calendar size={16} />
                                                            <span>Last updated: {formatDate(selectedSpecies.updatedAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Stats Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                                                                    <MapPin size={12} className="text-white" />
                                                                </div>
                                                                <h4 className="font-semibold text-blue-900">Habitat</h4>
                                                            </div>
                                                            <p className="text-sm text-blue-800">{selectedSpecies.habitat || 'Not specified'}</p>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
                                                                    <div className="w-2 h-4 bg-white rounded-sm"></div>
                                                                </div>
                                                                <h4 className="font-semibold text-purple-900">Height</h4>
                                                            </div>
                                                            <p className="text-sm text-purple-800">{selectedSpecies.height || 'Not specified'}</p>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
                                                                    <Flower size={12} className="text-white" />
                                                                </div>
                                                                <h4 className="font-semibold text-green-900">Flowers/Fruits</h4>
                                                            </div>
                                                            <p className="text-sm text-green-800">{selectedSpecies.hasFlowersOrFruits || 'Not specified'}</p>
                                                        </div>

                                                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
                                                                    <Calendar size={12} className="text-white" />
                                                                </div>
                                                                <h4 className="font-semibold text-orange-900">Blooming Season</h4>
                                                            </div>
                                                            <p className="text-sm text-orange-800">{selectedSpecies.bloomingSeason || 'Not specified'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Section */}
                                    {selectedSpecies.description && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                {/* <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                    <div className="w-4 h-3 border-2 border-white rounded-sm"></div>
                                                </div> */}
                                                <h3 className="text-xl font-bold text-gray-800">Description</h3>
                                            </div>
                                            <div className="prose prose-gray max-w-none">
                                                <p className="text-gray-600 leading-relaxed text-lg">
                                                    {selectedSpecies.description}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex items-center justify-center h-full" style={{marginTop:'20vh'}}>
                            <div className="text-center">
                                {loading ? (
                                    <div className="w-full h-full flex justify-center items-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"></div>
                                            <Leaf size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                                            <Leaf size={40} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Species Selected</h3>
                                        <p className="text-gray-500">Select a species from the list to view and manage its details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
             {/* Request New Species Modal */}
            {showRequestModal && (
                <div className="h-full w-full inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
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