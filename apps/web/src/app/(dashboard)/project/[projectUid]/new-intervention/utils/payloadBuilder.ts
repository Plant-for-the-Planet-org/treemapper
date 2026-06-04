import { FormData } from '../types';

export const buildPlanningPayload = (formData: FormData) => {
  const payload: any = {
    type: formData.interventionType,
    geometry: formData.geoJSON,
    // plantProject is read by the upload modal to build the request URL,
    // the planning DTO rejects it (and treeCount) as unknown body fields.
    plantProject: formData.projectId,
    metadata: { app: {}, public: {}, private: {} },
  };

  if (formData.siteId) {
    payload.plantProjectSite = formData.siteId;
  }
  if (formData.description) {
    payload.description = formData.description;
  }
  if (formData.treeDetails.tag) {
    payload.tag = formData.treeDetails.tag;
  }

  if (formData.interventionType === 'single-tree-registration' && formData.species.length > 0) {
    const species = formData.species[0];
    payload.species = [{
      uid: species.uid,
      scientificSpeciesId: species.scientificSpeciesId || undefined,
      scientificSpeciesUid: species.scientificSpeciesId || undefined,
      speciesName: species.speciesName || species.otherSpeciesName,
      isUnknown: species.scientificSpeciesId ? false : true,
      speciesCount: 1,
      otherSpeciesName: species.otherSpeciesName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
  } else if (formData.species.length > 0) {
    payload.species = formData.species.map(species => ({
      uid: species.uid,
      scientificSpeciesId: species.scientificSpeciesId || undefined,
      scientificSpeciesUid: species.scientificSpeciesId || undefined,
      speciesName: species.speciesName || species.otherSpeciesName,
      isUnknown: species.scientificSpeciesId ? false : true,
      speciesCount: species.count,
    }));
  }

  return payload;
};

// Bulk planning of single trees: one planned single-tree intervention per
// marked point, all sharing the single selected species. Mirrors the tag
// logic in MultiSingleTreePanel (prefix + 1-based index) so the tags the user
// previewed match what gets saved.
export const buildBulkSingleTreePlanPayload = (formData: FormData) => {
  const species = formData.species[0];
  const tagPrefix = formData.treeDetails.tagPrefix || '';

  const payload: any = {
    species: species
      ? [{
          scientificSpeciesId: species.scientificSpeciesId || undefined,
          isUnknown: species.scientificSpeciesId ? false : true,
          speciesName: species.speciesName || species.otherSpeciesName,
        }]
      : [],
    points: formData.multiTreePoints.map((point, index) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      tag: tagPrefix ? `${tagPrefix}${index + 1}` : undefined,
    })),
    metadata: { app: {}, public: {}, private: {} },
    // plantProject is read by the upload modal to build the request URL.
    plantProject: formData.projectId,
  };

  if (formData.siteId) {
    payload.plantProjectSite = formData.siteId;
  }
  if (formData.description) {
    payload.description = formData.description;
  }

  return payload;
};

export const buildApiPayload = (formData: FormData) => {
  const totalTreeCount = formData.species.reduce((sum, species) => sum + species.count, 0);

  const payload: any = {
    type: formData.interventionType,
    captureMode: 'off-site',
    geometry: formData.geoJSON,
    registrationDate: new Date().toISOString(),
    metadata: { app: {}, public: {}, private: {} },
    plantProject: formData.projectId,
    treeCount: totalTreeCount,
    interventionStartDate: new Date(formData.treeDetails.plantingDate).toISOString(),
    interventionEndDate: new Date(formData.treeDetails.plantingDate).toISOString(),
  };

  if (formData.siteId) {
    payload.plantProjectSite = formData.siteId;
  }

  if (formData.description) {
    payload.description = formData.description;
  }

  // Handle species data according to intervention type
  if (formData.interventionType === 'single-tree-registration' && formData.species.length > 0) {
    const species = formData.species[0];
    payload.species = [{
      uid: species.uid,
      scientificSpeciesId: species.scientificSpeciesId || undefined,
      scientificSpeciesUid: species.scientificSpeciesId || undefined,
      speciesName: species.speciesName || species.otherSpeciesName,
      isUnknown: species.scientificSpeciesId ? false : true,
      speciesCount: 1,
      otherSpeciesName: species.otherSpeciesName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
    // Add tree details for single tree registration
    payload.tag = formData.treeDetails.tag;
    payload.height = formData.treeDetails.height ? parseFloat(formData.treeDetails.height) : null;
    payload.width = formData.treeDetails.width ? parseFloat(formData.treeDetails.width) : null;
  } else if (formData.species.length > 0) {
    // For multi-tree registration or other types that support multiple species
    payload.species = formData.species.map(species => ({
      uid: species.uid,
      scientificSpeciesId: species.scientificSpeciesId || undefined,
      scientificSpeciesUid: species.scientificSpeciesId || undefined,
      speciesName: species.speciesName || species.otherSpeciesName,
      isUnknown: species.scientificSpeciesId ? false : true,
      speciesCount: species.count
    }));
  }

  return payload;
};
