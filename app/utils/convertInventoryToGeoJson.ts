import { appAdditionalDataForGeoJSON, getFormattedMetadata } from './additionalData/functions';

interface IGeoJsonDataParams {
  inventoryData: any;
  includeInventoryId?: boolean;
  ignoreSampleTrees?: boolean;
}

export default async function getGeoJsonData({
  inventoryData,
  includeInventoryId = false,
  ignoreSampleTrees = false,
}: IGeoJsonDataParams) {
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

    // includes inventory id if asked for
    if (includeInventoryId) {
      featureList[0].properties.inventoryId = inventoryData.inventory_id;
    }
  } else {
    featureList = inventoryData.polygons.map((onePolygon: any) => {
      const feature = {
        type: 'Feature',
        properties: {
          ...metadata,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            onePolygon.coordinates.map((oneCoordinate: any) => [
              oneCoordinate.longitude,
              oneCoordinate.latitude,
            ]),
          ],
        },
      };
      console.log('feature', feature.geometry.coordinates);
      // includes inventory id if asked for
      if (includeInventoryId) {
        feature.properties.inventoryId = inventoryData.inventory_id;
      }
      return feature;
    });
    if (inventoryData.sampleTrees.length > 0 && !ignoreSampleTrees) {
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
