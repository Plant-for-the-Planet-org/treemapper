export class ProjectResponseDto {
  id: number;
  guid: string;
  discr: string;
  createdById: number;
  slug: string;
  purpose?: string;
  projectName: string;
  projectType?: string;
  ecosystem?: string;
  projectScale?: string;
  target?: number;
  projectWebsite?: string;
  description?: string;
  classification?: string;
  image?: string;
  videoUrl?: string;
  country?: string;
  location?: any;
  originalGeometry?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  url?: string;
  linkText?: string;
  isActive: boolean;
  isPublic: boolean;
  intensity?: string;
  revisionPeriodicityLevel?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  createdBy?: {
    id: number;
    name?: string;
    email: string;
  };
  memberCount?: number;
  siteCount?: number;
}
