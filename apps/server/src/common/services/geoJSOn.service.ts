import { BadRequestException } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number] | [number, number, number]; // [lng, lat] or [lng, lat, elevation]
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: Array<[number, number] | [number, number, number]>;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[number, number] | [number, number, number]>>;
}

export interface GeoJSONMultiPoint {
  type: 'MultiPoint';
  coordinates: Array<[number, number] | [number, number, number]>;
}

export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: Array<Array<[number, number] | [number, number, number]>>;
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: Array<Array<Array<[number, number] | [number, number, number]>>>;
}

export interface GeoJSONGeometryCollection {
  type: 'GeometryCollection';
  geometries: GeoJSONGeometry[];
}

export type GeoJSONGeometry = 
  | GeoJSONPoint 
  | GeoJSONLineString 
  | GeoJSONPolygon 
  | GeoJSONMultiPoint 
  | GeoJSONMultiLineString 
  | GeoJSONMultiPolygon 
  | GeoJSONGeometryCollection;

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry | null;
  properties: Record<string, any> | null;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type GeoJSONInput = GeoJSONGeometry | GeoJSONFeature | GeoJSONFeatureCollection;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const GEOMETRY_TYPES = [
  'Point', 
  'LineString', 
  'Polygon', 
  'MultiPoint', 
  'MultiLineString', 
  'MultiPolygon', 
  'GeometryCollection'
] as const;

const COORDINATE_BOUNDS = {
  LONGITUDE: { MIN: -180, MAX: 180 },
  LATITUDE: { MIN: -90, MAX: 90 }
} as const;

// ============================================================================
// IMPROVED TRANSFORMER CLASS
// ============================================================================

export class GeoJSONTransformer {
  
