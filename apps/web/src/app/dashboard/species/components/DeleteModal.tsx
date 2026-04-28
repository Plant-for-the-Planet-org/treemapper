import { AlertCircle, Trash2 } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";

export const DeleteModal = ({ 
    showConfirmModal, 
    setShowConfirmModal, 
    selectedSpecies, 
    isRemoving, 
    handleDelete
}) => {
    return (<Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Delete Species"
        size="small"
    >
        <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Remove Species
                </h3>
                <p className="text-sm text-gray-600">
                    Are you sure you want to delete <strong className="italic">{selectedSpecies?.scientificName || selectedSpecies?.speciesName}</strong> from this project?
                    This action cannot be undone.
                </p>
            </div>
            <div className="flex justify-center gap-3 pt-4">
                <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isRemoving}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isRemoving}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isRemoving ? <LoadingSpinner size="small" /> : <Trash2 size={14} />}
                    {isRemoving ? 'Removing...' : 'Yes, Remove'}
                </button>
            </div>
        </div>
    </Modal>)
}