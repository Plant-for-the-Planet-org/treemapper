import * as turf from '@turf/turf';

export const findAreaInHa = (polygon) => {
    if (!polygon) {
        return null
    }
    const areaInSquareMeters = turf.area(polygon);
    const areaInHectares = areaInSquareMeters / 10000;
    return areaInHectares.toFixed(2)
}


