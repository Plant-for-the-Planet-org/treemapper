import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
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
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'
import { v4 as uuidv4 } from 'uuid'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
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

const AddMeasurment = () => {
  const realm = useRealm()
  const SampleTreeData = useSelector((state: RootState) => state.sampleTree)
  const Intervention = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, SampleTreeData.form_id);
  const [showOptimalAlert, setOptimalAlert] = useState(false)
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [tagEnable, setTagEnabled] = useState(false)
  const [tagId, setTagId] = useState('')
  const { addSampleTrees } = useInterventionManagement()
  const [diameterLabel, setDiameterLabel] = useState<string>(
    i18next.t('label.measurement_basal_diameter'),
  );
  const [heightErrorMessage, setHeightErrorMessgae] = useState('')
  const [widthErrorMessage, setWidthErrorMessage] = useState('')
  const [tagIdErrorMessage, settagIdErrorMessage] = useState('')
  const Country = useSelector((state: RootState) => state.userState.country)

  const id = uuidv4()

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const onSubmit = () => {

    const diameterMinValue = nonISUCountries.includes(Country)
      ? diameterMinInch
      : diameterMinCm;
    const diameterMaxValue = nonISUCountries.includes(Country)
      ? diameterMaxInch
      : diameterMaxCm;

    const heightMinValue = nonISUCountries.includes(Country) ? heightMinFoot : heightMinM;
    const heightMaxValue = nonISUCountries.includes(Country) ? heightMaxFoot : heightMaxM;
    const dimensionRegex = /^\d{0,5}(\.\d{1,3})?$/;



    const heightValidation = validateNumber(height, 'Height', 'height')
    const widthValidation = validateNumber(width, 'Diameter', 'width')

    if (heightValidation.hasError || widthValidation.errorMessage) {
      setHeightErrorMessgae(heightValidation.errorMessage)
      setWidthErrorMessage(widthValidation.errorMessage)
      return;
    }


    let isDiameterValid = false;
    let isHeightValid = false;
    let isTagIdValid = false;

    // sets diameter error if diameter is not in between the minimum and maximum values or is invalid input
    if (!width || Number(width) < diameterMinValue || Number(width) > diameterMaxValue) {
      setWidthErrorMessage(
        i18next.t('label.select_species_diameter_more_than_error', {
          minValue: diameterMinValue,
          maxValue: diameterMaxValue,
        }),
      );
    } else if (!dimensionRegex.test(width)) {
      setWidthErrorMessage(i18next.t('label.select_species_diameter_invalid'));
    } else {
      setWidthErrorMessage('');
      isDiameterValid = true
    }


    // sets height error if height is not in between the minimum and maximum values or is invalid input
    if (!height || Number(height) < heightMinValue || Number(height) > heightMaxValue) {
      setHeightErrorMessgae(
        i18next.t('label.select_species_height_more_than_error', {
          minValue: heightMinValue,
          maxValue: heightMaxValue,
        }),
      );
    } else if (!dimensionRegex.test(height)) {
      setHeightErrorMessgae(i18next.t('label.select_species_height_invalid'));
    } else {
      setHeightErrorMessgae('');
      isHeightValid = true;
    }

    // checks if tag id is present and sets error accordingly
    if (tagEnable && !tagId) {
      settagIdErrorMessage(i18next.t('label.select_species_tag_id_required'));
    } else {
      settagIdErrorMessage('');
      isTagIdValid = true;
    }

    // if all fields are valid then updates the specie data in DB
    if (isDiameterValid && isHeightValid && isTagIdValid) {
      const isRatioCorrect = getIsMeasurementRatioCorrect({
        height: getConvertedHeight(),
        diameter: getConvertedDiameter(),
        isNonISUCountry: nonISUCountries.includes(Country)
      });

      if (isRatioCorrect) {
        submitDetails();
      } else {
        setOptimalAlert(true)
      }
    }

  }


  const handleOptimalalert = (p: boolean) => {
    if (p) {
      setOptimalAlert(false)
    } else {
      setOptimalAlert(false)
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
    const { lat, long, accuracy } = await getUserLocation()
    const treeDetails: SampleTree = {
      tree_id: id,
      species_guid: SampleTreeData.current_species.guid,
      intervention_id: Intervention.form_id,
      count: SampleTreeData.current_species.count,
      latitude: SampleTreeData.coordinates[0][1],
      longitude: SampleTreeData.coordinates[0][0],
      device_latitude: lat ? lat : 0,
      device_longitude: long ? long : 0,
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
      hid: '',
      local_name: SampleTreeData.current_species.aliases,
    }
    await addSampleTrees(Intervention.form_id, treeDetails)
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
    setHeightErrorMessgae('');
    setHeight(t.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
    if (convertedHeight < DBHInMeter) {
      setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
    } else {
      setDiameterLabel(i18next.t('label.measurement_DBH'));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
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
          switchHandler={setTagEnabled}
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
