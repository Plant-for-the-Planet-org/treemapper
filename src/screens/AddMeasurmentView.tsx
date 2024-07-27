import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import TagSwitch from 'src/components/formBuilder/TagSwitch'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { RootState } from 'src/store'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { InterventionData, SampleTree, ValidationResult } from 'src/types/interface/slice.interface'
import { v4 as uuidv4 } from 'uuid'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput";
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'
import getUserLocation from 'src/utils/helpers/getUserLocation'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { DBHInMeter, diameterMaxCm, diameterMaxInch, diameterMinCm, diameterMinInch, footToMeter, heightMaxFoot, heightMaxM, heightMinFoot, heightMinM, inchToCm, nonISUCountries } from 'src/utils/constants/appConstant'
import { getIsMeasurementRatioCorrect } from 'src/utils/constants/mesaurments'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { errotHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useToast } from 'react-native-toast-notifications'

const AddMeasurment = () => {
  const realm = useRealm()
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const Intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, SampleTreeData.form_id);
  const [showOptimalAlert, setShowOptimalAlert] = useState(false)
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [tagEnable, setTagEnable] = useState(false)
  const [tagId, setTagId] = useState('')
  const { addSampleTrees } = useInterventionManagement()
  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );
  const [heightErrorMessage, setHeightErrorMessage] = useState('')
  const [widthErrorMessage, setWidthErrorMessage] = useState('')
  const [tagIdErrorMessage, setTagIdErrorMessage] = useState('')
  const Country = useSelector((state: RootState) => state.userState.country)

  const id = uuidv4()
  const toast = useToast()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(true);
    };
  }, [])


  const onSubmit = () => {
    const {
      diameterMinValue,
      diameterMaxValue,
      heightMinValue,
      heightMaxValue
    } = getDimensionValues(Country);

    const dimensionRegex = /^\d{0,5}(\.\d{1,3})?$/;

    const heightValidation = validateNumber(height, 'Height', 'height');
    const widthValidation = validateNumber(width, 'Diameter', 'width');

    if (handleValidationErrors(heightValidation, widthValidation)) return;

    const isDiameterValid = validateDimension(width, diameterMinValue, diameterMaxValue, dimensionRegex, 'diameter');
    const isHeightValid = validateDimension(height, heightMinValue, heightMaxValue, dimensionRegex, 'height');
    const isTagIdValid = validateTagId(tagEnable, tagId);

    if (isDiameterValid && isHeightValid && isTagIdValid) {
      handleValidSubmission();
    }
  };

  // Helper Functions

  const getDimensionValues = (country: string) => {
    const diameterMinValue = nonISUCountries.includes(country) ? diameterMinInch : diameterMinCm;
    const diameterMaxValue = nonISUCountries.includes(country) ? diameterMaxInch : diameterMaxCm;
    const heightMinValue = nonISUCountries.includes(country) ? heightMinFoot : heightMinM;
    const heightMaxValue = nonISUCountries.includes(country) ? heightMaxFoot : heightMaxM;
    return { diameterMinValue, diameterMaxValue, heightMinValue, heightMaxValue };
  };

  const handleValidationErrors = (heightValidation: ValidationResult, widthValidation: ValidationResult) => {
    if (heightValidation.hasError || widthValidation.hasError) {
      setHeightErrorMessage(heightValidation.errorMessage);
      setWidthErrorMessage(widthValidation.errorMessage);
      return true;
    }
    return false;
  };

  const validateDimension = (value: string, minValue: number, maxValue: number, regex: RegExp, dimensionType: string) => {
    if (!value || Number(value) < minValue || Number(value) > maxValue) {
      setWidthErrorMessage(i18next.t(`label.select_species_${dimensionType}_more_than_error`, { minValue, maxValue }));
      return false;
    }
    if (!regex.test(value)) {
      setWidthErrorMessage(i18next.t(`label.select_species_${dimensionType}_invalid`));
      return false;
    }
    setWidthErrorMessage('');
    return true;
  };

  const validateTagId = (isTagEnabled: boolean, tagId: string) => {
    if (isTagEnabled && !tagId) {
      setTagIdErrorMessage(i18next.t('label.select_species_tag_id_required'));
      return false;
    }
    setTagIdErrorMessage('');
    return true;
  };

  const handleValidSubmission = () => {
    const isRatioCorrect = getIsMeasurementRatioCorrect({
      height: getConvertedHeight(),
      diameter: getConvertedDiameter(),
      isNonISUCountry: nonISUCountries.includes(Country)
    });

    if (isRatioCorrect) {
      submitDetails();
    } else {
      setShowOptimalAlert(true);
    }
  };

  const handleOptimalalert = (p: boolean) => {
    if (p) {
      setShowOptimalAlert(false)
    } else {
      setShowOptimalAlert(false)
      submitDetails();
    }
  }

  // returns the converted diameter by checking the user's country metric
  const getConvertedDiameter = (treeDiameter: string = width) => {
    return nonISUCountries.includes(Country)
      ? Number(treeDiameter) * inchToCm
      : Number(treeDiameter);
  };




  const submitDetails = async () => {
    const { lat, long, accuracy } = getUserLocation()
    const treeDetails: SampleTree = {
      tree_id: id,
      species_guid: SampleTreeData.current_species.guid,
      intervention_id: Intervention.form_id,
      count: SampleTreeData.current_species.count,
      latitude: SampleTreeData.coordinates[0][1],
      longitude: SampleTreeData.coordinates[0][0],
      device_latitude: lat || 0,
      device_longitude: long || 0,
      location_accuracy: String(accuracy),
      image_url: SampleTreeData.image_url,
      cdn_image_url: '',
      specie_name: SampleTreeData.current_species.scientificName,
      specie_diameter: Number(width),
      specie_height: Number(height),
      tag_id: tagId,
      plantation_date: new Date().getTime(),
      status_complete: true,
      location_id: '',
      tree_type: setUpIntervention(Intervention.intervention_key).has_sample_trees ? 'sample' : 'single',
      additional_details: '',
      app_meta_data: '',
      sloc_id: '',
      status: 'INIIALIZED',
      hid: '',
      local_name: SampleTreeData.current_species.aliases,
      parent_id: '',
      history: [],
      remeasurement_dates: {
        sampleTreeId: '',
        created: Date.now(),
        lastMeasurement: 0,
        remeasureBy: 0,
        nextMeasurement: 0
      },
      remeasurement_requires: false,
      is_alive: true,
      image_data: {
        latitude: SampleTreeData.coordinates[0][1],
        longitude: SampleTreeData.coordinates[0][0],
        imageUrl: SampleTreeData.image_url,
        cdnImageUrl: '',
        currentloclat: 0,
        currentloclong: 0,
        isImageUploaded: false,
        coordinateID: ''
      }
    }
    const result = await addSampleTrees(Intervention.form_id, treeDetails)
    if (!result) {
      errotHaptic()
      toast.show("Error occured while registering sample tree.")
    }
    navigation.navigate('ReviewTreeDetails', { detailsCompleted: true, id: Intervention.intervention_id })
  }

  // returns the converted height by checking the user's country metric
  const getConvertedHeight = (treeHeight: string = height) => {
    return nonISUCountries.includes(Country)
      ? Number(treeHeight) * footToMeter
      : Number(treeHeight);
  };


  const onHeightChange = (t: string) => {
    const convertedHeight = t ? getConvertedHeight(t) : 0;
    setHeightErrorMessage('');
    setHeight(t.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
    if (convertedHeight < DBHInMeter) {
      setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
    } else {
      setDiameterLabel(i18next.t('label.measurement_DBH'));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AvoidSoftInputView
        avoidOffset={0}
        style={styles.container}>
        <Header label="Add Measurments" />
        <View style={styles.wrapper}>
          <OutlinedTextInput
            placeholder={i18next.t('label.select_species_height')}
            changeHandler={onHeightChange}
            autoFocus
            keyboardType={'decimal-pad'}
            trailingtext={nonISUCountries.includes(Country)
              ? i18next.t('label.select_species_feet')
              : 'm'} errMsg={heightErrorMessage} />
          <OutlinedTextInput
            placeholder={diameterLabel}
            changeHandler={(text: string) => {
              setWidthErrorMessage('');
              setWidth(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
            }}
            keyboardType={'decimal-pad'}
            trailingtext={nonISUCountries.includes(Country)
              ? i18next.t('label.select_species_inches')
              : 'cm'} errMsg={widthErrorMessage}
          />
          <TagSwitch
            placeholder={'Tag Tree'}
            changeHandler={setTagId}
            keyboardType={'default'}
            trailingtext={''}
            switchEnable={tagEnable}
            description={i18next.t('label.tree_tag_note')}
            switchHandler={setTagEnable}
            errMsg={tagIdErrorMessage}
          />
          <CustomButton
            label="Continue"
            containerStyle={styles.btnContainer}
            pressHandler={onSubmit}
          />
        </View>
        <AlertModal
          showSecondaryButton
          visible={showOptimalAlert}
          onPressPrimaryBtn={handleOptimalalert}
          onPressSecondaryBtn={handleOptimalalert}
          heading={i18next.t('label.not_optimal_ratio')}
          secondaryBtnText={i18next.t('label.continue')}
          primaryBtnText={i18next.t('label.check_again')}
          message={i18next.t('label.not_optimal_ratio_message')}
        />
      </AvoidSoftInputView>
    </SafeAreaView>
  )
}

export default AddMeasurment

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    width: '95%',
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 20,
  },
})
