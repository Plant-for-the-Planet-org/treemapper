import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useToast } from 'react-native-toast-notifications'
import Header from 'src/components/common/Header'
import CustomTextInput from 'src/components/common/CustomTextInput'
import CustomButton from 'src/components/common/CustomButton'
import Switch from 'src/components/common/Switch'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { RootStackParamList } from 'src/types/type/navigation.type'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { errorHaptic } from 'src/utils/helpers/hapticFeedbackHelper'

// Adds one extra field to a single intervention from its review screen. Two
// targets, because the review screen shows two lists: 'additional' appends a
// FormElement to Intervention.additional_data, 'metadata' writes a key/value
// entry into Intervention.meta_data. Both end up in the upload payload's
// metadata, so the difference is only how the review screen groups them.
//
// Only reachable while the intervention is still INITIALIZED. There is no API
// to change an intervention after it uploads, so a field added later would
// never leave the device.
const AddInterventionDataView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AddInterventionData'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const toast = useToast()
  const { addInterventionAdditionalField, addInterventionMetadataEntry } =
    useInterventionManagement()

  const interventionId = route.params?.interventionId ?? ''
  const target = route.params?.target ?? 'additional'

  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (saving) {
      return
    }
    if (label.trim() === '') {
      errorHaptic()
      toast.show('Label cannot be empty')
      return
    }
    if (value.trim() === '') {
      errorHaptic()
      toast.show('Value cannot be empty')
      return
    }
    setSaving(true)
    const visibility = isPublic ? 'public' : 'private'
    const done =
      target === 'metadata'
        ? await addInterventionMetadataEntry(interventionId, {
            label: label.trim(),
            value: value.trim(),
            visibility,
          })
        : await addInterventionAdditionalField(interventionId, {
            label: label.trim(),
            value: value.trim(),
            unit: unit.trim(),
            visibility,
          })
    if (!done) {
      setSaving(false)
      errorHaptic()
      toast.show('Could not add this field, please try again')
      return
    }
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header label="" />
      <Text style={styles.headerLabel}>
        {target === 'metadata' ? 'Add metadata' : 'Add field'}
      </Text>
      <Text style={styles.note}>
        This is saved on this intervention only.
      </Text>
      <CustomTextInput label="Label" onChangeHandler={setLabel} value={label} />
      <CustomTextInput label="Value" onChangeHandler={setValue} value={value} />
      {target === 'additional' && (
        <CustomTextInput
          label="Unit (optional)"
          onChangeHandler={setUnit}
          value={unit}
        />
      )}
      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Make this data public</Text>
        <Switch
          value={isPublic}
          onValueChange={() => setIsPublic(!isPublic)}
          disabled={false}
        />
      </View>
      <CustomButton
        label={target === 'metadata' ? 'Add metadata' : 'Add field'}
        containerStyle={styles.btnContainer}
        pressHandler={handleSubmit}
      />
    </SafeAreaView>
  )
}

export default AddInterventionDataView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  headerLabel: {
    fontSize: 28,
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    color: Colors.DARK_TEXT_COLOR,
    marginLeft: 20,
  },
  note: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
    paddingBottom: 20,
  },
  switchContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    marginRight: 16,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 20,
  },
})
