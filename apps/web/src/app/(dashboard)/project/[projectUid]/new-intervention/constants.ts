import React from 'react';
import {
  Sparkles,
  TreePine,
  Trash2,
  Target,
  Shield,
  Eye,
  Flame,
  Zap,
  Scissors,
  Unlock,
  Wrench,
  MapPin,
  MoreHorizontal,
  Mountain,
  Ban,
  CloudRain,
  Dog
} from 'lucide-react';

// Validation configuration
export const VALIDATION_CONFIG = {
  description: { maxLength: 2048 },
  treeTag: { maxLength: 100 },
  customSpeciesName: { maxLength: 255 },
  fileSize: { maxMB: 10 },
  coordinates: {
    latRange: [-90, 90],
    lngRange: [-180, 180],
    precision: 6
  }
};

// Intervention configurations
export const interventionConfigurations = {
  'direct-seeding': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    description: 'Direct seeding intervention allows multiple species but no tree registration',
    icon: React.createElement(Sparkles, { className: "w-5 h-5" }),
    color: 'emerald'
  },
  'enrichment-planting': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    description: 'Enrichment planting allows multiple species and requires tree registration',
    icon: React.createElement(TreePine, { className: "w-5 h-5" }),
    color: 'green'
  },
  'removal-invasive-species': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    allowEntireSite: true,
    geometryType: ['point', 'polygon'],
    description: 'Removal of invasive species can track multiple species being removed',
    icon: React.createElement(Trash2, { className: "w-5 h-5" }),
    color: 'red'
  },
  'multi-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: true,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: true,
    allowEntireSite: true,
    geometryType: ['polygon'],
    geoJSONType: 'Polygon',
    description: 'Multi-tree registration allows multiple species and requires tree registration',
    icon: React.createElement(TreePine, { className: "w-5 h-5" }),
    color: 'teal'
  },
  'single-tree-registration': {
    allowsSpecies: true,
    allowsMultipleSpecies: false,
    requiresSpecies: true,
    allowsTreeRegistration: true,
    requiresTreeRegistration: true,
    allowsSampleTrees: false,
    geoJSONType: 'Point',
    description: 'Single tree registration allows single species and requires tree registration',
    icon: React.createElement(Target, { className: "w-5 h-5" }),
    color: 'blue'
  },
  'fencing': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fencing intervention for site protection',
    icon: React.createElement(Shield, { className: "w-5 h-5" }),
    color: 'amber'
  },
  'fire-patrol': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire patrol and prevention activities',
    icon: React.createElement(Eye, { className: "w-5 h-5" }),
    color: 'orange'
  },
  'fire-suppression': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Fire suppression activities',
    icon: React.createElement(Flame, { className: "w-5 h-5" }),
    color: 'red'
  },
  'firebreaks': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Creating firebreaks for fire prevention',
    icon: React.createElement(Zap, { className: "w-5 h-5" }),
    color: 'yellow'
  },
  'grass-suppression': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Grass suppression activities',
    icon: React.createElement(Scissors, { className: "w-5 h-5" }),
    color: 'lime'
  },
  'liberating-regenerant': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Liberating natural regenerants',
    icon: React.createElement(Unlock, { className: "w-5 h-5" }),
    color: 'cyan'
  },
  'maintenance': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'General maintenance activities',
    icon: React.createElement(Wrench, { className: "w-5 h-5" }),
    color: 'purple'
  },
  'marking-regenerant': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Marking natural regenerants',
    icon: React.createElement(MapPin, { className: "w-5 h-5" }),
    color: 'pink'
  },
  'other-intervention': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Other types of interventions',
    icon: React.createElement(MoreHorizontal, { className: "w-5 h-5" }),
    color: 'slate'
  },
  'soil-improvement': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Soil improvement activities',
    icon: React.createElement(Mountain, { className: "w-5 h-5" }),
    color: 'stone'
  },
  'stop-tree-harvesting': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Stopping tree harvesting activities',
    icon: React.createElement(Ban, { className: "w-5 h-5" }),
    color: 'red'
  },
  'assisting-seed-rain': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Assisting natural seed rain processes',
    icon: React.createElement(CloudRain, { className: "w-5 h-5" }),
    color: 'sky'
  },
  'control-livestock': {
    allowsSpecies: false,
    allowsMultipleSpecies: false,
    requiresSpecies: false,
    allowsTreeRegistration: false,
    requiresTreeRegistration: false,
    allowsSampleTrees: false,
    description: 'Livestock control measures',
    icon: React.createElement(Dog, { className: "w-5 h-5" }),
    color: 'brown'
  }
};