  /**
   * Main method to transform any GeoJSON input to a valid geometry for PostGIS
   * @param locationInput - Any GeoJSON input (Geometry, Feature, or FeatureCollection)
   * @param options - Transform options
   * @returns Valid GeoJSON Geometry or null
   */
  static transformToGeometry(
    locationInput: unknown, 
    options: {
      allowNull?: boolean;
      validateCoordinates?: boolean;
      extractFirstFeature?: boolean;
    } = {}
  ): GeoJSONGeometry | null {
    
    const { 
      allowNull = false, 
      validateCoordinates = true, 
      extractFirstFeature = true 
    } = options;

    // Handle null/undefined
    if (!locationInput) {
      if (allowNull) return null;
      throw new BadRequestException('Location data is required');
    }

    // Ensure input is an object
    if (typeof locationInput !== 'object') {
      throw new BadRequestException('Location input must be a valid GeoJSON object');
    }

    const input = locationInput as Record<string, any>;

    // Validate has type property
    if (!input.type || typeof input.type !== 'string') {
      throw new BadRequestException('GeoJSON object must have a valid "type" property');
    }

    let geometry: GeoJSONGeometry;

    try {
      // Handle different GeoJSON types
      switch (input.type) {
        case 'Feature':
          geometry = this.extractGeometryFromFeature(input as GeoJSONFeature);
          break;
          
        case 'FeatureCollection':
          geometry = this.extractGeometryFromFeatureCollection(
            input as GeoJSONFeatureCollection, 
            extractFirstFeature
          );
          break;
          
        default:
          // Assume it's a geometry object
          geometry = this.validateGeometryObject(input as GeoJSONGeometry);
          break;
      }

      // Validate coordinates if requested
      if (validateCoordinates) {
        this.validateCoordinates(geometry);
      }

      return geometry;

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process GeoJSON: ${error.message}`);
    }
  }

  /**
   * Extract geometry from a GeoJSON Feature
   */
  private static extractGeometryFromFeature(feature: GeoJSONFeature): GeoJSONGeometry {
    if (!feature.geometry) {
      throw new BadRequestException('Feature must contain a geometry object');
    }

    if (typeof feature.geometry !== 'object') {
      throw new BadRequestException('Feature geometry must be a valid object');
    }

    return this.validateGeometryObject(feature.geometry);
  }

  /**
   * Extract geometry from a GeoJSON FeatureCollection
   */
  private static extractGeometryFromFeatureCollection(
    collection: GeoJSONFeatureCollection, 
    extractFirst: boolean = true
  ): GeoJSONGeometry {
    
    if (!Array.isArray(collection.features)) {
      throw new BadRequestException('FeatureCollection must contain a features array');
    }

    if (collection.features.length === 0) {
      throw new BadRequestException('FeatureCollection must contain at least one feature');
    }

    if (!extractFirst && collection.features.length > 1) {
      throw new BadRequestException(
        `FeatureCollection contains ${collection.features.length} features. ` +
        'Only single feature collections are supported, or set extractFirstFeature to true'
      );
    }

    const firstFeature = collection.features[0];
    return this.extractGeometryFromFeature(firstFeature);
  }

  /**
   * Validate that an object is a valid GeoJSON geometry
   */
  private static validateGeometryObject(geometry: any): GeoJSONGeometry {
    if (!geometry || typeof geometry !== 'object') {
      throw new BadRequestException('Geometry must be a valid object');
    }

    if (!GEOMETRY_TYPES.includes(geometry.type)) {
      throw new BadRequestException(
        `Invalid geometry type: "${geometry.type}". ` +
        `Must be one of: ${GEOMETRY_TYPES.join(', ')}`
      );
    }

    // Special handling for GeometryCollection
    if (geometry.type === 'GeometryCollection') {
      if (!Array.isArray(geometry.geometries)) {
        throw new BadRequestException('GeometryCollection must contain a geometries array');
      }
      
      // Recursively validate each geometry in the collection
      geometry.geometries.forEach((geom: any, index: number) => {
        try {
          this.validateGeometryObject(geom);
        } catch (error) {
          throw new BadRequestException(
            `Invalid geometry at index ${index} in GeometryCollection: ${error.message}`
          );
        }
      });
      
      return geometry as GeoJSONGeometryCollection;
    }

    // All other geometry types must have coordinates
    if (!geometry.coordinates) {
      throw new BadRequestException(`${geometry.type} geometry must contain coordinates`);
    }

    if (!Array.isArray(geometry.coordinates)) {
      throw new BadRequestException(`${geometry.type} coordinates must be an array`);
    }

    return geometry as GeoJSONGeometry;
  }

  /**
   * Validate coordinate values and structure
   */
  private static validateCoordinates(geometry: GeoJSONGeometry): void {
    switch (geometry.type) {
      case 'Point':
        this.validatePointCoordinates(geometry.coordinates);
        break;
        
      case 'LineString':
        this.validateLineStringCoordinates(geometry.coordinates);
        break;
        
      case 'Polygon':
        this.validatePolygonCoordinates(geometry.coordinates);
        break;
        
      case 'MultiPoint':
        geometry.coordinates.forEach((coords, index) => {
          try {
            this.validatePointCoordinates(coords);
          } catch (error) {
            throw new BadRequestException(`Invalid coordinates at MultiPoint index ${index}: ${error.message}`);
          }
        });
        break;
        
      case 'MultiLineString':
        geometry.coordinates.forEach((lineCoords, index) => {
          try {
            this.validateLineStringCoordinates(lineCoords);
          } catch (error) {
            throw new BadRequestException(`Invalid coordinates at MultiLineString index ${index}: ${error.message}`);
          }
        });
        break;
        
      case 'MultiPolygon':
        geometry.coordinates.forEach((polygonCoords, index) => {
          try {
            this.validatePolygonCoordinates(polygonCoords);
          } catch (error) {
            throw new BadRequestException(`Invalid coordinates at MultiPolygon index ${index}: ${error.message}`);
          }
        });
        break;
        
      case 'GeometryCollection':
        geometry.geometries.forEach((geom, index) => {
          try {
            this.validateCoordinates(geom);
          } catch (error) {
            throw new BadRequestException(`Invalid geometry at GeometryCollection index ${index}: ${error.message}`);
          }
        });
        break;
    }
  }

  /**
   * Validate Point coordinates: [lng, lat] or [lng, lat, elevation]
   */
  private static validatePointCoordinates(coords: any): void {
    if (!Array.isArray(coords)) {
      throw new BadRequestException('Point coordinates must be an array');
    }

    if (coords.length < 2 || coords.length > 3) {
      throw new BadRequestException(
        'Point coordinates must be [longitude, latitude] or [longitude, latitude, elevation]'
      );
    }

    const [lng, lat, elevation] = coords;

    // Validate longitude
    if (typeof lng !== 'number' || !isFinite(lng)) {
      throw new BadRequestException(`Invalid longitude: ${lng}. Must be a finite number`);
    }
    
    if (lng < COORDINATE_BOUNDS.LONGITUDE.MIN || lng > COORDINATE_BOUNDS.LONGITUDE.MAX) {
      throw new BadRequestException(
        `Longitude ${lng} is out of bounds. Must be between ${COORDINATE_BOUNDS.LONGITUDE.MIN} and ${COORDINATE_BOUNDS.LONGITUDE.MAX}`
      );
    }

    // Validate latitude
    if (typeof lat !== 'number' || !isFinite(lat)) {
      throw new BadRequestException(`Invalid latitude: ${lat}. Must be a finite number`);
    }
    
    if (lat < COORDINATE_BOUNDS.LATITUDE.MIN || lat > COORDINATE_BOUNDS.LATITUDE.MAX) {
      throw new BadRequestException(
        `Latitude ${lat} is out of bounds. Must be between ${COORDINATE_BOUNDS.LATITUDE.MIN} and ${COORDINATE_BOUNDS.LATITUDE.MAX}`
      );
    }

    // Validate elevation if present
    if (elevation !== undefined) {
      if (typeof elevation !== 'number' || !isFinite(elevation)) {
        throw new BadRequestException(`Invalid elevation: ${elevation}. Must be a finite number`);
      }
    }
  }

  /**
   * Validate LineString coordinates
   */
  private static validateLineStringCoordinates(coords: any): void {
    if (!Array.isArray(coords)) {
      throw new BadRequestException('LineString coordinates must be an array');
    }

    if (coords.length < 2) {
      throw new BadRequestException('LineString must have at least 2 coordinate pairs');
    }

    coords.forEach((coord: any, index: number) => {
      try {
        this.validatePointCoordinates(coord);
      } catch (error) {
        throw new BadRequestException(`Invalid coordinates at position ${index}: ${error.message}`);
      }
    });
  }

  /**
   * Validate Polygon coordinates
   */
  private static validatePolygonCoordinates(coords: any): void {
    if (!Array.isArray(coords)) {
      throw new BadRequestException('Polygon coordinates must be an array');
    }

    if (coords.length === 0) {
      throw new BadRequestException('Polygon must have at least one ring');
    }

    coords.forEach((ring: any, ringIndex: number) => {
      if (!Array.isArray(ring)) {
        throw new BadRequestException(`Polygon ring ${ringIndex} must be an array`);
      }

      if (ring.length < 4) {
        throw new BadRequestException(
          `Polygon ring ${ringIndex} must have at least 4 coordinate pairs (to form a closed ring)`
        );
      }

      // Validate each coordinate in the ring
      ring.forEach((coord: any, coordIndex: number) => {
        try {
          this.validatePointCoordinates(coord);
        } catch (error) {
          throw new BadRequestException(
            `Invalid coordinates in ring ${ringIndex} at position ${coordIndex}: ${error.message}`
          );
        }
      });

      // Check if ring is closed (first and last coordinates should be the same)
      const first = ring[0];
      const last = ring[ring.length - 1];
      
      if (!Array.isArray(first) || !Array.isArray(last)) {
        throw new BadRequestException(`Invalid coordinate format in ring ${ringIndex}`);
      }

      if (first[0] !== last[0] || first[1] !== last[1]) {
        throw new BadRequestException(
          `Polygon ring ${ringIndex} is not closed. First and last coordinates must be identical`
        );
      }
    });
  }

  /**
   * Calculate bounding box for any geometry
   * Returns [minLng, minLat, maxLng, maxLat]
   */
  static getBoundingBox(geometry: GeoJSONGeometry): [number, number, number, number] {
    const coordinates = this.extractAllCoordinates(geometry);
    
    if (coordinates.length === 0) {
      throw new BadRequestException('Cannot calculate bounding box for geometry with no coordinates');
    }

    const longitudes = coordinates.map(coord => coord[0]);
    const latitudes = coordinates.map(coord => coord[1]);

    return [
      Math.min(...longitudes), // minLng
      Math.min(...latitudes),  // minLat
      Math.max(...longitudes), // maxLng
      Math.max(...latitudes)   // maxLat
    ];
  }

  /**
   * Extract all coordinate pairs from any geometry type
   */
  private static extractAllCoordinates(geometry: GeoJSONGeometry): Array<[number, number]> {
    const coords: Array<[number, number]> = [];

    const addCoords = (coordArray: any) => {
      if (Array.isArray(coordArray)) {
        if (typeof coordArray[0] === 'number') {
          // It's a coordinate pair [lng, lat]
          coords.push([coordArray[0], coordArray[1]]);
        } else {
          // It's nested, recurse
          coordArray.forEach(addCoords);
        }
      }
    };

    switch (geometry.type) {
      case 'GeometryCollection':
        geometry.geometries.forEach(geom => {
          coords.push(...this.extractAllCoordinates(geom));
        });
        break;
      default:
        addCoords(geometry.coordinates);
        break;
    }

    return coords;
  }

  /**
   * Convenience method that matches your original function signature
   */
  static getGeoJSONForPostGIS(locationInput: unknown): GeoJSONGeometry | null {
    return this.transformToGeometry(locationInput, {
      allowNull: true,
      validateCoordinates: true,
      extractFirstFeature: true
    });
  }
}