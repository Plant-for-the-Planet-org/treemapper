export class Species {
  id: string;
  scientificName: string;
  commonName?: string;
  description?: string;
  defaultImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}