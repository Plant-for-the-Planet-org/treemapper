import { InterventionData, SampleTree } from 'src/types/interface/slice.interface';
import { getDeviceDetails } from '../appHelper/getAdditionalData';


export function convertTreeDetailsToGeoJSON(treeDetails: SampleTree) {
  const geoJSONData = {
    type: 'Feature',
    geometry: {
      type: "Point",
      coordinates: [
        treeDetails.longitude,
        treeDetails.latitude,
      ]
    },
    properties: {
      "device": {
        ...getDeviceDetails(),
        latitude: treeDetails.device_latitude,
        longitude: treeDetails.device_longitude,
        accuracy: treeDetails.location_accuracy,
      },
      "treeDetails": {
        ...treeDetails
      }
    },
  };
  return geoJSONData;
}


export function convertInterventionDetailsToGeoJSON(intervention: InterventionData) {
  const features = [];
  const geoJSONData = {
    type: 'Feature',
    geometry: {
      type: "Polygon",
      coordinates: [JSON.parse(intervention.location.coordinates)]
    },
    properties: {
      "metaData": JSON.parse(intervention.meta_data),
      "intervention": {
        ...intervention,
        sample_trees: intervention.sample_trees.map(el => el.tree_id)
      }
    }
  };
  features.push(geoJSONData);

  intervention.sample_trees.forEach(treeDetails => {
    const result = convertTreeDetailsToGeoJSON(treeDetails);
    features.push(result)
  });

  return features;
}
