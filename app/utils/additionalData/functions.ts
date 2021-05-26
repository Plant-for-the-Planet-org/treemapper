export const formatAdditionalDetails = (additionalDetails: any, sampleTrees: any = null) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  if (Array.isArray(additionalDetails) && additionalDetails.length > 0) {
    for (let detail of additionalDetails) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  if (Array.isArray(sampleTrees) && sampleTrees.length > 0) {
    for (const i in sampleTrees) {
      for (let detail of sampleTrees[i].additionalDetails) {
        formattedDetails[`${detail.accessType}`][`ST${i + 1}-${detail.key}`] = detail.value;
      }
    }
  }
  return formattedDetails;
};
