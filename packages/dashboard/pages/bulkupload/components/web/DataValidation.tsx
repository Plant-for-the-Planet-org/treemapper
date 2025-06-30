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
  EyeOff,
  MapPin,
  Calendar,
  Users,
  TreePine,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataValidation = ({ fileData, onBack, onNext }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [data, setData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedCardErrors, setSelectedCardErrors] = useState([]);

  console.log("CSV Data:", fileData);

  // Validation functions
  const validateDate = (dateStr, fieldName, isRequired = false) => {
    const errors = [];

    if (!dateStr || dateStr.trim() === '') {
      if (isRequired) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !isRequired, errors };
    }

    const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!datePattern.test(dateStr)) {
      errors.push(`${fieldName} must be in MM/DD/YYYY format`);
      return { isValid: false, errors };
    }

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} is not a valid date`);
      return { isValid: false, errors };
    }

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

  const validateCoordinate = (value, fieldName, isRequired = true) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      if (isRequired) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !isRequired, errors };
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      errors.push(`${fieldName} must be a valid decimal number`);
      return { isValid: false, errors };
    }

    // Basic coordinate range validation
    if (fieldName.toLowerCase().includes('latitude') && (num < -90 || num > 90)) {
      errors.push(`${fieldName} must be between -90 and 90`);
      return { isValid: false, errors };
    }

    if (fieldName.toLowerCase().includes('longitude') && (num < -180 || num > 180)) {
      errors.push(`${fieldName} must be between -180 and 180`);
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validateSpecies = (speciesStr, plantationType, isRequired = true) => {
    const errors = [];

    if (!speciesStr || speciesStr.trim() === '') {
      if (isRequired) {
        errors.push('Species is required');
      }
      return { isValid: !isRequired, errors, species: [] };
    }

    const speciesArray = speciesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => String(s));

    if (speciesArray.length === 0 && isRequired) {
      errors.push('At least one species is required');
      return { isValid: false, errors, species: [] };
    }

    // Validate based on plantation type
    if (plantationType === 'Single' && speciesArray.length > 1) {
      errors.push('Single plantation can only have one species');
      return { isValid: false, errors, species: speciesArray };
    }

    return { isValid: true, errors, species: speciesArray };
  };

  const validatePlantationType = (value, isRequired = true) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      if (isRequired) {
        errors.push('Plantation type is required');
      }
      return { isValid: !isRequired, errors };
    }

    const validValues = ['Single', 'Multi'];
    if (!validValues.includes(value.toString())) {
      errors.push('Plantation type must be either "Single" or "Multi"');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validateTreesPlanted = (value, plantationType, isRequired = true) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      if (isRequired) {
        errors.push('Trees planted is required');
      }
      return { isValid: !isRequired, errors };
    }

    const num = parseInt(value);
    if (isNaN(num)) {
      errors.push('Trees planted must be a valid number');
      return { isValid: false, errors };
    }

    if (num <= 0) {
      errors.push('Trees planted must be a positive number');
      return { isValid: false, errors };
    }

    // Validate based on plantation type
    if (plantationType === 'Single' && num !== 1) {
      errors.push('Single plantation must have exactly 1 tree');
      return { isValid: false, errors };
    }

    if (plantationType === 'Multi' && num <= 1) {
      errors.push('Multi plantation must have more than 1 tree');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validateComment = (comment) => {
    const errors = [];

    if (comment && comment.length > 200) {
      errors.push('Comment must be maximum 200 characters');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validateRow = (row, index) => {
    const errors = [];
    let hasErrors = false;

    // Required field validations
    const typeVal = String(row['TYPE'] || '').trim();
    
    // Plantation type validation
    const typeResult = validatePlantationType(typeVal, true);
    if (!typeResult.isValid) {
      errors.push(...typeResult.errors);
      hasErrors = true;
    }

    // Date validations
    const startDateResult = validateDate(row['PLANTATION START DATE'], 'Plantation Start Date', true);
    if (!startDateResult.isValid) {
      errors.push(...startDateResult.errors);
      hasErrors = true;
    }

    let endDate = row['PLANTATION END DATE'];
    if (!endDate || String(endDate).trim() === '') {
      endDate = row['PLANTATION START DATE'];
    }

    const endDateResult = validateDate(endDate, 'Plantation End Date', false);
    if (!endDateResult.isValid) {
      errors.push(...endDateResult.errors);
      hasErrors = true;
    }

    if (startDateResult.isValid && endDateResult.isValid && endDate) {
      const startDate = new Date(row['PLANTATION START DATE']);
      const endDateObj = new Date(endDate);
      if (endDateObj < startDate) {
        errors.push('Plantation End Date cannot be before Start Date');
        hasErrors = true;
      }
    }

    // Coordinate validations (both required)
    const latResult = validateCoordinate(row['LATITUDE'], 'Latitude', true);
    if (!latResult.isValid) {
      errors.push(...latResult.errors);
      hasErrors = true;
    }

    const lngResult = validateCoordinate(row['LONGITIUDE'], 'Longitude', true);
    if (!lngResult.isValid) {
      errors.push(...lngResult.errors);
      hasErrors = true;
    }

    // Species validation (depends on plantation type)
    const speciesResult = validateSpecies(row['SPECIES'], typeVal, true);
    if (!speciesResult.isValid) {
      errors.push(...speciesResult.errors);
      hasErrors = true;
    }

    // Trees planted validation (depends on plantation type)
    const treesResult = validateTreesPlanted(row['TREES PLANTED'], typeVal, true);
    if (!treesResult.isValid) {
      errors.push(...treesResult.errors);
      hasErrors = true;
    }

    // Optional validations
    const elevationResult = validatePositiveNumber(row['ELEVATION'], 'Elevation', false);
    if (!elevationResult.isValid) {
      errors.push(...elevationResult.errors);
      hasErrors = true;
    }

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

    const peopleResult = validatePositiveNumber(row['NUMBER OF PEOPLE INVOLVED'], 'Number of People Involved', false);
    if (!peopleResult.isValid) {
      errors.push(...peopleResult.errors);
      hasErrors = true;
    }

    // Comment validation
    const commentResult = validateComment(row['COMMENT']);
    if (!commentResult.isValid) {
      errors.push(...commentResult.errors);
      hasErrors = true;
    }

    return {
      index,
      hasErrors,
      errors,
      processedData: {
        ...row,
        'PLANTATION END DATE': endDate,
        'SPECIES': speciesResult.species,
        'TREES PLANTED': typeVal === 'Single' ? 1 : row['TREES PLANTED'] // Ensure single is always 1
      }
    };
  };

  const processCSVData = async () => {
    try {
      setIsValidating(true);

      if (fileData.length === 0) {
        throw new Error('No file selected');
      }

      const results = fileData.map((row, index) => validateRow(row, index));

      setData(fileData);
      setValidationResults(results);

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
    const validationResult = validateRow(editData, editingCard);

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

  // Handle type change in edit mode
  const handleTypeChange = (newType) => {
    const updatedEditData = { ...editData, 'TYPE': newType };
    
    // Auto-set trees planted based on type
    if (newType === 'Single') {
      updatedEditData['TREES PLANTED'] = 1;
    } else if (newType === 'Multi' && (!editData['TREES PLANTED'] || editData['TREES PLANTED'] <= 1)) {
      updatedEditData['TREES PLANTED'] = 2; // Default minimum for multi
    }
    
    setEditData(updatedEditData);
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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white p-8 rounded-2xl shadow-xl"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="h-8 w-8 animate-spin text-[#007A49]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Validating Your Data</h2>
          <p className="text-gray-600 max-w-md">Please wait while we process and validate your CSV file. This ensures data quality and consistency.</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
                  className="w-2 h-2 bg-[#007A49] rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 min-w-full" style={{flex:1}}>
      <div className="min-h-screen bg-gray-50 min-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onBack(3)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-[#007A49] hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Data Validation</h1>
              <p className="text-gray-600 mt-1">Review and validate your imported data</p>
            </div>
          </div>

          <button
            onClick={() => onNext(validationResults.map(r => r.processedData), 3)}
            disabled={!canProceed}
            className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${canProceed
                ? 'bg-gradient-to-r from-[#007A49] to-green-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {canProceed ? (
              <>
                Continue to Upload
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Fix {totalErrors} errors to continue
              </>
            )}
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-6 mb-8 shadow-sm"
        >
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <p className="font-semibold">Data Validation Guidelines:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Review the imported CSV data and correct any validation errors</li>
                <li><strong>Single Plantation:</strong> Must have exactly 1 tree and 1 species only</li>
                <li><strong>Multi Plantation:</strong> Must have 2+ trees and can have multiple species</li>
                <li>Required fields are marked with an asterisk (*)</li>
                <li>Date format must be MM/DD/YYYY</li>
                <li>Latitude and Longitude are mandatory coordinates</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Summary and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Total Records</span>
                <span className="font-bold text-gray-900 text-lg">{data.length}</span>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-xl border shadow-sm ${totalErrors > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
              }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${totalErrors > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                <span className="text-sm font-medium text-gray-600">Validation Errors</span>
                <span className={`font-bold text-lg ${totalErrors > 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                  {totalErrors}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${filterType === 'all'
                    ? 'bg-[#007A49] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Eye className="h-4 w-4" />
                <span>All Records</span>
              </button>
              <button
                onClick={() => setFilterType('errors')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${filterType === 'errors'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <AlertCircle className="h-4 w-4" />
                <span>Errors ({totalErrors})</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Data Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          <AnimatePresence>
            {filteredResults.map((result, idx) => (
              <motion.div
                key={result.index}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${result.hasErrors
                    ? 'border-red-300 hover:border-red-400'
                    : 'border-green-300 hover:border-green-400'
                  }`}
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.hasErrors ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                        <span className={`font-bold text-sm ${result.hasErrors ? 'text-red-800' : 'text-green-800'
                          }`}>
                          #{result.index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Record {result.index + 1}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {data[result.index]['TYPE'] || 'Unknown Type'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {result.hasErrors && (
                        <button
                          onClick={() => showErrors(result.errors)}
                          className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full hover:bg-red-200 transition-colors flex items-center space-x-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>{result.errors.length} errors</span>
                        </button>
                      )}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(result.index)}
                          className="p-2 text-gray-400 hover:text-[#007A49] hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(result.index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                      {/* Type Dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">PLANTATION TYPE *</label>
                        <select
                          value={editData['TYPE'] || ''}
                          onChange={(e) => handleTypeChange(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Type...</option>
                          <option value="Single">Single</option>
                          <option value="Multi">Multi</option>
                        </select>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">START DATE *</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY"
                            value={editData['PLANTATION START DATE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PLANTATION START DATE': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">END DATE</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY (defaults to start date)"
                            value={editData['PLANTATION END DATE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PLANTATION END DATE': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Location - Both Required */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">LATITUDE *</label>
                          <input
                            type="text"
                            placeholder="e.g., 12.9221"
                            value={editData['LATITUDE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'LATITUDE': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">LONGITUDE *</label>
                          <input
                            type="text"
                            placeholder="e.g., 77.5937"
                            value={editData['LONGITIUDE'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'LONGITIUDE': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Trees and Species */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            TREES PLANTED * 
                            {editData['TYPE'] === 'Single' && (
                              <span className="text-xs text-gray-500 ml-1">(Fixed at 1)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={editData['TREES PLANTED'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'TREES PLANTED': e.target.value })}
                            disabled={editData['TYPE'] === 'Single'}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200 ${
                              editData['TYPE'] === 'Single' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                          />
                          {editData['TYPE'] === 'Multi' && (
                            <p className="text-xs text-gray-500 mt-1">Minimum 2 trees for multi plantation</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            SPECIES *
                            {editData['TYPE'] === 'Single' && (
                              <span className="text-xs text-gray-500 ml-1">(One species only)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder={editData['TYPE'] === 'Single' ? 'Single species name' : 'Comma separated'}
                            value={Array.isArray(editData['SPECIES']) ? editData['SPECIES'].join(', ') : editData['SPECIES'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'SPECIES': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Measurements */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">ELEVATION</label>
                          <input
                            type="text"
                            placeholder="meters"
                            value={editData['ELEVATION'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'ELEVATION': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">HEIGHT</label>
                          <input
                            type="text"
                            placeholder="meters"
                            value={editData['AVERAGE PLANT HEIGHT'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'AVERAGE PLANT HEIGHT': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">DIAMETER</label>
                          <input
                            type="text"
                            placeholder="cm"
                            value={editData['AVERGAE PLANT DIAMETER'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'AVERGAE PLANT DIAMETER': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* People and Tag */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">PEOPLE INVOLVED</label>
                          <input
                            type="text"
                            value={editData['NUMBER OF PEOPLE INVOLVED'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'NUMBER OF PEOPLE INVOLVED': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">TAG</label>
                          <input
                            type="text"
                            value={editData['TAG'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'TAG': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Location and Person */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">LOCATION NAME</label>
                          <input
                            type="text"
                            value={editData['LOCATION NAME'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'LOCATION NAME': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">PERSON NAME</label>
                          <input
                            type="text"
                            value={editData['PERSON NAME'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'PERSON NAME': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* ID and Designation */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">ID</label>
                          <input
                            type="text"
                            value={editData['ID'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'ID': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">DESIGNATION</label>
                          <input
                            type="text"
                            value={editData['DESIGNATION'] || ''}
                            onChange={(e) => setEditData({ ...editData, 'DESIGNATION': e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">COMMENT</label>
                        <textarea
                          rows={3}
                          maxLength={200}
                          placeholder="Maximum 200 characters"
                          value={editData['COMMENT'] || ''}
                          onChange={(e) => setEditData({ ...editData, 'COMMENT': e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(editData['COMMENT'] || '').length}/200 characters
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                          <X className="h-4 w-4 inline mr-1" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 text-sm font-medium bg-[#007A49] text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      {/* Key Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <TreePine className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Plantation Type</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {data[result.index]['TYPE'] || 'N/A'}
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                data[result.index]['TYPE'] === 'Single' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {data[result.index]['TYPE'] === 'Single' ? '1 Tree' : 'Multi Trees'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <TreePine className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Trees Planted</p>
                            <p className="text-sm font-bold text-green-800">
                              {data[result.index]['TREES PLANTED'] || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Species */}
                      <div className="flex items-start space-x-2">
                        <Tag className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Species</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(data[result.index]['SPECIES'])
                              ? data[result.index]['SPECIES'].map((species, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {species}
                                </span>
                              ))
                              : (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {data[result.index]['SPECIES'] || 'Unknown'}
                                </span>
                              )
                            }
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Start Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {data[result.index]['PLANTATION START DATE'] || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">End Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {data[result.index]['PLANTATION END DATE'] || 'Same as start'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Location</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {data[result.index]['LOCATION NAME'] || 'Unnamed Location'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {data[result.index]['LATITUDE'] && data[result.index]['LONGITIUDE']
                              ? `${parseFloat(data[result.index]['LATITUDE']).toFixed(4)}, ${parseFloat(data[result.index]['LONGITIUDE']).toFixed(4)}`
                              : 'Coordinates missing'}
                          </p>
                        </div>
                      </div>

                      {/* People */}
                      {data[result.index]['NUMBER OF PEOPLE INVOLVED'] && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">People Involved</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {data[result.index]['NUMBER OF PEOPLE INVOLVED']}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Person Details */}
                      {(data[result.index]['PERSON NAME'] || data[result.index]['DESIGNATION'] || data[result.index]['ID']) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Contact Person</p>
                          <div className="space-y-1">
                            {data[result.index]['PERSON NAME'] && (
                              <p className="text-sm font-semibold text-gray-900">
                                {data[result.index]['PERSON NAME']}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                              {data[result.index]['DESIGNATION'] && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {data[result.index]['DESIGNATION']}
                                </span>
                              )}
                              {data[result.index]['ID'] && (
                                <span>ID: {data[result.index]['ID']}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      {(data[result.index]['ELEVATION'] || data[result.index]['AVERAGE PLANT HEIGHT'] || data[result.index]['AVERGAE PLANT DIAMETER'] || data[result.index]['TAG']) && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Additional Details</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {data[result.index]['ELEVATION'] && (
                              <div>
                                <span className="text-gray-500">Elevation:</span>
                                <span className="ml-1 font-medium">{data[result.index]['ELEVATION']}m</span>
                              </div>
                            )}
                            {data[result.index]['AVERAGE PLANT HEIGHT'] && (
                              <div>
                                <span className="text-gray-500">Height:</span>
                                <span className="ml-1 font-medium">{data[result.index]['AVERAGE PLANT HEIGHT']}m</span>
                              </div>
                            )}
                            {data[result.index]['AVERGAE PLANT DIAMETER'] && (
                              <div>
                                <span className="text-gray-500">Diameter:</span>
                                <span className="ml-1 font-medium">{data[result.index]['AVERGAE PLANT DIAMETER']}cm</span>
                              </div>
                            )}
                            {data[result.index]['TAG'] && (
                              <div>
                                <span className="text-gray-500">Tag:</span>
                                <span className="ml-1 font-medium">{data[result.index]['TAG']}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comment */}
                      {data[result.index]['COMMENT'] && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Comment</p>
                          <p className="text-sm text-gray-700">{data[result.index]['COMMENT']}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results Message */}
        {filteredResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">No records match your current filter criteria.</p>
          </motion.div>
        )}

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredResults.length}</span> of{' '}
              <span className="font-semibold">{data.length}</span> records shown
            </div>
            {totalErrors > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{totalErrors} validation errors need attention</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNext(validationResults.map(r => r.processedData))}
            disabled={!canProceed}
            className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${canProceed
                ? 'bg-gradient-to-r from-[#007A49] to-green-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {canProceed ? (
              <>
                Continue to Upload
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Fix {totalErrors} errors to continue
              </>
            )}
          </button>
        </motion.div>

        {/* Error Modal */}
        <AnimatePresence>
          {showErrorModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowErrorModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800">Validation Errors</h3>
                      <p className="text-sm text-red-600">{selectedCardErrors.length} issues found</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedCardErrors.map((error, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800 font-medium">{error}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
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