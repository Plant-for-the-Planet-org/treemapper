export default function getGeoJsonData(inventoryData: any) {
  let featureList;
  if (
    inventoryData.polygons[0].coordinates.length === 1 &&
    inventoryData.polygons[0].isPolygonComplete
  ) {
    featureList = [
      {
        type: 'Feature',
        properties: {
          isPolygonComplete: inventoryData.polygons[0].isPolygonComplete,
        },
        geometry: {
          type: 'Point',
          coordinates: [
            inventoryData.polygons[0].coordinates[0].longitude,
            inventoryData.polygons[0].coordinates[0].latitude,
          ],
        },
      },
    ];
  } else {
    featureList = inventoryData.polygons.map((onePolygon: any) => {
      return {
        type: 'Feature',
        properties: {
          isPolygonComplete: onePolygon.isPolygonComplete,
        },
        geometry: {
          type: 'LineString',
          coordinates: onePolygon.coordinates.map((oneCoordinate: any) => [
            oneCoordinate.longitude,
            oneCoordinate.latitude,
          ]),
        },
      };
    });
    if (inventoryData.sampleTrees.length > 0) {
      for (const sampleTree of inventoryData.sampleTrees) {
        featureList.push({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [sampleTree.longitude, sampleTree.latitude],
          },
        });
      }
    }
  }
  let geoJSONData = {
    type: 'FeatureCollection',
    features: featureList,
  };

  return geoJSONData;
}
