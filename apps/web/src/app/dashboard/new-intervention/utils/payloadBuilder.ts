import { FormData } from '../types';

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
