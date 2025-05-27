import React, { useState } from 'react';
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
    Hash
} from 'lucide-react';

const SpeciesManagementDashboard = () => {
    const [speciesList, setSpeciesList] = useState([
        {
            id: 1,
            scientificName: "Quercus robur",
            localName: "English Oak",
            imageUrl: "https://images.unsplash.com/photo-1728587370917-4a74d51c7734?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: true,
            lastUpdated: "2025-04-15T14:30:00",
            description: "A large deciduous tree native to most of Europe and western Asia. Known for its strength and longevity, it can live for over 1000 years.",
            habitat: "Mixed forests, parks, and open woodlands",
            height: "20-40 meters",
            leaves: "Lobed, alternate arrangement"
        },
        {
            id: 2,
            scientificName: "Pinus sylvestris",
            localName: "Scots Pine",
            imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: true,
            lastUpdated: "2025-04-10T09:15:00",
            description: "An evergreen coniferous tree native to Northern Europe. Characterized by its distinctive orange-red bark on the upper trunk.",
            habitat: "Sandy soils, heathlands, and mountainous regions",
            height: "15-35 meters",
            leaves: "Needle-like, blue-green color"
        },
        {
            id: 3,
            scientificName: "Betula pendula",
            localName: "Silver Birch",
            imageUrl: "https://plus.unsplash.com/premium_photo-1663962158789-0ab624c4f17d?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: false,
            lastUpdated: "2025-04-18T11:45:00",
            description: "A medium-sized deciduous tree with distinctive white bark that peels in horizontal strips. Pioneer species in forest succession.",
            habitat: "Light soils, heathlands, and woodland edges",
            height: "15-25 meters",
            leaves: "Small, triangular with serrated edges"
        },
        {
            id: 4,
            scientificName: "Fagus sylvatica",
            localName: "European Beech",
            imageUrl: "https://images.unsplash.com/photo-1631687501186-6a8c81bd30dc?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            favorite: true,
            lastUpdated: "2025-04-05T16:20:00",
            description: "A large deciduous tree with smooth gray bark. Forms dense canopies and is often the dominant species in European deciduous forests.",
            habitat: "Rich, well-drained soils in temperate forests",
            height: "25-50 meters",
            leaves: "Oval with wavy margins, bronze in autumn"
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState(speciesList[0]);
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editForm, setEditForm] = useState({});

    const filteredSpecies = speciesList.filter((species) =>
        species.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        species.localName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const favoriteCount = speciesList.filter((s) => s.favorite).length;

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
    };

    const handleStartEdit = () => {
        setEditForm({ ...selectedSpecies });
        setIsEditing(true);
        setIsAddingNew(false);
    };

    const handleStartAdd = () => {
        const newSpecies = {
            id: Date.now(),
            scientificName: '',
            localName: '',
            imageUrl: '',
            favorite: false,
            lastUpdated: new Date().toISOString(),
            description: '',
            habitat: '',
            height: '',
            leaves: ''
        };
        setEditForm(newSpecies);
        setSelectedSpecies(newSpecies);
        setIsEditing(true);
        setIsAddingNew(true);
    };

    const handleSave = () => {
        if (isAddingNew) {
            setSpeciesList([...speciesList, editForm]);
        } else {
            setSpeciesList(speciesList.map(species => 
                species.id === editForm.id ? { ...editForm, lastUpdated: new Date().toISOString() } : species
            ));
        }
        setSelectedSpecies(editForm);
        setIsEditing(false);
        setIsAddingNew(false);
    };

    const handleCancel = () => {
        if (isAddingNew) {
            setSelectedSpecies(speciesList[0]);
        }
        setIsEditing(false);
        setIsAddingNew(false);
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this species?")) {
            const updatedList = speciesList.filter(s => s.id !== selectedSpecies.id);
            setSpeciesList(updatedList);
            setSelectedSpecies(updatedList[0] || null);
            setIsEditing(false);
            setIsAddingNew(false);
        }
    };

    const handleToggleFavorite = (id) => {
        setSpeciesList(speciesList.map(species =>
            species.id === id ? { ...species, favorite: !species.favorite, lastUpdated: new Date().toISOString() } : species
        ));
        if (selectedSpecies.id === id) {
            setSelectedSpecies({ ...selectedSpecies, favorite: !selectedSpecies.favorite });
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm({ ...editForm, imageUrl: reader.result });
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
                            onClick={handleStartAdd}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
                                        key={species.id}
                                        onClick={() => handleSelectSpecies(species)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                                            selectedSpecies?.id === species.id
                                                ? 'bg-green-50 border-2 border-green-200'
                                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                {species.imageUrl ? (
                                                    <img
                                                        src={species.imageUrl}
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
                                                    {species.localName}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(species.lastUpdated)}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {species.favorite && (
                                                    <Heart size={16} fill="#ef4444" className="text-red-500" />
                                                )}
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
                                        {isAddingNew ? 'New Species' : 'Species Details'}
                                    </h2>
                                    {!isAddingNew && (
                                        <button
                                            onClick={() => handleToggleFavorite(selectedSpecies.id)}
                                            className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                            {selectedSpecies.favorite ? (
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
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Scientific Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.scientificName || ''}
                                                onChange={(e) => setEditForm({...editForm, scientificName: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none italic"
                                                placeholder="e.g. Quercus robur"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Local Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.localName || ''}
                                                onChange={(e) => setEditForm({...editForm, localName: e.target.value})}
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
                                                {editForm.imageUrl ? (
                                                    <img
                                                        src={editForm.imageUrl}
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
                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                            placeholder="Describe the species characteristics, origin, and notable features..."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Habitat
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.habitat || ''}
                                                onChange={(e) => setEditForm({...editForm, habitat: e.target.value})}
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
                                                onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. 20-40 meters"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Leaves
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.leaves || ''}
                                                onChange={(e) => setEditForm({...editForm, leaves: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. Lobed, alternate"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={editForm.favorite || false}
                                            onChange={(e) => setEditForm({...editForm, favorite: e.target.checked})}
                                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Mark as favorite
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-80 h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {selectedSpecies.imageUrl ? (
                                                <img
                                                    src={selectedSpecies.imageUrl}
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
                                                    {selectedSpecies.localName}
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={16} />
                                                Last updated: {formatDate(selectedSpecies.lastUpdated)}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Habitat</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.habitat || 'Not specified'}</p>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Height</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.height || 'Not specified'}</p>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Leaves</h4>
                                                    <p className="text-sm text-gray-600">{selectedSpecies.leaves || 'Not specified'}</p>
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
        </div>
    );
};

export default SpeciesManagementDashboard;