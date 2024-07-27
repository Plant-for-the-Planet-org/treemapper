import {
    diameterMaxCm,
    diameterMaxInch,
    diameterMinCm,
    diameterMinInch,
    footToMeter,
    heightMaxFoot,
    heightMaxM,
    heightMinFoot,
    heightMinM,
    inchToCm,
    maxHeightDiameterRatio,
    meterToCentimeter,
    minHeightDiameterRatio,
  } from 'src/utils/constants/appConstant';
  
  // regex for diameter and height to validate the same
  export const measurementRegex = /^\d{0,5}(\.\d{1,3})?$/;

  // checks if diameter or height passed as measurement is valid
  export const getIsValidMeasurement = (measurement: string) => measurementRegex.test(measurement);
  
  // returns the converted diameter by checking the user's country metric
  export const getConvertedDiameter = (
    treeDiameter: string | number,
    isNonISUCountry: boolean = false,
  ) => {
    return isNonISUCountry ? Number(treeDiameter) * inchToCm : Number(treeDiameter);
  };
  
  // returns the converted height by checking the user's country metric
  export const getConvertedHeight = (
    treeHeight: string | number,
    isNonISUCountry: boolean = false,
  ) => {
    return isNonISUCountry ? Number(treeHeight) * footToMeter : Number(treeHeight);
  };
  
  // returns min diameter value based on the country
  export const getDiameterMinValue = (isNonISUCountry: boolean = false) =>
    isNonISUCountry ? diameterMinInch : diameterMinCm;
  
  // returns max diameter value based on the country
  export const getDiameterMaxValue = (isNonISUCountry: boolean = false) =>
    isNonISUCountry ? diameterMaxInch : diameterMaxCm;
  
  // returns min height value based on the country
  export const getHeightMinValue = (isNonISUCountry: boolean = false) =>
    isNonISUCountry ? heightMinFoot : heightMinM;
  
  // returns max height value based on the country
  export const getHeightMaxValue = (isNonISUCountry: boolean = false) =>
    isNonISUCountry ? heightMaxFoot : heightMaxM;
  
  // checks if given diameter value is in min and max range and returns boolean
  // value for the same
  export const getIsDiameterInRange = (diameter: string | number, isNonISUCountry: boolean = false) =>
    !diameter ||
    Number(diameter) < getDiameterMinValue(isNonISUCountry) ||
    Number(diameter) > getDiameterMaxValue(isNonISUCountry);
  
  // checks if given height value is in min and max range and returns boolean
  // value for the same
  export const getIsHeightInRange = (height: string | number, isNonISUCountry: boolean = false) =>
    !height ||
    Number(height) < getHeightMinValue(isNonISUCountry) ||
    Number(height) > getHeightMaxValue(isNonISUCountry);
  
  interface IRatioParams {
    height: string | number;
    diameter: string | number;
    isNonISUCountry: boolean;
  }
  // checks and return [boolean] whether height to diameter ratio is in between the min and max ratio range
  export const getIsMeasurementRatioCorrect = ({
    height,
    diameter,
    isNonISUCountry = false,
  }: IRatioParams): boolean => {
    height = getConvertedHeight(height, isNonISUCountry);
    diameter = getConvertedDiameter(diameter, isNonISUCountry);
    const currentHeightDiameterRatio = (height * meterToCentimeter) / diameter;
  
    const roundOffRatio = Math.round(currentHeightDiameterRatio * 100) / 100;
  
    return roundOffRatio >= minHeightDiameterRatio && roundOffRatio <= maxHeightDiameterRatio;
  };
  