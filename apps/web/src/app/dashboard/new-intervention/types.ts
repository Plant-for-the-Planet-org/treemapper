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
  treeDetails: {
    tag: string;
    height: string;
    width: string;
    plantingDate: string;
  };
  image: File | null;
}

export interface ValidationErrors {
  [key: string]: string;
}
