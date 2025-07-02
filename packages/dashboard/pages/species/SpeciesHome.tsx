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
import SpeciesCard from './components/web/SpeciesCard';
import SpeciesDetail from './components/web/SpeciesDetail';


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
    const [requestErrorMessage, setRequestErrorMessage] = useState('')
    const [loading, setLoading] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'favorite'
    const [isMobile, setIsMobile] = useState(false);
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
        console.log('Selected species:', species);
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
        setRequestErrorMessage('')
        setRequestLoading(true);
        const payload = {
            scientificName: requestForm.scientificName,
            commonName: requestForm.commonName,
            description: requestForm.description,
            requestReason: requestForm.requestReason,
        };
        if (!requestForm.scientificName) {
            setRequestErrorMessage("Please provide scientific name");
            setRequestLoading(false);
            return
        }
        const response = await requestNewSpecies(accessToken || '', payload, selectedProject?.uid);
        if (response.statusCode === 200 || response.statusCode === 201) {
            toast.success('Request submitted successfully!');
            setShowRequestModal(false);
            setRequestForm({
                scientificName: '',
                commonName: '',
                description: '',
                requestReason: ''
            });
            setRequestLoading(false);
            return;
        } else {
            setRequestLoading(false);
            if (response.message) {
                setRequestErrorMessage(response.message);
            }
            toast.error(response.message || 'An error occurred while submitting the request.');
        };
    }

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Saving species:', editForm);
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
            payLoad['scientificSpeciesId'] = editForm.uid;
            console.log('payLoad', payLoad);
            setSpeciesList([...speciesList, { ...editForm, uid: Date.now() }]);
            await createNewProjectSpecies(accessToken || '', payLoad, selectedProject?.uid);
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
        const updatedList = speciesList.filter(s => s.uid !== selectedSpecies.uid);
        setSpeciesList(updatedList);
        setSelectedSpecies(updatedList[0] || null);
        setIsEditing(false);
        setShowConfirmModal(false);
        setIsAddingNew(false);
        setIsRemoving(false);
        await removePrjSpecies(accessToken || '', selectedProject?.uid, selectedSpecies.uid);
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
                        <SpeciesDetail selectedSpecies={selectedSpecies} isMobile={isMobile} isAddingNew={isAddingNew} handleToggleFavorite={handleToggleFavorite} isEditing={isEditing} loading={loading} handleCancel={handleCancel} handleSave={handleSave} handleStartEdit={handleStartEdit} handleDelete={handleDelete} speciesSearchTerm={speciesSearchTerm} isSearchingSpecies={isSearchingSpecies} handleSearchInputChange={handleSearchInputChange} showDropdown={showDropdown} searchResults={searchResults} handleSelectSpeciesFromSearch={handleSelectSpeciesFromSearch} speciesNotFound={speciesNotFound} handleRequestNewSpecies={handleRequestNewSpecies} editForm={editForm} setEditForm={setEditForm} handleImageUpload={handleImageUpload} formatDate={formatDate} />
                    </div>
                )}
            </div>

            {/* Mobile Modal */}
            {isMobile && showMobileModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white w-full h-full overflow-hidden">
                        <SpeciesDetail onClose={() => setShowMobileModal(false)} selectedSpecies={selectedSpecies} isMobile={isMobile} isAddingNew={isAddingNew} handleToggleFavorite={handleToggleFavorite} isEditing={isEditing} loading={loading} handleCancel={handleCancel} handleSave={handleSave} handleStartEdit={handleStartEdit} handleDelete={handleDelete} speciesSearchTerm={speciesSearchTerm} isSearchingSpecies={isSearchingSpecies} handleSearchInputChange={handleSearchInputChange} showDropdown={showDropdown} searchResults={searchResults} handleSelectSpeciesFromSearch={handleSelectSpeciesFromSearch} speciesNotFound={speciesNotFound} handleRequestNewSpecies={handleRequestNewSpecies} editForm={editForm} setEditForm={setEditForm} handleImageUpload={handleImageUpload} formatDate={formatDate} />
                    </div>
                </div>
            )}

            {/* Request New Species Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Request New Species</h3>
                        {requestErrorMessage && <p style={{ color: 'red', fontSize: 12 }}>{requestErrorMessage}</p>}
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
                <div className="fixed inset-0 z-60 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
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