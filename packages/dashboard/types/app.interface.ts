// GeoJSON types
interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[number, number]>>; // Array of linear rings (first is exterior, rest are holes)
}

// Union type for possible geometry types
type GeoJSONGeometryI = GeoJSONPoint | GeoJSONPolygon;

// Project response interface


// Array of projects response
type ProjectsResponseI = ProjectWithUserRoleI[];
export interface UserInterface {
  uid: string;
  email: string;
  authName: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  displayName?: string;
  avatar?: string;
  slug?: string;
  type: 'individual' | 'organization' | 'education' | 'tpo' | 'student'
  country?: string;
  url?: string;
  isPrivate: boolean;
  bio?: string;
  locale: string;
  isActive: boolean;
  createdAt: string;
  migratedAt?: string;
}

export interface ProjectWithUserRoleI {
  uid: string;
  createdById: number;
  slug: string;
  purpose: string | null;
  projectName: string;
  projectType: string | null;
  ecosystem: string | null;
  projectScale: string | null;
  target: number | null;
  projectWebsite: string | null;
  description: string | null;
  classification: string | null;
  image: string | null;
  videoUrl: string | null;
  country: string | null; // 2-character country code
  location: unknown | null; // PostGIS geometry - typically handled as GeoJSON on frontend
  originalGeometry: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  url: string | null;
  linkText: string | null;
  isActive: boolean;
  isPublic: boolean;
  intensity: string | null;
  revisionPeriodicityLevel: string | null;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  "userRole": string
}