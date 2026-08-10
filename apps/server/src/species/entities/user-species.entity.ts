import { Species } from "./species.entity";

export class UserSpecies {
  id: string;
  userId: string;
  speciesId: string;
  localName?: string;
  customImage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  
  // Relations
  species?: Species;
}