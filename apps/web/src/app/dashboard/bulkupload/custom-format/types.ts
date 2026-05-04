export interface Species {
    name: string;
    count: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    needsGeoJSON: boolean;
}

export interface Intervention {
    id: string;
    beneficiary: string;
    plantDate: string;
    species: Species[];
    geojson: any | null;
    geojsonFileName: string | null;
    isEdited: boolean;
    validation: ValidationResult;
}

export interface UploadProgress {
    current: number;
    total: number;
}

export interface UploadRecord {
    intervention: Intervention;
    payload?: any;
    response?: any;
    error?: string;
}

export interface UploadResult {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    successRecords: UploadRecord[];
    errorRecords: UploadRecord[];
}
