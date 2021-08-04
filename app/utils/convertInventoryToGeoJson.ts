import { appAdditionalDataForGeoJSON, getFormattedMetadata } from './additionalData/functions';

export default async function getGeoJsonData(inventoryData: any) {
  let featureList;
  let appAdditionalDetails: any = {};
  const metadata = getFormattedMetadata([...inventoryData.additionalDetails]);
  if (inventoryData) {
    appAdditionalDetails = await appAdditionalDataForGeoJSON({ data: inventoryData });
    metadata.app = { ...metadata.app, ...appAdditionalDetails };
  }

  if (
    inventoryData.polygons[0].coordinates.length === 1 &&
    inventoryData.polygons[0].isPolygonComplete
  ) {
    featureList = [
      {
        type: 'Feature',
        properties: {
          isPolygonComplete: inventoryData.polygons[0].isPolygonComplete,
          ...metadata,
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
          ...metadata,
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
        let appAdditionalDetails: any = [];
        const metadata = getFormattedMetadata([...sampleTree.additionalDetails]);

        appAdditionalDetails = await appAdditionalDataForGeoJSON({
          data: sampleTree,
          isSampleTree: true,
        });
        metadata.app = { ...metadata.app, ...appAdditionalDetails };

        featureList.push({
          type: 'Feature',
          properties: { ...metadata },
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
