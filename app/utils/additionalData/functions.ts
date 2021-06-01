import { getMetadata } from '../../repositories/additionalData';

export const formatAdditionalDetails = async (additionalDetails: any, sampleTrees: any = null) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  const metadata = await getMetadata();

  if (Array.isArray(metadata) && metadata.length > 0) {
    for (let detail of metadata) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  if (Array.isArray(additionalDetails) && additionalDetails.length > 0) {
    for (let detail of additionalDetails) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  if (Array.isArray(sampleTrees) && sampleTrees.length > 0) {
    for (const i in sampleTrees) {
      for (let detail of sampleTrees[i].additionalDetails) {
        formattedDetails[`${detail.accessType}`][`ST${Number(i) + 1}-${detail.key}`] = detail.value;
      }
    }
  }
  return formattedDetails;
};

export const formatSampleTreeAdditionalDetails = (additionalDetails: any, index: number) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  for (let detail of additionalDetails) {
    formattedDetails[`${detail.accessType}`][`ST${Number(index) + 1}-${detail.key}`] = detail.value;
  }
  return formattedDetails;
};
