'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit3,
  Save,
  X,
  Trash2,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataValidation = ({ fileData, onBack, onNext }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [data, setData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterType, setFilterType] = useState('all'); // 'all', 'errors'
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedCardErrors, setSelectedCardErrors] = useState([]);
  // Validation functions

  console.log("sd", fileData)

  const validateDate = (dateStr, fieldName, isRequired = false) => {
    const errors = [];

    if (!dateStr || dateStr.trim() === '') {
      if (isRequired) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !isRequired, errors };
    }

    // Check MM/DD/YYYY format
    const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!datePattern.test(dateStr)) {
      errors.push(`${fieldName} must be in MM/DD/YYYY format`);
      return { isValid: false, errors };
    }

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} is not a valid date`);
      return { isValid: false, errors };
    }

    // Check if plantation start date is not in future
    if (fieldName.toLowerCase().includes('start') && date > today) {
      errors.push(`${fieldName} cannot be in the future`);
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validatePositiveNumber = (value, fieldName, isRequired = false) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      if (isRequired) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !isRequired, errors };
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      errors.push(`${fieldName} must be a valid number`);
      return { isValid: false, errors };
    }

    if (num <= 0) {
      errors.push(`${fieldName} must be a positive number`);
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validateSpecies = (speciesStr, isRequired = true) => {
    const errors = [];

    if (!speciesStr || speciesStr.trim() === '') {
      if (isRequired) {
        errors.push('Species is required');
      }
      return { isValid: !isRequired, errors, species: [] };
    }

    // Convert to array and clean up
    const speciesArray = speciesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => String(s)); // Convert to string to prevent attacks

    if (speciesArray.length === 0 && isRequired) {
      errors.push('At least one species is required');
      return { isValid: false, errors, species: [] };
    }

    return { isValid: true, errors, species: speciesArray };
  };

  const validateRow = (row, index) => {
    const errors = [];
    let hasErrors = false;

    // Required field validations
    const typeVal = String(row['TYPE'] || '').trim();
    if (!typeVal) {
      errors.push('TYPE is required');
      hasErrors = true;
    }

    // Plantation start date validation
    const startDateResult = validateDate(row['PLANTATION START DATE'], 'Plantation Start Date', true);
    if (!startDateResult.isValid) {
      errors.push(...startDateResult.errors);
      hasErrors = true;
    }

    // Plantation end date validation
    let endDate = row['PLANTATION END DATE'];
    if (!endDate || String(endDate).trim() === '') {
      endDate = row['PLANTATION START DATE']; // Default to start date
    }

    const endDateResult = validateDate(endDate, 'Plantation End Date', false);
    if (!endDateResult.isValid) {
      errors.push(...endDateResult.errors);
      hasErrors = true;
    }

    // Check end date is not before start date
    if (startDateResult.isValid && endDateResult.isValid && endDate) {
      const startDate = new Date(row['PLANTATION START DATE']);
      const endDateObj = new Date(endDate);
      if (endDateObj < startDate) {
        errors.push('Plantation End Date cannot be before Start Date');
        hasErrors = true;
      }
    }

    // Latitude validation (required)
    const latVal = row['LATITUDE'];
    if (!latVal || String(latVal).trim() === '') {
      errors.push('LATITUDE is required');
      hasErrors = true;
    }

    // Longitude validation (required)
    const lngVal = row['LONGITIUDE'];
    if (!lngVal || String(lngVal).trim() === '') {
      errors.push('LONGITUDE is required');
      hasErrors = true;
    }

    // Species validation
    const speciesResult = validateSpecies(row['SPECIES'], true);
    if (!speciesResult.isValid) {
      errors.push(...speciesResult.errors);
      hasErrors = true;
    }

    // Optional positive number validations
    const heightResult = validatePositiveNumber(row['AVERAGE PLANT HEIGHT'], 'Average Plant Height', false);
    if (!heightResult.isValid) {
      errors.push(...heightResult.errors);
      hasErrors = true;
    }

    const diameterResult = validatePositiveNumber(row['AVERGAE PLANT DIAMETER'], 'Average Plant Diameter', false);
    if (!diameterResult.isValid) {
      errors.push(...diameterResult.errors);
      hasErrors = true;
    }

    const elevationResult = validatePositiveNumber(row['ELEVATION'], 'Elevation', false);
    if (!elevationResult.isValid) {
      errors.push(...elevationResult.errors);
      hasErrors = true;
    }

    const peopleResult = validatePositiveNumber(row['NUMBER OF PEOPLE INVOLVED'], 'Number of People Involved', false);
    if (!peopleResult.isValid) {
      errors.push(...peopleResult.errors);
      hasErrors = true;
    }

    return {
      index,
      hasErrors,
      errors,
      processedData: {
        ...row,
        'PLANTATION END DATE': endDate,
        'SPECIES': speciesResult.species
      }
    };
  };

  const processCSVData = async () => {
    try {
      setIsValidating(true);

      if (fileData.length === 0) {
        throw new Error('No file selected');
      }




      // Validate each row
      const results = fileData.map((row, index) => validateRow(row, index));

      setData(fileData);
      setValidationResults(results);

      // Simulate processing time
      setTimeout(() => {
        setIsValidating(false);
      }, 2000);

    } catch (error) {
      console.error('Error processing CSV:', error);
      setIsValidating(false);
    }
  };

  useEffect(() => {
    processCSVData();
  }, [fileData]);

  const handleEdit = (index) => {
    setEditingCard(index);
    setEditData({ ...data[index] });
  };

  const handleSaveEdit = () => {
    // Re-validate the edited data
    const validationResult = validateRow(editData, editingCard);

    // Update data and validation results
    const newData = [...data];
    const newValidationResults = [...validationResults];

    newData[editingCard] = editData;
    newValidationResults[editingCard] = validationResult;

    setData(newData);
    setValidationResults(newValidationResults);
    setEditingCard(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditData({});
  };

  const handleDelete = (index) => {
    const newData = data.filter((_, i) => i !== index);
    const newValidationResults = validationResults
      .filter((_, i) => i !== index)
      .map((result, newIndex) => ({ ...result, index: newIndex }));

    setData(newData);
    setValidationResults(newValidationResults);
  };

  const showErrors = (errors) => {
    setSelectedCardErrors(errors);
    setShowErrorModal(true);
  };

  const filteredResults = validationResults.filter(result => {
    if (filterType === 'errors') {
      return result.hasErrors;
    }
    return true;
  });

  const totalErrors = validationResults.filter(r => r.hasErrors).length;
  const canProceed = totalErrors === 0 && data.length > 0;

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[#007A49] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Your Data</h2>
          <p className="text-gray-600">Please wait while we process and validate your CSV file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-[#007A49] transition-colors mr-4 mb-3"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Data Validation</h1>
          <button
            onClick={() => onNext(validationResults.map(r => r.processedData))}
            disabled={!canProceed}
            style={{ position: 'absolute', right: 0, top: 25 }}
            className={`flex items-center px-6 py-3 rounded-md transition-colors ${canProceed
              ? 'bg-[#007A49] text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {canProceed ? (
              <>
                Continue to Upload
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Fix {totalErrors} errors to continue
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="space-y-2 text-sm text-blue-800">
            <p>• The data shown is from the imported CSV. Please review and correct any necessary information.</p>
            <p>• Species listed in the CSV will be marked as <strong>"Unknown"</strong> by default. We request you to select and assign the correct species for the entire dataset using the TreeMapper dashboard.</p>
            <p>• You can search for species and add them. If a species is not found, you may leave it as <strong>"Unknown"</strong>.</p>
          </div>
        </div>

        {/* Summary and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg border">
              <span className="text-sm text-gray-600">Total Records: </span>
              <span className="font-semibold text-gray-900">{data.length}</span>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${totalErrors > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <span className="text-sm text-gray-600">Errors: </span>
              <span className={`font-semibold ${totalErrors > 0 ? 'text-red-800' : 'text-green-800'}`}>
                {totalErrors}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'all'
                  ? 'bg-[#007A49] text-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                All
              </button>
              <button
                onClick={() => setFilterType('errors')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'errors'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Errors ({totalErrors})
              </button>
            </div>
          </div>
        </div>

        {/* Data Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            {filteredResults.map((result) => (
              <motion.div
                key={result.index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-lg shadow-sm border-2 ${result.hasErrors ? 'border-red-300' : 'border-green-300'
                  }`}
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Record #{result.index + 1}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {result.hasErrors && (
                        <button
                          onClick={() => showErrors(result.errors)}
                          className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                        >
                          {result.errors.length} errors
                        </button>
                      )}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(result.index)}
                          className="p-2 text-gray-500 hover:text-[#007A49] transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(result.index)}
                          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  {editingCard === result.index ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">TYPE *</label>
                          <input
                            type="text"
                            value={editData['TYPE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'TYPE': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SPECIES *</label>
                          <input
                            type="text"
                            value={Array.isArray(editData['SPECIES']) ? editData['SPECIES'].join(', ') : editData['SPECIES'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'SPECIES': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">START DATE *</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY"
                            value={editData['PLANTATION START DATE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PLANTATION START DATE': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">END DATE</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY"
                            value={editData['PLANTATION END DATE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PLANTATION END DATE': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">LATITUDE *</label>
                          <input
                            type="text"
                            value={editData['LATITUDE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'LATITUDE': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">LONGITUDE *</label>
                          <input
                            type="text"
                            value={editData['LONGITIUDE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'LONGITIUDE': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">HEIGHT</label>
                          <input
                            type="text"
                            value={editData['AVERAGE PLANT HEIGHT'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'AVERAGE PLANT HEIGHT': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">DIAMETER</label>
                          <input
                            type="text"
                            value={editData['AVERGAE PLANT DIAMETER'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'AVERGAE PLANT DIAMETER': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">PERSON NAME</label>
                          <input
                            type="text"
                            value={editData['PERSON NAME'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PERSON NAME': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">LOCATION NAME</label>
                          <input
                            type="text"
                            value={editData['Location Name'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'Location Name': e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#007A49] focus:border-[#007A49]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 text-sm bg-[#007A49] text-white rounded hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <p className="text-gray-900">{data[result.index]['TYPE'] || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Species:</span>
                          <p className="text-gray-900">
                            {Array.isArray(data[result.index]['SPECIES'])
                              ? data[result.index]['SPECIES'].join(', ')
                              : data[result.index]['SPECIES'] || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium text-gray-700">Start Date:</span>
                          <p className="text-gray-900">{data[result.index]['PLANTATION START DATE'] || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">End Date:</span>
                          <p className="text-gray-900">{data[result.index]['PLANTATION END DATE'] || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-900 text-xs">
                            {data[result.index]['LATITUDE'] && data[result.index]['LONGITIUDE']
                              ? `${data[result.index]['LATITUDE']}, ${data[result.index]['LONGITIUDE']}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Person:</span>
                          <p className="text-gray-900">{data[result.index]['PERSON NAME'] || 'N/A'}</p>
                        </div>
                      </div>

                      {(data[result.index]['AVERAGE PLANT HEIGHT'] || data[result.index]['AVERGAE PLANT DIAMETER']) && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="font-medium text-gray-700">Height:</span>
                            <p className="text-gray-900">{data[result.index]['AVERAGE PLANT HEIGHT'] || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Diameter:</span>
                            <p className="text-gray-900">{data[result.index]['AVERGAE PLANT DIAMETER'] || 'N/A'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredResults.length} of {data.length} records shown
          </div>
          <button
            onClick={() => onNext(validationResults.map(r => r.processedData))}
            disabled={!canProceed}
            className={`flex items-center px-6 py-3 rounded-md transition-colors ${canProceed
                ? 'bg-[#007A49] text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007A49]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {canProceed ? (
              <>
                Continue to Upload
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Fix {totalErrors} errors to continue
              </>
            )}
          </button>
        </div>

        {/* Error Modal */}
        <AnimatePresence>
          {showErrorModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowErrorModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-800">Validation Errors</h3>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedCardErrors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataValidation;