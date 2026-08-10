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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DataValidation = ({ fileData, onBack, onNext }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [data, setData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedCardErrors, setSelectedCardErrors] = useState([]);

  console.log("CSV Data:", fileData);

  // Parse a DD/MM/YYYY string into a Date. JS `new Date('DD/MM/YYYY')` would
  // read slashes as US (MM/DD), so we build the date from explicit parts and
  // verify it round-trips (rejects values like 31/02/2024).
  const parseDMY = (dateStr) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return new Date(NaN);
    }
    return d;
  };

  // Validation functions
  const validateDate = (dateStr, fieldName, isRequired = false) => {
    const errors = [];

    if (!dateStr || dateStr.trim() === '') {
      if (isRequired) {
        errors.push(`${fieldName} is required`);
      }
      return { isValid: !isRequired, errors };
    }

    const datePattern = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!datePattern.test(dateStr)) {
      errors.push(`${fieldName} must be in DD/MM/YYYY format`);
      return { isValid: false, errors };
    }

    const date = parseDMY(dateStr);
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
      const startDate = parseDMY(row['PLANTATION START DATE']);
      const endDateObj = parseDMY(endDate);
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw size={14} className="animate-spin text-primary" />
          Validating your data...
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Button variant="ghost" size="icon" onClick={() => onBack(3)} className="h-8 w-8">
          <ArrowLeft size={14} />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Data validation</h2>
      </div>

      {/* Instructions */}
      <div className="bg-muted/40 border-l-4 border-primary rounded-r-lg p-4 mb-5">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Data validation guidelines:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
              <li>Review the imported CSV data and correct any validation errors</li>
              <li><strong className="text-foreground">Single plantation:</strong> Must have exactly 1 tree and 1 species only</li>
              <li><strong className="text-foreground">Multi plantation:</strong> Must have 2+ trees and can have multiple species</li>
              <li>For multi plantations, specify tree count for each species</li>
              <li>Changes are auto-saved as you edit</li>
              <li>Required fields are marked with an asterisk (*)</li>
              <li>Date format must be DD/MM/YYYY</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Card className="py-0 gap-0">
            <CardContent className="px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground">{data.length}</span>
            </CardContent>
          </Card>
          <Card className={cn('py-0 gap-0', totalErrors > 0 && 'border-destructive/40 bg-destructive/5')}>
            <CardContent className="px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Errors</span>
              <span className={cn('font-semibold', totalErrors > 0 ? 'text-destructive' : 'text-primary')}>
                {totalErrors}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex bg-muted/40 border border-border rounded-lg p-0.5">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            <Eye size={14} className="mr-1.5" />
            All records
          </Button>
          <Button
            variant={filterType === 'errors' ? 'destructive' : 'ghost'}
            size="sm"
            onClick={() => setFilterType('errors')}
          >
            <AlertCircle size={14} className="mr-1.5" />
            Errors ({totalErrors})
          </Button>
        </div>
      </div>

        {/* Data Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
          <AnimatePresence>
            {filteredResults.map((result, idx) => (
              <motion.div
                key={result.index}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'bg-background rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md',
                  result.hasErrors ? 'border-destructive/40 hover:border-destructive/60' : 'border-border hover:border-border/60'
                )}
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.hasErrors ? 'bg-destructive/20' : 'bg-primary/20'
                        }`}>
                        <span className={`font-bold text-sm ${result.hasErrors ? 'text-destructive' : 'text-primary'
                          }`}>
                          #{result.index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          Record {result.index + 1}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {data[result.index]['TYPE'] || 'Unknown Type'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {result.hasErrors && (
                        <button
                          onClick={() => showErrors(result.errors)}
                          className="px-3 py-1 bg-destructive/20 text-destructive text-xs font-medium rounded-full hover:bg-destructive/30 transition-colors flex items-center space-x-1"
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
                              ? 'text-primary bg-primary/10' 
                              : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
                          }`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(result.index)}
                          className="p-2 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
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
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Plantation type *</Label>
                        <Select
                          value={data[result.index]['TYPE'] ? data[result.index]['TYPE'].toLowerCase() : ''}
                          onValueChange={(value) => handleFieldChange(result.index, 'TYPE', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="multi">Multi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Species Section */}
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                          Species & tree count *
                        </Label>
                        <div className="space-y-3">
                          {data[result.index]['SPECIES_DATA']?.map((species, speciesIndex) => (
                            <div key={speciesIndex} className="flex items-center space-x-2 p-3 bg-muted/40 rounded-lg">
                              <Input
                                type="text"
                                placeholder="Species name"
                                value={species.name}
                                onChange={(e) => handleSpeciesChange(result.index, speciesIndex, 'name', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                placeholder="Count"
                                min="1"
                                value={species.count}
                                onChange={(e) => handleSpeciesChange(result.index, speciesIndex, 'count', e.target.value)}
                                disabled={data[result.index]['TYPE'] === 'single'}
                                className="w-20"
                              />
                              {data[result.index]['TYPE'] === 'multi' && data[result.index]['SPECIES_DATA']?.length > 1 && (
                                <button
                                  onClick={() => removeSpecies(result.index, speciesIndex)}
                                  className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {data[result.index]['TYPE'] === 'multi' && (
                            <button
                              onClick={() => addSpecies(result.index)}
                              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border-2 border-dashed border-input rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="text-sm font-medium">Add Another Species</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Total Trees Display */}
                        <div className="mt-2 p-2 bg-muted/40 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground font-medium">Total Trees:</span>
                            <span className="font-bold text-foreground">
                              {data[result.index]['SPECIES_DATA']?.reduce((sum, species) => sum + species.count, 0) || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">start date *</Label>
                          <Input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={data[result.index]['PLANTATION START DATE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PLANTATION START DATE', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">end date</Label>
                          <Input
                            type="text"
                            placeholder="DD/MM/YYYY (defaults to start date)"
                            value={data[result.index]['PLANTATION END DATE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PLANTATION END DATE', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* Location - Both Required */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">latitude *</Label>
                          <Input
                            type="text"
                            placeholder="e.g., 12.9221"
                            value={data[result.index]['LATITUDE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LATITUDE', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">longitude *</Label>
                          <Input
                            type="text"
                            placeholder="e.g., 77.5937"
                            value={data[result.index]['LONGITUDE'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LONGITUDE', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* Measurements */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">elevation</Label>
                          <Input
                            type="text"
                            placeholder="meters"
                            value={data[result.index]['ELEVATION'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'ELEVATION', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">height</Label>
                          <Input
                            type="text"
                            placeholder="meters"
                            value={data[result.index]['AVERAGE PLANT HEIGHT'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'AVERAGE PLANT HEIGHT', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">diameter</Label>
                          <Input
                            type="text"
                            placeholder="cm"
                            value={data[result.index]['AVERAGE PLANT DIAMETER'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'AVERAGE PLANT DIAMETER', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* People and Tag */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">people involved</Label>
                          <Input
                            type="text"
                            value={data[result.index]['NUMBER OF PEOPLE INVOLVED'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'NUMBER OF PEOPLE INVOLVED', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">tag</Label>
                          <Input
                            type="text"
                            value={data[result.index]['TAG'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'TAG', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* Location and Person */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">location name</Label>
                          <Input
                            type="text"
                            value={data[result.index]['LOCATION NAME'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'LOCATION NAME', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">person name</Label>
                          <Input
                            type="text"
                            value={data[result.index]['PERSON NAME'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'PERSON NAME', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* ID and Designation */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">id</Label>
                          <Input
                            type="text"
                            value={data[result.index]['ID'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'ID', e.target.value)}
                            
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">designation</Label>
                          <Input
                            type="text"
                            value={data[result.index]['DESIGNATION'] || ''}
                            onChange={(e) => handleFieldChange(result.index, 'DESIGNATION', e.target.value)}
                            
                          />
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Comment</Label>
                        <Textarea
                          rows={3}
                          maxLength={200}
                          placeholder="Maximum 200 characters"
                          value={data[result.index]['COMMENT'] || ''}
                          onChange={(e) => handleFieldChange(result.index, 'COMMENT', e.target.value)}
                          className="resize-none"
                        />
                        <div className="text-xs text-muted-foreground text-right">
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
                          <TreePine className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Plantation Type</p>
                            <p className="text-sm font-semibold text-foreground">
                              {data[result.index]['TYPE'] || 'N/A'}
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                data[result.index]['TYPE'] === 'single' 
                                  ? 'bg-muted text-foreground' 
                                  : 'bg-muted text-foreground'
                              }`}>
                                {data[result.index]['TYPE'].toLowerCase() === 'single' ? '1 Tree' : 'Multi Trees'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                            <TreePine className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Total Trees</p>
                            <p className="text-sm font-bold text-primary">
                              {data[result.index]['TREES PLANTED'] || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Species with Counts */}
                      <div className="flex items-start space-x-2">
                        <Tag className="h-4 w-4 text-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Species & Tree Count</p>
                          <div className="space-y-2 mt-1">
                            {data[result.index]['SPECIES_DATA']?.map((species, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                                <span className="text-sm font-medium text-foreground">
                                  {species.name || 'Unknown Species'}
                                </span>
                                <span className="px-2 py-1 bg-muted text-foreground text-xs rounded-full font-bold">
                                  {species.count} {species.count === 1 ? 'tree' : 'trees'}
                                </span>
                              </div>
                            )) || (
                              <span className="text-sm text-muted-foreground italic">No species data</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Start Date</p>
                            <p className="text-sm font-semibold text-foreground">
                              {data[result.index]['PLANTATION START DATE'] || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">End Date</p>
                            <p className="text-sm font-semibold text-foreground">
                              {data[result.index]['PLANTATION END DATE'] || 'Same as start'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Location</p>
                          <p className="text-sm font-semibold text-foreground">
                            {data[result.index]['LOCATION NAME'] || 'Unnamed Location'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data[result.index]['LATITUDE'] && data[result.index]['LONGITUDE']
                              ? `${parseFloat(data[result.index]['LATITUDE']).toFixed(4)}, ${parseFloat(data[result.index]['LONGITUDE']).toFixed(4)}`
                              : 'Coordinates missing'}
                          </p>
                        </div>
                      </div>

                      {/* People */}
                      {data[result.index]['NUMBER OF PEOPLE INVOLVED'] && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-foreground" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">People Involved</p>
                            <p className="text-sm font-semibold text-foreground">
                              {data[result.index]['NUMBER OF PEOPLE INVOLVED']}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Person Details */}
                      {(data[result.index]['PERSON NAME'] || data[result.index]['DESIGNATION'] || data[result.index]['ID']) && (
                        <div className="bg-muted/40 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Contact Person</p>
                          <div className="space-y-1">
                            {data[result.index]['PERSON NAME'] && (
                              <p className="text-sm font-semibold text-foreground">
                                {data[result.index]['PERSON NAME']}
                              </p>
                            )}
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              {data[result.index]['DESIGNATION'] && (
                                <span className="bg-muted text-foreground px-2 py-1 rounded">
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
                        <div className="border-t border-border pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Additional Details</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {data[result.index]['ELEVATION'] && (
                              <div>
                                <span className="text-muted-foreground">Elevation:</span>
                                <span className="ml-1 font-medium">{data[result.index]['ELEVATION']}m</span>
                              </div>
                            )}
                            {data[result.index]['AVERAGE PLANT HEIGHT'] && (
                              <div>
                                <span className="text-muted-foreground">Height:</span>
                                <span className="ml-1 font-medium">{data[result.index]['AVERAGE PLANT HEIGHT']}m</span>
                              </div>
                            )}
                            {data[result.index]['AVERAGE PLANT DIAMETER'] && (
                              <div>
                                <span className="text-muted-foreground">Diameter:</span>
                                <span className="ml-1 font-medium">{data[result.index]['AVERAGE PLANT DIAMETER']}cm</span>
                              </div>
                            )}
                            {data[result.index]['TAG'] && (
                              <div>
                                <span className="text-muted-foreground">Tag:</span>
                                <span className="ml-1 font-medium">{data[result.index]['TAG']}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comment */}
                      {data[result.index]['COMMENT'] && (
                        <div className="bg-muted/40 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Comment</p>
                          <p className="text-sm text-foreground/80">{data[result.index]['COMMENT']}</p>
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
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOff className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
            <p className="text-muted-foreground">No records match your current filter criteria.</p>
          </motion.div>
        )}

      {/* Bottom Actions */}
      <Card className="py-0 gap-0">
        <CardContent className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span><span className="font-semibold text-foreground">{filteredResults.length}</span> of <span className="font-semibold text-foreground">{data.length}</span> records shown</span>
            {totalErrors > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle size={14} />
                {totalErrors} validation errors need attention
              </span>
            )}
          </div>

          <Button
            onClick={() => onNext(validationResults.map(r => r.processedData), 3)}
            disabled={!canProceed}
          >
            {canProceed ? (
              <>Continue to upload<ArrowRight size={14} className="ml-1.5" /></>
            ) : (
              <><AlertCircle size={14} className="mr-1.5" />Fix {totalErrors} errors to continue</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />
              Validation errors
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{selectedCardErrors.length} issues found</p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selectedCardErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
              >
                <AlertCircle size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setShowErrorModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataValidation;