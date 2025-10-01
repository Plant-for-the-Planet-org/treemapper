import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Upload,
    Image,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    MapPin,
    Tag,
    Ruler,
    TreePine
} from 'lucide-react';
import { createNewIntervention, generatePreSignUrl } from '@shared-core/fetchApi/api.fetch';

const InterventionUploadModal = ({ isOpen, onClose, onSuccess, formData, image, accessToken }) => {
    const [currentStep, setCurrentStep] = useState('form'); // 'form', 'uploading', 'success', 'error'
    const [error, setError] = useState('');
    const [hasStartedUpload, setHasStartedUpload] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && !hasStartedUpload) {
            setCurrentStep('form');
            setError('');
            setHasStartedUpload(true);
            // Start upload after a brief delay to allow the modal to render
            const timer = setTimeout(() => {
                handleSubmit();
            }, 100);
            return () => clearTimeout(timer);
        } else if (!isOpen) {
            // Reset when modal closes
            setHasStartedUpload(false);
            setCurrentStep('form');
            setError('');
        }
    }, [isOpen]); // Only depend on isOpen

    const uploadImage = async () => {
        try {
            if (!image) return { fileName: '', success: true }; // No image to upload

            // Get pre-signed URL
            const presignedResponse = await generatePreSignUrl(accessToken, {
                fileName: String(new Date().getMilliseconds()),
                fileType: image.type,
                folder: 'tree'
            });

            if (presignedResponse.statusCode !== 200 && presignedResponse.statusCode !== 201) {
                throw new Error(presignedResponse.message || 'Failed to get upload URL');
            }

            const response = await uploadViaAPI(image, presignedResponse.data.data.uploadUrl);
            if (response.success) {
                return {
                    fileName: presignedResponse.data.data.fileName,
                    success: true
                };
            } else {
                throw new Error('Failed to upload image');
            }

        } catch (error) {
            console.error('Image upload error:', error);
            return {
                fileName: '',
                success: false,
                error: error.message || 'Image upload failed'
            };
        }
    };

    const uploadViaAPI = async (selectedImage, uploadUrl) => {
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedImage);

            const response = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(uploadUrl)}`, {
                method: 'PUT',
                body: formDataUpload,
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

    const submitIntervention = async (imageId: string) => {
        try {
            if (imageId) {
                formData['image'] = imageId
            }
            const response = await createNewIntervention(accessToken, { ...formData }, formData.plantProject)
            if (response.statusCode !== 201 && response.statusCode !== 200) {
                throw new Error(response.message || 'Failed to upload intervention data');
            }
            return { success: true, message: "Data uploaded" }
        } catch (error) {
            return { success: false, message: String(error) || 'Something went wrong' }
        }

    };
    const handleSubmit = async () => {
        try {
            setCurrentStep('uploading');
            setError('');

            let imageString = '';
            if (image) {
                const result = await uploadImage();
                if (!result.success) {
                    throw new Error(result.error || 'Error occurred while uploading image');
                }
                imageString = result.fileName;
            }

            const result = await submitIntervention(imageString);
            if (!result.success) {
                throw new Error(result.message);
            }
            
            setCurrentStep('success');
        } catch (error) {
            console.error('Submit error:', error);
            setError(error.message || 'An unexpected error occurred');
            setCurrentStep('error');
        }
    };

    const handleRetry = () => {
        setError('');
        handleSubmit();
    };

    const handleClose = () => {
        if (currentStep === 'uploading') return; // Prevent closing during upload
        onClose();
    };

    const handleSuccessClose = () => {
        if (onSuccess) onSuccess();
        onClose();
    };

    // Don't render anything if modal is not open
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50"
                    onClick={currentStep !== 'uploading' ? handleClose : undefined}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ borderColor: '#007A49' }}>
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: '#007A49' }}>
                                <TreePine className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {currentStep === 'form' && 'Upload Intervention'}
                                {currentStep === 'uploading' && 'Uploading...'}
                                {currentStep === 'success' && 'Upload Successful'}
                                {currentStep === 'error' && 'Upload Failed'}
                            </h2>
                        </div>
                        {currentStep !== 'uploading' && (
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Uploading Step */}
                        {currentStep === 'uploading' && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading Intervention</h3>
                                <p className="text-gray-600 text-center">
                                    Please wait while we upload your intervention data...
                                </p>
                            </div>
                        )}

                        {/* Success Step */}
                        {currentStep === 'success' && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Successful!</h3>
                                <p className="text-gray-600 text-center mb-6">
                                    Your intervention data has been successfully uploaded.
                                </p>
                            </div>
                        )}

                        {/* Error Step */}
                        {currentStep === 'error' && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Failed</h3>
                                <p className="text-red-600 text-center mb-6">{error}</p>
                            </div>
                        )}

                        {/* Form Step (if you want to show a form before upload) */}
                        {currentStep === 'form' && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
                                <p className="text-gray-600 text-center">
                                    Preparing upload...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        {currentStep === 'success' && (
                            <button
                                onClick={handleSuccessClose}
                                className="px-4 py-2 text-white rounded-lg transition-colors"
                                style={{ backgroundColor: '#007A49' }}
                            >
                                Done
                            </button>
                        )}

                        {currentStep === 'error' && (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRetry}
                                    className="px-4 py-2 text-white rounded-lg transition-colors"
                                    style={{ backgroundColor: '#007A49' }}
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InterventionUploadModal;