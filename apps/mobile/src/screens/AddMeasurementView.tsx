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
import { usePostHog } from 'posthog-react-native'
import {
  captureAnalyticsEvent,
  AnalyticsEvents,
  incrementSessionCounter,
  trackFirstTimeEvent,
} from 'src/utils/analytics'
import useFormAnalytics from 'src/hooks/analytics/useFormAnalytics'
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
  const posthog = usePostHog()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  // The measurement form is the last step before a tree exists, so its
  // abandonment rate is the closest thing to "how many trees do we lose".
  const formAnalytics = useFormAnalytics('tree_measurement', {
    intervention_key: Intervention?.intervention_key,
  })

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
    formAnalytics.fieldChanged('height')
    setHeightErrorMessage('');
    const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
    const finalText = text.replace(/,/g, '.');
    const isValid = regex.test(finalText)
    // Ensure there is at most one decimal point
    if (isValid) {
      setHeight(text);
      const convertedHeight = height ? getConvertedHeight(text, isNonISUCountry) : 0;
      if (convertedHeight < DBHInMeter) {
        setDiameterLabel(i18next.t('label.measurement_basal_diameter'));
      } else {
        setDiameterLabel(i18next.t('label.measurement_DBH'));
      }
    } else {
      setHeightErrorMessage('Please provide the correct height.')
    }
  };

  const handleDiameterChange = (text: string) => {
    formAnalytics.fieldChanged('diameter')
    setWidthErrorMessage('');
    const regex = /^(?!0*(\.0+)?$)(\d+(\.\d+)?|\.\d+)$/;
    const finalText = text.replace(/,/g, '.');
    const isValid = regex.test(finalText)
    if (isValid) {
      setWidth(text);
    } else {
      setWidthErrorMessage('Please provide the correct diameter.')
    }
    // Ensure there is at most one decimal point
  };
  



  const onSubmit = () => {
    const updatedHeight = height.replace(/,/g, '.');
    const updatedWidth = width.replace(/,/g, '.');
    const validationObject = measurementValidation(updatedHeight, updatedWidth, isNonISUCountry);
    const { diameterErrorMessage, heightErrorMessage, isRatioCorrect } = validationObject;
    setHeightErrorMessage(heightErrorMessage)
    setWidthErrorMessage(diameterErrorMessage)
    let isTagIdValid = false;
    if(tagEnable){
      if(tagId.length===0){
        setTagIdErrorMessage(i18next.t('label.select_species_tag_id_required'));
      }else{
        const regex = /^[a-zA-Z0-9 -]+$/;
        const isValidId = regex.test(tagId) 
        if(!isValidId){
          setTagIdErrorMessage(i18next.t('Please input a valid id.'));
        }else{
          isTagIdValid = true
        }
      }
    }else{
      setTagIdErrorMessage('');
      isTagIdValid = true;
    }

    // Section 5: which fields people get wrong, and how often. Recorded per
    // attempt, so a field someone fights with three times reads differently
    // from one they fix immediately.
    if (heightErrorMessage) {
      formAnalytics.validationFailed('height', 'invalid_height')
    }
    if (diameterErrorMessage) {
      formAnalytics.validationFailed('diameter', 'invalid_diameter')
    }
    if (!isTagIdValid) {
      formAnalytics.validationFailed(
        'tag_id',
        tagId.length === 0 ? 'required' : 'invalid_format',
      )
    }

    // if all fields are valid then updates the specie data in DB
    if (!diameterErrorMessage && !heightErrorMessage && isTagIdValid) {
      if (isRatioCorrect) {
        submitDetails();
      } else {
        // Measurements outside the expected height-to-diameter ratio. Not an
        // error, but the app is questioning what the user typed, so it is a
        // friction point worth counting.
        formAnalytics.validationFailed('height_diameter_ratio', 'outside_optimal_range')
        setShowOptimalAlert(true);
      }
    }
  }



  const acceptOptimalAlert=()=>{
    setShowOptimalAlert(false)
  }

  const rejectOptimalAlert=()=>{
    setShowOptimalAlert(false)
    submitDetails();
  }

  const submitDetails = async () => {
    const updatedHeight = height.replace(/,/g, '.');
    const updatedWidth = width.replace(/,/g, '.');
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
        updatedWidth,
        isNonISUCountry
      ),
      specie_height: getConvertedHeight(
        updatedHeight,
        isNonISUCountry
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
      },
      fix_required: 'NO'
    }
    const result = await addSampleTrees(Intervention.form_id, treeDetails)
    if (result) {
      captureAnalyticsEvent(posthog, AnalyticsEvents.TREE_RECORDED, {
        intervention_id: Intervention.intervention_id,
        tree_type: treeDetails.tree_type,
        species_name: treeDetails.specie_name,
      })
      // The tree is now in Realm. Separate from TREE_RECORDED so the journey
      // in section 2 can show "created" and "saved" as distinct steps, and a
      // gap between them points straight at the local write.
      captureAnalyticsEvent(posthog, AnalyticsEvents.TREE_SAVED, {
        intervention_id: Intervention?.intervention_id,
        tree_type: treeDetails.tree_type,
        has_tag: Boolean(treeDetails.tag_id),
        has_image: Boolean(treeDetails.image_url),
        location_accuracy: treeDetails.location_accuracy,
      })
      incrementSessionCounter('trees_created')
      // Section 10: activation. Fires once per install, ever.
      trackFirstTimeEvent(AnalyticsEvents.FIRST_TREE_CREATED, {
        intervention_key: Intervention?.intervention_key,
      })
      formAnalytics.complete({ tree_type: treeDetails.tree_type })
    } else {
      formAnalytics.validationFailed('submit', 'realm_write_failed')
      errorHaptic()
      toast.show("Error occurred while registering sample tree.")
    }
    navigation.navigate('ReviewTreeDetails', { detailsCompleted: true, id: Intervention.intervention_id })
  }






  return (
    <SafeAreaView style={styles.container}>
      <AvoidSoftInputView
        avoidOffset={0}
        showAnimationDuration={200}
        style={styles.container}>
        <Header label="Add Measurements" />
        <View style={styles.wrapper}>
          <OutlinedTextInput
            placeholder={i18next.t('label.select_species_height')}
            changeHandler={handleHeightChange}
            autoFocus
            keyboardType={'decimal-pad'}
            trailingText={isNonISUCountry ? i18next.t('label.select_species_feet') : 'm'}
            analyticsField="height"
            analyticsForm="tree_measurement"
            onFieldFocus={() => formAnalytics.fieldFocused('height')}
            onFieldBlur={() => formAnalytics.fieldBlurred('height', height.length > 0)}
            errMsg={heightErrorMessage} />
          <OutlinedTextInput
            placeholder={diameterLabel}
            changeHandler={handleDiameterChange}
            keyboardType={'decimal-pad'}
            trailingText={isNonISUCountry ? i18next.t('label.select_species_inches') : 'cm'}
            errMsg={widthErrorMessage}
            analyticsField="diameter"
            analyticsForm="tree_measurement"
            onFieldFocus={() => formAnalytics.fieldFocused('diameter')}
            onFieldBlur={() => formAnalytics.fieldBlurred('diameter', width.length > 0)}
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
          onPressPrimaryBtn={acceptOptimalAlert}
          onPressSecondaryBtn={rejectOptimalAlert}
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
