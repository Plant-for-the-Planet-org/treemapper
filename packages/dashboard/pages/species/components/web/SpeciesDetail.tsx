import { AlertCircle, Calendar, Edit2, EyeOff, Flower, Heart, Leaf, Loader, MapPin, Plus, Save, Trash2, Upload, X } from "lucide-react";

const SpeciesDetail = ({ onClose = null, selectedSpecies, isMobile, isAddingNew, handleToggleFavorite, isEditing, loading, handleCancel, handleSave, handleStartEdit, handleDelete, speciesSearchTerm, isSearchingSpecies, handleSearchInputChange, showDropdown, searchResults, handleSelectSpeciesFromSearch, speciesNotFound, handleRequestNewSpecies, editForm, setEditForm, handleImageUpload, formatDate }) => (
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
                                                src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/species/${editForm.image}`}
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
                                            src={`https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/development/species/${selectedSpecies.image}`}
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

export default SpeciesDetail;