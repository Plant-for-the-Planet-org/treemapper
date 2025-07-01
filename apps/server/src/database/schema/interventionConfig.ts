export const interventionConfigurationSeedData = [
  {
    interventionType: 'direct-seeding' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Direct seeding intervention allows multiple species but no tree registration'
  },
  {
    interventionType: 'enrichment-planting' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    description: 'Enrichment planting allows multiple species and requires tree registration'
  },
  {
    interventionType: 'removal-invasive-species' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Removal of invasive species can track multiple species being removed'
  },
  {
    interventionType: 'multi-tree-registration' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    description: 'Multi-tree registration allows multiple species and requires tree registration',
    geoJSONType: 'Polygon'
  },
  {
    interventionType: 'sample-tree-registration' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    description: 'Sample tree registration allows single species and requires tree registration',
    geoJSONType: 'Point'
  },
  {
    interventionType: 'single-tree-registration' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: false,
    description: 'Single tree registration allows single species and requires tree registration',
    geoJSONType: 'Point'
  },
  {
    interventionType: 'fencing' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fencing intervention for site protection'
  },
  {
    interventionType: 'fire-patrol' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire patrol and prevention activities'
  },
  {
    interventionType: 'fire-suppression' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire suppression activities'
  },
  {
    interventionType: 'firebreaks' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Creating firebreaks for fire prevention'
  },
  {
    interventionType: 'generic-tree-registration' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: false,
    description: 'Generic tree registration for existing trees'
  },
  {
    interventionType: 'grass-suppression' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Grass suppression activities'
  },
  {
    interventionType: 'liberating-regenerant' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Liberating natural regenerants'
  },
  {
    interventionType: 'maintenance' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'General maintenance activities'
  },
  {
    interventionType: 'marking-regenerant' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Marking natural regenerants'
  },
  {
    interventionType: 'other-intervention' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Other types of interventions'
  },
  {
    interventionType: 'plot-plant-registration' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: true,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Plot-based plant registration'
  },
  {
    interventionType: 'soil-improvement' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Soil improvement activities'
  },
  {
    interventionType: 'stop-tree-harvesting' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Stopping tree harvesting activities'
  },
  {
    interventionType: 'assisting-seed-rain' as const,
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Assisting natural seed rain processes'
  },
  {
    interventionType: 'control-livestock' as const,
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Livestock control measures'
  }
] as const;