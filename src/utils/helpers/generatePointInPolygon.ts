/**
 * Generates a random point coordinate within a given polygon.
 *
 * @param {Array} polygon - An array of coordinate arrays representing the polygon.
 * @param {number} index - An index to differentiate points for polygons with similar coordinates.
 * @returns {Array} The random point coordinate [longitude, latitude].
 */
export const getRandomPointInPolygon = (polygon) => {
  // Calculate the bounding box of the polygon
  const bounds = polygon.reduce(
    (prev, curr) => {
      const [lon, lat] = curr;
      return {
        minLon: Math.min(prev.minLon, lon),
        maxLon: Math.max(prev.maxLon, lon),
        minLat: Math.min(prev.minLat, lat),
        maxLat: Math.max(prev.maxLat, lat),
      };
    },
    { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
  );

  // Helper function to check if a point is inside the polygon
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1]))
          && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Generate random points until we find one inside the polygon
  let attempts = 0;
  const maxAttempts = 1000;  // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    const randomLon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
    const randomLat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    
    if (isPointInPolygon([randomLon, randomLat], polygon)) {
      return [randomLon, randomLat, 0];  // Adding 0 for elevation to match input format
    }
    
    attempts++;
  }
  
  // If we couldn't find a point after max attempts, return center of bounding box
  return [
    (bounds.minLon + bounds.maxLon) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
    0
  ];
};
