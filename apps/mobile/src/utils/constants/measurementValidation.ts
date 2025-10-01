import i18next from 'i18next';
import {
  getDiameterMaxValue,
  getDiameterMinValue,
  getHeightMaxValue,
  getHeightMinValue,
  getIsDiameterInRange,
  getIsHeightInRange,
  getIsMeasurementRatioCorrect,
  getIsValidMeasurement,
} from 'src/utils/constants/measurements';

/**
 * Checks if diameter is not in between the minimum and maximum values or is
 * invalid input and return the validation message accordingly
 * @param diameter - diameter value to be validated
 * @param isNonISUCountry - used to convert the diameter value to the correct unit
 * @returns if the diameter is not valid then returns message for the same
 *          else returns empty string
 */
export const diameterValidation = (diameter: string | number, isNonISUCountry: boolean = false) => {
  let diameterErrorMessage = '';
  // sets diameter error if diameter is not in between the minimum and
  // maximum values or is invalid input
  if (getIsDiameterInRange(diameter, isNonISUCountry)) {
    diameterErrorMessage = i18next.t('label.select_species_diameter_more_than_error', {
      minValue: getDiameterMinValue(isNonISUCountry),
      maxValue: getDiameterMaxValue(isNonISUCountry),
    });
  } else if (!getIsValidMeasurement(diameter.toString())) {
    diameterErrorMessage = i18next.t('label.select_species_diameter_invalid');
  }
  return diameterErrorMessage;
};

/**
 * Checks if height is not in between the minimum and maximum values or is
 * invalid input and return the validation message accordingly
 * @param height - height value to be validated
 * @param isNonISUCountry - used to convert the height value to the correct unit
 * @returns if the height is not valid then returns message for the same
 *          else returns empty string
 */
export const heightValidation = (height: string | number, isNonISUCountry: boolean = false) => {
  let heightErrorMessage = '';
  // sets height error if height is not in between the minimum and
  // maximum values or is invalid input
  if (getIsHeightInRange(height, isNonISUCountry)) {
    heightErrorMessage = i18next.t('label.select_species_height_more_than_error', {
      minValue: getHeightMinValue(isNonISUCountry),
      maxValue: getHeightMaxValue(isNonISUCountry),
    });
  } else if (!getIsValidMeasurement(height.toString())) {
    heightErrorMessage = i18next.t('label.select_species_height_invalid');
  }

  return heightErrorMessage;
};

/**
 * Validates the diameter and height values which are entered by the user,
 * also check the height:diameter ratio and returns the validation message
 *  @param height - height value to be validated
 *  @param diameter - diameter value to be validated
 * @param isNonISUCountry - used to convert the height value to the correct unit
 * @returns if the height or diameter is not valid then returns message for the
 *          same else returns empty string
 */
export const measurementValidation = (
  height: string | number,
  diameter: string | number,
  isNonISUCountry: boolean = false,
) => {
  const validationObject = {
    diameterErrorMessage: '',
    heightErrorMessage: '',
    isRatioCorrect: false,
  };
  const diameterErrorMessage = diameterValidation(diameter, isNonISUCountry);
  const heightErrorMessage = heightValidation(height, isNonISUCountry);

  validationObject.diameterErrorMessage = diameterErrorMessage;
  validationObject.heightErrorMessage = heightErrorMessage;

  if (diameterErrorMessage || heightErrorMessage) {
    return validationObject;
  }

  const isRatioCorrect = getIsMeasurementRatioCorrect({
    height,
    diameter,
    isNonISUCountry,
  });

  return {
    ...validationObject,
    isRatioCorrect,
  };
};
