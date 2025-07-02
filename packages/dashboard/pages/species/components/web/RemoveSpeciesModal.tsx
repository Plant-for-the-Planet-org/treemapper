import React from 'react'
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

export default function RemoveSpeciesModal({setShowConfirmModal, selectedSpecies, isRemoving, setIsRemoving,handleConfirmDelete}) {
    return (
        <div className="fixed inset-0 z-1000 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{zIndex: 1000}}>
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
    )
}
