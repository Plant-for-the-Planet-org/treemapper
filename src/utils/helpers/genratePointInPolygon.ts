/**
 * Generates a random point coordinate within a given polygon.
 *
 * @param {Array} polygon - An array of coordinate arrays representing the polygon.
 * @returns {Array} The random point coordinate [longitude, latitude].
 */
export const  getRandomPointInPolygon=(polygon)=>{
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
  
    // Generate a random point within the bounding box
    let randomPoint;
    let isInPolygon = false;
    while (!isInPolygon) {
      const lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon);
      const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      randomPoint = [lon, lat];
  
      // Check if the random point is within the polygon
      isInPolygon = isPointInPolygon(randomPoint, polygon);
    }
  
    return randomPoint;
  }
  
  /**
   * Checks if a point is within a given polygon.
   *
   * @param {Array} point - The point coordinate [longitude, latitude].
   * @param {Array} polygon - An array of coordinate arrays representing the polygon.
   * @returns {boolean} True if the point is within the polygon, false otherwise.
   */
  function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let isInside = false;
  
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[j];
  
      const intersect =
        y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
  
      if (intersect) isInside = !isInside;
    }
  
    return isInside;
  }
  