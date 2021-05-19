export const formatAdditionalDetails = (additionalDetails: any) => {
  let formattedDetails: any = { public: {}, private: {}, app: {} };

  if (Array.isArray(additionalDetails) && additionalDetails.length > 0) {
    for (let detail of additionalDetails) {
      formattedDetails[`${detail.accessType}`][`${detail.key}`] = detail.value;
    }
  }
  return formattedDetails;
};
