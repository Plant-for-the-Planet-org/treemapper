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
import { InterventionData, SampleTree } from 'src/types/interface/slice.interface'
import { v4 as uuid } from 'uuid'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { AvoidSoftInput, AvoidSoftInputView } from "react-native-avoid-softinput";
import getUserLocation from 'src/utils/helpers/getUserLocation'
import i18next from 'i18next'
import AlertModal from 'src/components/common/AlertModal'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { DBHInMeter, meterToFoot, nonISUCountries } from 'src/utils/constants/appConstant'
import { getConvertedDiameter, getConvertedHeight } from 'src/utils/constants/measurements'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import { useToast } from 'react-native-toast-notifications'
import { measurementValidation } from 'src/utils/constants/measurementValidation'

const AddMeasurement = () => {
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
  const [isNonISUCountry, setIsNonISUCountry] = useState(false);

  const id = uuid()
  const toast = useToast()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    setCountry();
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, [])

  const setCountry = () => {
    setIsNonISUCountry(nonISUCountries.includes(Country));
  };

  const handleHeightChange = (text: string) => {
    setHeightErrorMessage('');
    // Replace commas with dots for consistency
    const sanitizedText = text.replace(/,/g, '.');

    // Allow only digits and a single decimal point
    const validHeight = sanitizedText.replace(/[^0-9.]/g, '');

    // Ensure there is at most one decimal point
    const decimalCount = validHeight.split('.').length - 1;
    if (decimalCount <= 1) {
      setHeight(validHeight);
      const convertedHeight = height ? getConvertedHeight(validHeight, isNonISUCountry) : 0;
      if (convertedHeight < DBHInMeter) {
        setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
      } else {
        setDiameterLabel(i18next.t('label.measurement_DBH'));
      }
    }
  };

  const handleDiameterChange = (text: string) => {
    setWidthErrorMessage('');
    // Replace commas with dots for consistency
    const sanitizedText = text.replace(/,/g, '.');

    // Allow only digits and a single decimal point
    const validDiameter = sanitizedText.replace(/[^0-9.]/g, '');

    // Ensure there is at most one decimal point
    const decimalCount = validDiameter.split('.').length - 1;
    if (decimalCount <= 1) {
      setWidth(validDiameter);
    }
  };



  const onSubmit = () => {
    const validationObject = measurementValidation(height, width, isNonISUCountry);
    const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;
    setHeightErrorMessage(heightErrorMessage)
    setWidthErrorMessage(diameterErrorMessage)
    let isTagIdValid = false;
    // checks if tag id is present and sets error accordingly
    if (tagEnable && !tagId) {
      setTagIdErrorMessage(i18next.t('label.select_species_tag_id_required'));
    } else {
      setTagIdErrorMessage('');
      isTagIdValid = true;
    }
    // if all fields are valid then updates the specie data in DB
    if (!diameterErrorMessage && !heightErrorMessage && isTagIdValid) {
      if (isRatioCorrect) {
        submitDetails();
      } else {
        setShowOptimalAlert(true);
      }
    }
  }






  const handleOptimalAlert = (p: boolean) => {
    if (p) {
      setShowOptimalAlert(false)
    } else {
      setShowOptimalAlert(false)
      submitDetails();
    }
  }

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
      specie_diameter: getConvertedDiameter(
        width,
        isNonISUCountry,
      ),
      specie_height: getConvertedHeight(
        height,
        isNonISUCountry,
      ),
      tag_id: tagId,
      plantation_date: new Date().getTime(),
      status_complete: true,
      location_id: '',
      tree_type: setUpIntervention(Intervention.intervention_key).has_sample_trees ? 'sample' : 'single',
      additional_details: '',
      app_meta_data: '',
      sloc_id: '',
      status: 'INITIALIZED',
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
      errorHaptic()
      toast.show("Error occurred while registering sample tree.")
    }
    navigation.navigate('ReviewTreeDetails', { detailsCompleted: true, id: Intervention.intervention_id })
  }






  return (
    <SafeAreaView style={styles.container}>
      <AvoidSoftInputView
        avoidOffset={0}
        style={styles.container}>
        <Header label="Add Measurements" />
        <View style={styles.wrapper}>
          <OutlinedTextInput
            placeholder={i18next.t('label.select_species_height')}
            changeHandler={handleHeightChange}
            autoFocus
            keyboardType={'decimal-pad'}
            trailingText={isNonISUCountry ? i18next.t('label.select_species_feet') : 'm'}
            errMsg={heightErrorMessage} />
          <OutlinedTextInput
            placeholder={diameterLabel}
            changeHandler={handleDiameterChange}
            keyboardType={'decimal-pad'}
            trailingText={isNonISUCountry ? i18next.t('label.select_species_inches') : 'cm'}
            errMsg={widthErrorMessage}
            info={i18next.t('label.measurement_diameter_info', {
              height: isNonISUCountry
                ? Math.round(DBHInMeter * meterToFoot * 1000) / 1000
                : DBHInMeter,
              unit: isNonISUCountry ? i18next.t('label.select_species_inches') : 'm',
            })}
          />
          <TagSwitch
            placeholder={'Tag Tree'}
            changeHandler={setTagId}
            keyboardType={'default'}
            trailingText={''}
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
          onPressPrimaryBtn={handleOptimalAlert}
          onPressSecondaryBtn={handleOptimalAlert}
          heading={i18next.t('label.not_optimal_ratio')}
          secondaryBtnText={i18next.t('label.continue')}
          primaryBtnText={i18next.t('label.check_again')}
          message={i18next.t('label.not_optimal_ratio_message')}
        />
      </AvoidSoftInputView>
    </SafeAreaView>
  )
}

export default AddMeasurement

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
