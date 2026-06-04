import { FormData, ValidationErrors } from '../types';
import { VALIDATION_CONFIG, interventionConfigurations } from '../constants';
import { validateTreeMeasurement } from '../utils';

const PLANNABLE_TYPES = ['single-tree-registration', 'multi-tree-registration'];

export const validateForm = (formData: FormData): ValidationErrors => {
  const newErrors: ValidationErrors = {};
  const currentConfig = interventionConfigurations[formData.interventionType];

  // Project validation
  if (!formData.projectId) {
    newErrors.projectId = 'Project is required';
  }

  // Planning mode validation - relaxed: only type, species, location required
  if (formData.isPlanningMode) {
    if (!PLANNABLE_TYPES.includes(formData.interventionType)) {
      newErrors.interventionType = 'Planning mode supports tree-registration types only';
    }
    if (formData.species.length === 0) {
      newErrors.species = 'At least one species is required';
    }
    // Bulk single-tree mode marks locations as a list of points, not a single
    // geoJSON / uploaded file.
    const isMultiSingleTree =
      formData.multiSingleTree && formData.interventionType === 'single-tree-registration';
    if (isMultiSingleTree) {
      if (formData.multiTreePoints.length === 0) {
        newErrors.location = 'Mark at least one tree on the map';
      }
    } else if (!formData.geoJSON && !formData.geoJSONFile) {
      newErrors.location = 'Tree location must be marked on the map';
    }
    if (formData.description.length > VALIDATION_CONFIG.description.maxLength) {
      newErrors.description = `Comment must not exceed ${VALIDATION_CONFIG.description.maxLength} characters`;
    }
    return newErrors;
  }

  // Species validation
  if (currentConfig.requiresSpecies && formData.species.length === 0) {
    newErrors.species = 'At least one species is required';
  }

  // Location validation
  if (!formData.applyToEntireSite && !formData.geoJSON && !formData.geoJSONFile) {
    newErrors.location = 'Location must be defined (map selection or file upload)';
  }

  // Site selection validation
  if (formData.applyToEntireSite && !formData.siteId) {
    newErrors.siteId = 'Site must be selected when applying to entire site';
  }

  // Tree registration validation
  if (currentConfig.allowsTreeRegistration && formData.interventionType === 'single-tree-registration') {
    if (!formData.image) {
      newErrors.image = `Tree Image is required`;
    }

    if (formData.treeDetails.tag.length > VALIDATION_CONFIG.treeTag.maxLength) {
      newErrors.treeTag = `Tree tag must not exceed ${VALIDATION_CONFIG.treeTag.maxLength} characters`;
    }

    if (!formData.treeDetails.height) {
      newErrors.treeHeight = "Tree Height is required";
    }

    if (!formData.treeDetails.width) {
      newErrors.treeWidth = "Tree Diameter is required";
    }

    if (formData.treeDetails.height && !validateTreeMeasurement(formData.treeDetails.height, 'Height').isValid) {
      newErrors.treeHeight = validateTreeMeasurement(formData.treeDetails.height, 'Height').error;
    }

    if (formData.treeDetails.width && !validateTreeMeasurement(formData.treeDetails.width, 'Width').isValid) {
      newErrors.treeWidth = validateTreeMeasurement(formData.treeDetails.width, 'Width').error;
    }
  }

  // Description validation
  if (formData.description.length > VALIDATION_CONFIG.description.maxLength) {
    newErrors.description = `Description must not exceed ${VALIDATION_CONFIG.description.maxLength} characters`;
  }

  return newErrors;
};
