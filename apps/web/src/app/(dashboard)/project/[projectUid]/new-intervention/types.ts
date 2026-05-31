export interface InterventionSpeciesEntry {
  uid: string;
  scientificSpeciesId?: number | null;
  scientificSpeciesUid?: string | null;
  speciesName?: string;
  isUnknown: boolean;
  otherSpeciesName?: string | null;
  count: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface FormData {
  projectId: string | null;
  siteId: string | null;
  selectedSite: any | null;
  interventionType: string;
  species: InterventionSpeciesEntry[];
  description: string;
  geoJSON: any;
  geoJSONFile: File | null;
  applyToEntireSite: boolean;
  isPlanningMode: boolean;
  // Planning mode: register many single trees in one go.
  // All marked trees share the single selected species. Tags are built from
  // tagPrefix plus an auto-incrementing number (starting at 1).
  multiSingleTree: boolean;
  multiTreePoints: MarkedTreePoint[];
  treeDetails: {
    tag: string;
    tagPrefix: string;
    height: string;
    width: string;
    plantingDate: string;
  };
  image: File | null;
}

export interface MarkedTreePoint {
  longitude: number;
  latitude: number;
}

export interface ValidationErrors {
  [key: string]: string;
}
