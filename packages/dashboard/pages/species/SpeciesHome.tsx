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
    Loader,
    ChevronRight,
    Filter,
    SortAsc,
    Grid,
    List
} from 'lucide-react';
import { useToken } from '../../context/TokenContext';
import useProjectStore from '../../store/useProjectStore';
import { createNewProjectSpecies, getProjectSpecies, getSciencetificSpecies, removePrjSpecies, requestNewSpecies, updateProjectSpecies } from '../../api/api.fetch';
import { toast } from 'react-toastify';


const SpeciesCard = ({ species, isSelected, onClick, isMobile, formatDate, handleToggleDisabled }) => (
    <div
        onClick={onClick}
        className={`group relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${isSelected
            ? 'ring-2 ring-emerald-500 border-emerald-200 shadow-emerald-100 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-gray-200 hover:border-gray-300'
            } ${species.disabled ? 'opacity-60' : ''}`}
    >
        {/* Favorite indicator */}
        {species.favourite && (
            <div className="absolute top-4 right-4 z-10">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <Heart size={16} fill="white" className="text-white" />
                </div>
            </div>
        )}

        <div className="p-6">
            {/* Image and main info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-inner border border-gray-200">
                    {species.image ? (
                        <img
                            src={species.image}
                            alt={species.scientificName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Leaf size={28} className="text-emerald-500" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 italic text-lg leading-tight mb-2 line-clamp-2">
                        {species.scientificName}
                    </h3>
                    {species.commonName && (
                        <p className="text-gray-600 font-medium mb-3 line-clamp-1">
                            {species.commonName}
                        </p>
                    )}

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        {species.isNativeSpecies && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <MapPin size={10} />
                                Native
                            </span>
                        )}
                        {species.disabled && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                <EyeOff size={10} />
                                Disabled
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description preview */}
            {species.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {species.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>{formatDate(species.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDisabled(species.uid);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${species.disabled
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
                            }`}
                        title={species.disabled ? 'Enable species' : 'Disable species'}
                    >
                        {species.disabled ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    {isMobile && (
                        <ChevronRight size={16} className="text-gray-400" />
                    )}
                </div>
            </div>
        </div>
    </div>
);


const SpeciesManagementDashboard = () => {
    const [speciesList, setSpeciesList] = useState([

    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState(null);
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
    const [loading, setLoading] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'favorite'
    const [requestForm, setRequestForm] = useState({
        scientificName: '',
        commonName: '',
        description: '',
        requestReason: ''
    });

    const { accessToken } = useToken()
    const selectedProject = useProjectStore(state => state.selectedProject)

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
    }, [selectedProject])

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



    // Check if mobile screen
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 1024);
    }, []);

    const filteredSpecies = speciesList.filter((species) => {
        const matchesSearch = species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            species.commonName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVisibility = showDisabled || !species.disabled;
        return matchesSearch && matchesVisibility;
    });

    const sortedSpecies = [...filteredSpecies].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.scientificName.localeCompare(b.scientificName);
            case 'date':
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            case 'favorite':
                return (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0);
            default:
                return 0;
        }
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

        if (isMobile) {
            setShowMobileModal(true);
        }
    };

    const handleStartEdit = () => {
        setEditForm({ ...selectedSpecies });
        setIsEditing(true);
        setIsAddingNew(false);
    };

    const handleStartAdd = () => {
        const newSpecies = {
            uid: Date.now(),
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

        if (isMobile) {
            setShowMobileModal(true);
        }
    };

    const handleSelectSpeciesFromSearch = (species) => {
        setEditForm({
            ...editForm,
            ...species,
            uid: species.id,
            favourite: false,
            updatedAt: new Date().toISOString(),
            isNativeSpecies: false,
            disabled: false
        });
        setSpeciesSearchTerm('');
        setSearchResults([]);
        setShowDropdown(false);
        setSpeciesNotFound(false);
        setSelectedFromSearch(true);
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

    const handleSubmitRequest = async () => {
        setRequestLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowRequestModal(false);
        setRequestForm({
            scientificName: '',
            commonName: '',
            description: '',
            requestReason: ''
        });
        setRequestLoading(false);
        // Show success message (you can replace with toast)
        alert('Request submitted successfully!');
    };

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
            payLoad['description'] = editForm.description;
        }


        if (isAddingNew) {
            setSpeciesList([...speciesList, { ...editForm, uid: Date.now() }]);
            const response = await createNewProjectSpecies(accessToken || '', payLoad, selectedProject?.uid);
        } else {
            setSpeciesList(speciesList.map(species =>
                species.uid === editForm.uid ? { ...editForm, updatedAt: new Date().toISOString() } : species
            ));
            await updateProjectSpecies(accessToken || '', payLoad, selectedProject?.uid, editForm.uid);
        }

        setSelectedSpecies(editForm);
        setIsEditing(false);
        setIsAddingNew(false);
        setSpeciesNotFound(false);
        setLoading(false);
    };

    const handleCancel = () => {
        if (isAddingNew) {
            setSelectedSpecies(speciesList[0]);
        }
        setIsEditing(false);
        setIsAddingNew(false);
        setSpeciesNotFound(false);

        if (isMobile) {
            setShowMobileModal(false);
        }
    };

    const handleDelete = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        setIsRemoving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedList = speciesList.filter(s => s.uid !== selectedSpecies.uid);
        setSpeciesList(updatedList);
        setSelectedSpecies(updatedList[0] || null);
        setIsEditing(false);
        setShowConfirmModal(false);
        setIsAddingNew(false);
        setIsRemoving(false);

        if (isMobile) {
            setShowMobileModal(false);
        }
    };

    const handleToggleFavorite = (uid) => {
        setSpeciesList(speciesList.map(species =>
            species.uid === uid ? { ...species, favourite: !species.favourite, updatedAt: new Date().toISOString() } : species
        ));
        if (selectedSpecies.uid === uid) {
            setSelectedSpecies({ ...selectedSpecies, favourite: !selectedSpecies.favourite });
        }
    };

    const handleToggleDisabled = (uid) => {
        setSpeciesList(speciesList.map(species =>
            species.uid === uid ? { ...species, disabled: !species.disabled, updatedAt: new Date().toISOString() } : species
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

    // Species Card Component

    // Detail Component
    const SpeciesDetail = ({ onClose = null }) => (
        <div className="h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
            {selectedSpecies ? (
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Header with close button for mobile */}
                    {isMobile && onClose && (
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {isAddingNew ? 'Add New Species' : 'Species Details'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl mb-8 p-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {isAddingNew ? 'Add New Species' : 'Species Details'}
                                    </h2>
                                </div>
                                {!isAddingNew && (
                                    <button
                                        onClick={() => handleToggleFavorite(selectedSpecies.uid)}
                                        className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                                    >
                                        {selectedSpecies.favourite ? (
                                            <Heart size={24} fill="#ef4444" className="text-red-500" />
                                        ) : (
                                            <Heart size={24} className="text-gray-400" />
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50"
                                        >
                                            <X size={18} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                                        >
                                            {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleStartEdit}
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        >
                                            <Edit2 size={18} />
                                            Edit
                                        </button>
                                        {!isAddingNew && (
                                            <button
                                                onClick={handleDelete}
                                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
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
                        <div className="space-y-8">
                            {/* Species Search Section */}
                            {isAddingNew && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800">Add from Existing Species</h3>
                                    </div>

                                    <div className="relative">
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

                                        {/* Search Results Dropdown */}
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
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {species.description.substring(0, 100)}...
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* No Results Found */}
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
                                    </div>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                        <Edit2 size={12} className="text-white" />
                                    </div>
                                    Basic Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Scientific Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            disabled={isAddingNew}
                                            value={editForm.scientificName || ''}
                                            onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none italic bg-gray-50 disabled:bg-gray-100"
                                            placeholder="e.g. Quercus robur"
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                                                <Leaf size={40} className="text-emerald-500" />
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
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
                                    Additional Meta Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Habitat
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.habitat || ''}
                                            onChange={(e) => setEditForm({ ...editForm, habitat: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                            placeholder="e.g. April-May"
                                        />
                                    </div>
                                </div>

                                {/* Settings Checkboxes */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-emerald-500" />
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
                        /* View Mode */
                        <div className="space-y-8">
                            {/* Hero Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="flex flex-col lg:flex-row">
                                    <div className="lg:w-80 h-64 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                                        {selectedSpecies.image ? (
                                            <img
                                                src={selectedSpecies.image}
                                                alt={selectedSpecies.scientificName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <Leaf size={80} className="text-emerald-500 mx-auto mb-4" />
                                                <p className="text-gray-500 font-medium">No image available</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    </div>

                                    <div className="flex-1 p-8">
                                        <div className="space-y-6">
                                            <div>
                                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 italic mb-2">
                                                    {selectedSpecies.scientificName}
                                                </h1>
                                                {selectedSpecies.commonName && (
                                                    <h2 className="text-xl lg:text-2xl text-gray-600 font-medium mb-4">
                                                        {selectedSpecies.commonName}
                                                    </h2>
                                                )}

                                                {/* Status Badges */}
                                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                                    {selectedSpecies.isNativeSpecies && (
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200">
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

                                                <div className="flex items-center gap-2 text-sm text-gray-500">
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

                                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                                            <Flower size={12} className="text-white" />
                                                        </div>
                                                        <h4 className="font-semibold text-emerald-900">Flowers/Fruits</h4>
                                                    </div>
                                                    <p className="text-sm text-emerald-800">{selectedSpecies.hasFlowersOrFruits || 'Not specified'}</p>
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
                                    <h3 className="text-xl font-bold text-gray-800 mb-6">Description</h3>
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
                <div className="flex items-center justify-center h-full min-h-96">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                            <Leaf size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Species Selected</h3>
                        <p className="text-gray-500">Select a species from the list to view and manage its details</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-50 flex flex-col h-screen w-full">
            {/* Modern Header */}
            <div className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
                <div className="px-4 py-4">
                    {/* Top row - Title and stats */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl lg:text-3xl font-bold text-transparent" style={{ color: "#007A49" }}>
                                Species Management
                            </h1>
                            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                                    <Hash size={16} />
                                    <span className="font-medium">{speciesList.length}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <Eye size={16} />
                                    <span className="font-medium">{activeCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg">
                                    <Heart size={16} />
                                    <span className="font-medium">{favoriteCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleStartAdd}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <PlusCircle size={18} />
                                <span className="hidden sm:inline">Add Species</span>
                            </button>

                            <button
                                onClick={() => downloadJsonAsCsv(speciesList, 'species-data')}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Download size={18} />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom row - Search and controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-80">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search species..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View mode toggle for larger screens */}
                            {!isMobile && (
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600'
                                            }`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600'
                                            }`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Sort dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-sm"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="favorite">Sort by Favorite</option>
                            </select>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowDisabled(!showDisabled)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${showDisabled
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {showDisabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                <span className="hidden sm:inline">{showDisabled ? 'Hide' : 'Show'} Disabled</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Species List */}
                <div className={`${isMobile ? 'w-full' : 'w-1/2 lg:w-2/5'} bg-white border-r border-gray-200 overflow-y-auto`}>
                    <div className="p-4">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                                    <Leaf size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600" />
                                </div>
                            </div>
                        ) : sortedSpecies.length === 0 ? (
                            <div className="text-center py-12">
                                <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 mb-2">No species found</p>
                                <p className="text-gray-400 text-sm">Start adding species to this project</p>
                            </div>
                        ) : (
                            <div className={`${viewMode === 'grid' && !isMobile ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-3'}`}>
                                {sortedSpecies.map((species) => (
                                    <SpeciesCard
                                        key={species.uid}
                                        species={species}
                                        isSelected={selectedSpecies?.uid === species.uid}
                                        onClick={() => handleSelectSpecies(species)} isMobile={isMobile} formatDate={formatDate} handleToggleDisabled={handleToggleDisabled} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Species Details (Desktop) */}
                {!isMobile && (
                    <div className="flex-1">
                        <SpeciesDetail />
                    </div>
                )}
            </div>

            {/* Mobile Modal */}
            {isMobile && showMobileModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full overflow-hidden">
                        <SpeciesDetail onClose={() => setShowMobileModal(false)} />
                    </div>
                </div>
            )}

            {/* Request New Species Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Request New Species</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Scientific Name
                                </label>
                                <input
                                    type="text"
                                    value={requestForm.scientificName}
                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, scientificName: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none italic"
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
                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, commonName: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    placeholder="e.g. Sugar Maple"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={requestForm.description}
                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, description: e.target.value }))}

                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                                    placeholder="Brief description of the species..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Request Reason
                                </label>
                                <textarea
                                    value={requestForm.requestReason}
                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, requestReason: e.target.value }))}

                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                                    placeholder="Why do you need this species in the database?"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                disabled={requestLoading}
                                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRequest}
                                disabled={requestLoading}
                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {requestLoading && <Loader size={16} className="animate-spin" />}
                                {requestLoading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Remove Species
                        </h3>

                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete <strong className="italic">{selectedSpecies?.scientificName}</strong> from this project?
                            This action cannot be undone.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isRemoving}
                                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isRemoving}
                                className={`flex-1 px-4 py-3 text-sm font-medium text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${isRemoving
                                    ? 'bg-red-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {isRemoving && <Loader size={16} className="animate-spin" />}
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