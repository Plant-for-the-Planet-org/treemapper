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
export interface ProjectWithUserRoleI {
  id: string;
  projectName: string;
  projectType: string;
  ecosystem: string;
  projectScale: string;
  target: number;
  projectWebsite: string;
  description: string;
  isPublic: boolean;
  createdById: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  metadata: Record<string, any>; // Empty object or with custom properties
  location: GeoJSONGeometryI;
  userRole: 'owner' | 'admin' | 'contributor' | 'viewer'; // Based on your projectRoleEnum
}

// Array of projects response
type ProjectsResponseI = ProjectWithUserRoleI[];