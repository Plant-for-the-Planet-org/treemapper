import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Slug must contain only lowercase letters, numbers, and hyphens';
        },
      },
    });
  };
}

export function IsGeoJSON(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isGeoJSON',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Optional field
          
          try {
            // Check if it's a valid object
            if (typeof value !== 'object' || value === null) {
              return false;
            }

            // Check if it has a type property
            if (!value.type || typeof value.type !== 'string') {
              return false;
            }

            // Handle Feature objects
            if (value.type === 'Feature') {
              return validateFeature(value);
            }
            
            // Handle FeatureCollection objects
            if (value.type === 'FeatureCollection') {
              return validateFeatureCollection(value);
            }
            
            // Handle Geometry objects directly
            if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(value.type)) {
              return validateGeometry(value);
            }

            return false;
          } catch (error) {
            console.error('GeoJSON validation error:', error);
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid GeoJSON format';
        },
      },
    });
  };
}

// Validate Feature object
function validateFeature(feature: any): boolean {
  // Feature must have geometry and properties
  if (!feature.hasOwnProperty('geometry')) {
    return false;
  }

  // Geometry can be null or a valid geometry object
  if (feature.geometry === null) {
    return true;
  }

  return validateGeometry(feature.geometry);
}

// Validate FeatureCollection object
function validateFeatureCollection(featureCollection: any): boolean {
  if (!Array.isArray(featureCollection.features)) {
    return false;
  }

  return featureCollection.features.every((feature: any) => 
    feature.type === 'Feature' && validateFeature(feature)
  );
}

// Validate Geometry object
function validateGeometry(geometry: any): boolean {
  if (!geometry.type || !geometry.coordinates) {
    return false;
  }

  const validGeometryTypes = [
    'Point', 'LineString', 'Polygon', 'MultiPoint', 
    'MultiLineString', 'MultiPolygon', 'GeometryCollection'
  ];

  if (!validGeometryTypes.includes(geometry.type)) {
    return false;
  }

  // Basic coordinate validation based on geometry type
  switch (geometry.type) {
    case 'Point':
      return validatePointCoordinates(geometry.coordinates);
    
    case 'LineString':
      return Array.isArray(geometry.coordinates) && 
             geometry.coordinates.length >= 2 &&
             geometry.coordinates.every(validatePointCoordinates);
    
    case 'Polygon':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.length >= 1 &&
             geometry.coordinates.every((ring: any) => 
               Array.isArray(ring) && 
               ring.length >= 4 && 
               ring.every(validatePointCoordinates) &&
               // First and last coordinates should be the same (closed ring)
               coordinatesEqual(ring[0], ring[ring.length - 1])
             );
    
    case 'MultiPoint':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.every(validatePointCoordinates);
    
    case 'MultiLineString':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.every((lineString: any) =>
               Array.isArray(lineString) && 
               lineString.length >= 2 &&
               lineString.every(validatePointCoordinates)
             );
    
    case 'MultiPolygon':
      return Array.isArray(geometry.coordinates) &&
             geometry.coordinates.every((polygon: any) =>
               Array.isArray(polygon) &&
               polygon.length >= 1 &&
               polygon.every((ring: any) => 
                 Array.isArray(ring) && 
                 ring.length >= 4 && 
                 ring.every(validatePointCoordinates) &&
                 coordinatesEqual(ring[0], ring[ring.length - 1])
               )
             );
    
    case 'GeometryCollection':
      return Array.isArray(geometry.geometries) &&
             geometry.geometries.every(validateGeometry);
    
    default:
      return false;
  }
}

// Validate point coordinates [longitude, latitude] or [longitude, latitude, altitude]
function validatePointCoordinates(coordinates: any): boolean {
  if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > 3) {
    return false;
  }

  const [lng, lat, alt] = coordinates;

  // Validate longitude (-180 to 180)
  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    return false;
  }

  // Validate latitude (-90 to 90)
  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    return false;
  }

  // Validate altitude if present
  if (alt !== undefined && typeof alt !== 'number') {
    return false;
  }

  return true;
}

// Check if two coordinate arrays are equal
function coordinatesEqual(coord1: any, coord2: any): boolean {
  if (!Array.isArray(coord1) || !Array.isArray(coord2)) {
    return false;
  }
  
  if (coord1.length !== coord2.length) {
    return false;
  }

  return coord1.every((val, index) => Math.abs(val - coord2[index]) < 1e-10);
}