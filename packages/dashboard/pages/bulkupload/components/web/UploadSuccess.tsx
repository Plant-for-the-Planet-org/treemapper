'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  ArrowLeft, 
  RefreshCw, 
  FileText, 
  Mail,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const UploadSuccess = ({ validatedData, selectedProject, selectedSite, onBack, onStartOver }) => {
  const [uploadState, setUploadState] = useState('uploading'); // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedRecords, setUploadedRecords] = useState(0);

  // Mock upload function - replace with your actual API call
  const uploadData = async () => {
    try {
      setUploadState('uploading');
      setUploadProgress(0);
      setUploadedRecords(0);

      // Simulate upload progress
      const totalRecords = validatedData.length;
      
      for (let i = 0; i <= totalRecords; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate upload delay
        setUploadProgress((i / totalRecords) * 100);
        setUploadedRecords(i);
      }

      // Simulate API call
      const uploadPayload = {
        projectId: selectedProject.id,
        siteId: selectedSite?.id || null,
        data: validatedData
      };

      // Mock API call - replace with actual endpoint
      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload)
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      const result = await response.json();
      
      setUploadState('success');
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadState('error');
      setErrorMessage(error.message || 'An unexpected error occurred during upload.');
    }
  };

  useEffect(() => {
    // Start upload when component mounts
    uploadData();
  }, []);

  const handleRetry = () => {
    uploadData();
  };

  const renderUploadingState = () => (
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mx-auto mb-6"
      >
        <Upload className="h-16 w-16 text-[#007A49]" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Uploading Your Data</h2>
      <p className="text-gray-600 mb-8">Please wait while we process your plantation data...</p>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <motion.div 
          className="bg-[#007A49] h-3 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${uploadProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-between text-sm text-gray-600 mb-8">
        <span>Progress: {Math.round(uploadProgress)}%</span>
        <span>Records: {uploadedRecords} / {validatedData.length}</span>
      </div>

      {/* Upload Details */}
      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Project:</span>
            <span className="font-medium text-gray-900">{selectedProject.projectName}</span>
          </div>
          {selectedSite && (
            <div className="flex justify-between">
              <span className="text-gray-600">Site:</span>
              <span className="font-medium text-gray-900">{selectedSite.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Total Records:</span>
            <span className="font-medium text-gray-900">{validatedData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
      >
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Successful!</h2>
        <p className="text-lg text-gray-600 mb-8">
          Your plantation data has been successfully uploaded to TreeMapper.
        </p>
      </motion.div>

      {/* Success Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-8"
      >
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Project:</span>
            <span className="font-medium text-green-900">{selectedProject.projectName}</span>
          </div>
          {selectedSite && (
            <div className="flex justify-between">
              <span className="text-green-700">Site:</span>
              <span className="font-medium text-green-900">{selectedSite.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-green-700">Records Uploaded:</span>
            <span className="font-medium text-green-900">{validatedData.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Upload Date:</span>
            <span className="font-medium text-green-900">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto mb-8"
      >
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <p className="text-sm text-blue-800 mb-3">
              Your uploaded data is now available in the TreeMapper dashboard. You can view and manage your interventions from the Intervention section.
            </p>
            <button className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium">
              <ExternalLink className="h-4 w-4 mr-1" />
              Go to Interventions
            </button>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={onStartOver}
          className="px-6 py-3 bg-[#007A49] text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors"
        >
          Upload More Data
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
      >
        <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Failed</h2>
        <p className="text-lg text-gray-600 mb-8">
          We encountered an issue while uploading your data. Please try again or contact support.
        </p>
      </motion.div>

      {/* Error Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mb-8"
      >
        <div className="text-left">
          <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
          <p className="text-sm text-red-800 mb-4">{errorMessage}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-700">Project:</span>
              <span className="font-medium text-red-900">{selectedProject.projectName}</span>
            </div>
            {selectedSite && (
              <div className="flex justify-between">
                <span className="text-red-700">Site:</span>
                <span className="font-medium text-red-900">{selectedSite.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-red-700">Records:</span>
              <span className="font-medium text-red-900">{validatedData.length}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Support Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-lg mx-auto mb-8"
      >
        <div className="flex items-start">
          <Mail className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
          <div className="text-left">
            <h3 className="font-semibold text-yellow-900 mb-2">Need Help?</h3>
            <p className="text-sm text-yellow-800 mb-3">
              If the problem persists, please contact our support team with the error details above.
            </p>
            <a 
              href="mailto:info@plant-for-the-planet.org"
              className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-900 font-medium"
            >
              <Mail className="h-4 w-4 mr-1" />
              info@plant-for-the-planet.org
            </a>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-[#007A49] text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Upload
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49] transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
          {uploadState === 'uploading' && renderUploadingState()}
          {uploadState === 'success' && renderSuccessState()}
          {uploadState === 'error' && renderErrorState()}
        </div>
      </div>
    </div>
  );
};

export default UploadSuccess;