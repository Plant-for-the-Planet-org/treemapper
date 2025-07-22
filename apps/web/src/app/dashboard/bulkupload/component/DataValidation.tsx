'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit3,
  X,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  Users,
  TreePine,
  Tag,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataValidation = ({ fileData, onBack, onNext }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [data, setData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
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

  const parseSpeciesData = (speciesStr, treesPlanted = 0, plantationType = null) => {
    console.log("Parsing species:", speciesStr, "Trees:", treesPlanted, "Type:", plantationType);
    
    if (!speciesStr || speciesStr.trim() === '') {
      return [];
    }

    // Clean the species string - remove quotes and extra whitespace
    let cleanedSpeciesStr = String(speciesStr)
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .trim();

    console.log("Cleaned species string:", cleanedSpeciesStr);

    const speciesArray = cleanedSpeciesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.replace(/^["']|["']$/g, '')); // Remove quotes from individual species

    console.log("Species array:", speciesArray);

    // For single plantations, always return one species with count 1
    if (plantationType === 'single') {
      return [{ name: speciesArray[0] || '', count: 1 }];
    }

    // For single species (but not Single plantation type), use the full tree count
    if (speciesArray.length === 1) {
      return [{ name: speciesArray[0], count: treesPlanted || 1 }];
    }

    // For multiple species, distribute trees evenly initially
    const countPerSpecies = Math.floor(treesPlanted / speciesArray.length);
    const remainder = treesPlanted % speciesArray.length;

    const result = speciesArray.map((species, index) => ({
      name: species,
      count: countPerSpecies + (index < remainder ? 1 : 0)
    }));

    console.log("Final species data:", result);
    return result;
  };

  const validateSpeciesData = (speciesData, plantationType, isRequired = true) => {
    const errors = [];

    if (!speciesData || speciesData.length === 0) {
      if (isRequired) {
        errors.push('At least one species is required');
      }
      return { isValid: !isRequired, errors };
    }

    // Validate based on plantation type
    if (plantationType === 'single' && speciesData.length > 1) {
      errors.push('Single plantation can only have one species');
      return { isValid: false, errors };
    }

    if (plantationType === 'single' && speciesData[0]?.count !== 1) {
      errors.push('Single plantation must have exactly 1 tree');
      return { isValid: false, errors };
    }



    // Validate individual counts
    for (const species of speciesData) {
      if (!species.name || species.name.trim() === '') {
        errors.push('Species name cannot be empty');
        return { isValid: false, errors };
      }
      if (!species.count || species.count <= 0) {
        errors.push(`${species.name} must have at least 1 tree`);
        return { isValid: false, errors };
      }
    }

    const totalTrees = speciesData.reduce((sum, species) => sum + species.count, 0);
    if (plantationType === 'multi' && totalTrees <= 1) {
      errors.push('Multi plantation must have more than 1 tree total');
      return { isValid: false, errors };
    }

    return { isValid: true, errors };
  };

  const validatePlantationType = (value, isRequired = true) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      if (isRequired) {
        errors.push('Plantation type is required');
      }
      return { isValid: !isRequired, errors };
    }

    const validValues = ['Single', 'Multi', 'multi', 'single'];
    if (!validValues.includes(value.toString())) {
      errors.push('Plantation type must be either "Single" or "Multi"');
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

    const lngResult = validateCoordinate(row['LONGITUDE'], 'Longitude', true);
    if (!lngResult.isValid) {
      errors.push(...lngResult.errors);
      hasErrors = true;
    }

    // Species validation with new structure
    const speciesData = row['SPECIES_DATA'] || parseSpeciesData(row['SPECIES'], row['TREES PLANTED'], typeVal);
    const speciesResult = validateSpeciesData(speciesData, typeVal, true);
    if (!speciesResult.isValid) {
      errors.push(...speciesResult.errors);
      hasErrors = true;
    }

    // Calculate total trees from species data
    const calculatedTreesPlanted = speciesData.reduce((sum, species) => sum + (species.count || 0), 0);

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

    const diameterResult = validatePositiveNumber(row['AVERAGE PLANT DIAMETER'], 'Average Plant Diameter', false);
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
        'SPECIES_DATA': speciesData,
        'TREES PLANTED': calculatedTreesPlanted
      }
    };
  };

  const processCSVData = async () => {
    try {
      setIsValidating(true);

      if (fileData.length === 0) {
        throw new Error('No file selected');
      }

      // Process each row and add species data structure
      const processedFileData = fileData.map(row => ({
        ...row,
        'SPECIES_DATA': parseSpeciesData(row['SPECIES'], row['TREES PLANTED'] || 1, row['TYPE'])
      }));

      const results = processedFileData.map((row, index) => validateRow(row, index));

      setData(processedFileData);
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

  // Auto-save function
  const autoSaveChanges = (index, newData) => {
    const validationResult = validateRow(newData, index);

    const updatedData = [...data];
    const updatedValidationResults = [...validationResults];

    updatedData[index] = newData;
    updatedValidationResults[index] = validationResult;

    setData(updatedData);
    setValidationResults(updatedValidationResults);
  };

  const handleFieldChange = (index, fieldName, value) => {
    const newData = { ...data[index], [fieldName]: value };
    
    // Handle type change logic
    if (fieldName === 'TYPE') {
      if (value.toLowerCase() === 'single') {
        // For single plantation, ensure only one species with count 1
        if (newData['SPECIES_DATA'] && newData['SPECIES_DATA'].length > 0) {
          newData['SPECIES_DATA'] = [{ 
            name: newData['SPECIES_DATA'][0].name, 
            count: 1 
          }];
        } else {
          newData['SPECIES_DATA'] = [{ name: '', count: 1 }];
        }
      } else if (value.toLowerCase() === 'multi') {
        // For multi plantation, ensure at least 2 species
        if (!newData['SPECIES_DATA'] || newData['SPECIES_DATA'].length < 2) {
          newData['SPECIES_DATA'] = [
            { name: '', count: 1 },
            { name: '', count: 1 }
          ];
        }
      }
    }

    autoSaveChanges(index, newData);
  };

  const handleSpeciesChange = (rowIndex, speciesIndex, field, value) => {
    const newData = { ...data[rowIndex] };
    const newSpeciesData = [...newData['SPECIES_DATA']];
    
    if (field === 'name') {
      newSpeciesData[speciesIndex].name = value;
    } else if (field === 'count') {
      const count = parseInt(value) || 0;
      newSpeciesData[speciesIndex].count = Math.max(0, count);
    }
    
    newData['SPECIES_DATA'] = newSpeciesData;
    
    // Auto-calculate total trees
    const totalTrees = newSpeciesData.reduce((sum, species) => sum + species.count, 0);
    newData['TREES PLANTED'] = totalTrees;
    
    autoSaveChanges(rowIndex, newData);
  };

  const addSpecies = (rowIndex) => {
    const newData = { ...data[rowIndex] };
    newData['SPECIES_DATA'] = [...newData['SPECIES_DATA'], { name: '', count: 1 }];
    
    // Auto-calculate total trees
    const totalTrees = newData['SPECIES_DATA'].reduce((sum, species) => sum + species.count, 0);
    newData['TREES PLANTED'] = totalTrees;
    
    autoSaveChanges(rowIndex, newData);
  };

  const removeSpecies = (rowIndex, speciesIndex) => {
    const newData = { ...data[rowIndex] };
    newData['SPECIES_DATA'] = newData['SPECIES_DATA'].filter((_, index) => index !== speciesIndex);
    
    // Auto-calculate total trees
    const totalTrees = newData['SPECIES_DATA'].reduce((sum, species) => sum + species.count, 0);
    newData['TREES PLANTED'] = totalTrees;
    
    autoSaveChanges(rowIndex, newData);
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
              className="flex items-center px-4 py-2 text-gray-600 hover:text-[#007A49] hover:bg-white rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
            </button>
              <h1 className="text-4xl font-bold text-gray-900" style={{margin:0,padding:0}}>Data Validation</h1>
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
                <li>For Multi plantations, specify tree count for each species</li>
                <li>Changes are auto-saved as you edit</li>
                <li>Required fields are marked with an asterisk (*)</li>
                <li>Date format must be MM/DD/YYYY</li>
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
                          onClick={() => setEditingCard(editingCard === result.index ? null : result.index)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            editingCard === result.index 
                              ? 'text-[#007A49] bg-green-50' 
                              : 'text-gray-400 hover:text-[#007A49] hover:bg-green-50'
                          }`}
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
                          value={data[result.index]['TYPE']?data[result.index]['TYPE'].toLowerCase(): ''}
                          onChange={(e) => handleFieldChange(result.index, 'TYPE', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select Type...</option>
                          <option value="single">Single</option>
                          <option value="multi">Multi</option>
                        </select>
                      </div>

                      {/* Species Section */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          SPECIES & TREE COUNT *
                        </label>
                        <div className="space-y-3">
                          {data[result.index]['SPECIES_DATA']?.map((species, speciesIndex) => (
                            <div key={speciesIndex} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                              <input
                                type="text"
                                placeholder="Species name"
                                value={species.name}
                                onChange={(e) => handleSpeciesChange(result.index, speciesIndex, 'name', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                              />
                              <input
                                type="number"
                                placeholder="Count"
                                min="1"
                                value={species.count}
                                onChange={(e) => handleSpeciesChange(result.index, speciesIndex, 'count', e.target.value)}
                                disabled={data[result.index]['TYPE'] === 'single' || data[result.index]['TYPE'] === 'single'}
                                className={`w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200 ${
                                  data[result.index]['TYPE'] === 'single' ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                              />
                              {data[result.index]['TYPE'] === 'multi' && data[result.index]['SPECIES_DATA']?.length > 1 && (
                                <button
                                  onClick={() => removeSpecies(result.index, speciesIndex)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {data[result.index]['TYPE'] === 'multi' && (
                            <button
                              onClick={() => addSpecies(result.index)}
                              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#007A49] hover:text-[#007A49] transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="text-sm font-medium">Add Another Species</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Total Trees Display */}
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 font-medium">Total Trees:</span>
                            <span className="font-bold text-blue-800">
                              {data[result.index]['SPECIES_DATA']?.reduce((sum, species) => sum + species.count, 0) || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">START DATE *</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY"
                            value={data[result.index]['PLANTATION START DATE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PLANTATION START DATE', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">END DATE</label>
                          <input
                            type="text"
                            placeholder="MM/DD/YYYY (defaults to start date)"
                            value={data[result.index]['PLANTATION END DATE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PLANTATION END DATE', e.target.value)}
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
                            value={data[result.index]['LATITUDE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LATITUDE', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">LONGITUDE *</label>
                          <input
                            type="text"
                            placeholder="e.g., 77.5937"
                            value={data[result.index]['LONGITUDE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LONGITUDE', e.target.value)}
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
                            value={data[result.index]['ELEVATION'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'ELEVATION', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">HEIGHT</label>
                          <input
                            type="text"
                            placeholder="meters"
                            value={data[result.index]['AVERAGE PLANT HEIGHT'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'AVERAGE PLANT HEIGHT', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">DIAMETER</label>
                          <input
                            type="text"
                            placeholder="cm"
                            value={data[result.index]['AVERAGE PLANT DIAMETER'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'AVERAGE PLANT DIAMETER', e.target.value)}
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
                            value={data[result.index]['NUMBER OF PEOPLE INVOLVED'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'NUMBER OF PEOPLE INVOLVED', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">TAG</label>
                          <input
                            type="text"
                            value={data[result.index]['TAG'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'TAG', e.target.value)}
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
                            value={data[result.index]['LOCATION NAME'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LOCATION NAME', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">PERSON NAME</label>
                          <input
                            type="text"
                            value={data[result.index]['PERSON NAME'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PERSON NAME', e.target.value)}
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
                            value={data[result.index]['ID'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'ID', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">DESIGNATION</label>
                          <input
                            type="text"
                            value={data[result.index]['DESIGNATION'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'DESIGNATION', e.target.value)}
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
                          value={data[result.index]['COMMENT'] || ''}
                          onChange={(e) => handleFieldChange(result.index, 'COMMENT', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007A49] focus:border-transparent transition-all duration-200 resize-none"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(data[result.index]['COMMENT'] || '').length}/200 characters
                        </div>
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
                                data[result.index]['TYPE'] === 'single' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {data[result.index]['TYPE'].toLowerCase() === 'single' ? '1 Tree' : 'Multi Trees'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <TreePine className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Total Trees</p>
                            <p className="text-sm font-bold text-green-800">
                              {data[result.index]['TREES PLANTED'] || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Species with Counts */}
                      <div className="flex items-start space-x-2">
                        <Tag className="h-4 w-4 text-purple-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Species & Tree Count</p>
                          <div className="space-y-2 mt-1">
                            {data[result.index]['SPECIES_DATA']?.map((species, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                <span className="text-sm font-medium text-purple-800">
                                  {species.name || 'Unknown Species'}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-bold">
                                  {species.count} {species.count === 1 ? 'tree' : 'trees'}
                                </span>
                              </div>
                            )) || (
                              <span className="text-sm text-gray-500 italic">No species data</span>
                            )}
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
                            {data[result.index]['LATITUDE'] && data[result.index]['LONGITUDE']
                              ? `${parseFloat(data[result.index]['LATITUDE']).toFixed(4)}, ${parseFloat(data[result.index]['LONGITUDE']).toFixed(4)}`
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
                      {(data[result.index]['ELEVATION'] || data[result.index]['AVERAGE PLANT HEIGHT'] || data[result.index]['AVERAGE PLANT DIAMETER'] || data[result.index]['TAG']) && (
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
                            {data[result.index]['AVERAGE PLANT DIAMETER'] && (
                              <div>
                                <span className="text-gray-500">Diameter:</span>
                                <span className="ml-1 font-medium">{data[result.index]['AVERAGE PLANT DIAMETER']}cm</span>
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