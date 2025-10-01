import { Check } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Modal } from "./Modal";
import { useState } from "react";

export const SpeciesRequestModal = ({
    showRequestModal,
    setShowRequestModal,
    requestForm,
    setRequestForm,
    requestLoading,
    handleSubmitRequest
}) => {
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!requestForm.scientificName?.trim()) {
            newErrors.scientificName = "Scientific name is required";
        }

        if (!requestForm.commonName?.trim()) {
            newErrors.commonName = "Common name is required";
        }

        if (!requestForm.description?.trim()) {
            newErrors.description = "Description is required";
        }

        if (!requestForm.requestReason?.trim()) {
            newErrors.requestReason = "Request reason is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            handleSubmitRequest();
        }
    };

    const handleInputChange = (field, value) => {
        setRequestForm(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const getInputClassName = (fieldName) => {
        const baseClasses = "w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none";
        const errorClasses = errors[fieldName] ? "border-red-300 bg-red-50" : "border-gray-200";
        return `${baseClasses} ${errorClasses}`;
    };

    return (
        <Modal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            title="Request New Species"
            size="default"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scientific Name *
                    </label>
                    <input
                        type="text"
                        value={requestForm.scientificName || ""}
                        onChange={(e) => handleInputChange('scientificName', e.target.value)}
                        className={`${getInputClassName('scientificName')} italic`}
                        placeholder="e.g. Acer saccharum"
                    />
                    {errors.scientificName && (
                        <p className="text-xs text-red-600 mt-1">{errors.scientificName}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Common Name *
                    </label>
                    <input
                        type="text"
                        value={requestForm.commonName || ""}
                        onChange={(e) => handleInputChange('commonName', e.target.value)}
                        className={getInputClassName('commonName')}
                        placeholder="e.g. Sugar Maple"
                    />
                    {errors.commonName && (
                        <p className="text-xs text-red-600 mt-1">{errors.commonName}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                    </label>
                    <textarea
                        value={requestForm.description || ""}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className={`${getInputClassName('description')} resize-none`}
                        placeholder="Brief description of the species..."
                    />
                    {errors.description && (
                        <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Request Reason *
                    </label>
                    <textarea
                        value={requestForm.requestReason || ""}
                        onChange={(e) => handleInputChange('requestReason', e.target.value)}
                        rows={3}
                        className={`${getInputClassName('requestReason')} resize-none`}
                        placeholder="Why do you need this species in the database?"
                    />
                    {errors.requestReason && (
                        <p className="text-xs text-red-600 mt-1">{errors.requestReason}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => setShowRequestModal(false)}
                        disabled={requestLoading}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={requestLoading}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {requestLoading ? <LoadingSpinner size="small" /> : <Check size={14} />}
                        {requestLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};