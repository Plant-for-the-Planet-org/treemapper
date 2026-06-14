import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import React, { useMemo, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useObject } from '@realm/react'
import { useToast } from 'react-native-toast-notifications'
import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import FormFieldRenderer from 'src/components/projectForm/FormFieldRenderer'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RealmSchema } from 'src/types/enum/db.enum'
import {
  FormSection,
  FormValues,
  ProjectFormData,
} from 'src/types/interface/projectForm.interface'
import { InterventionData } from 'src/types/interface/slice.interface'
import useFormsData from 'src/hooks/realm/useFormsData'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import {
  evaluateFieldVisibility,
  getAllFields,
  parseFormSections,
} from 'src/utils/helpers/formHelper/formConditions'
import { buildFormMetaEntries } from 'src/utils/helpers/formHelper/buildFormMetaData'

// Fills a form in one of two modes:
// - 'prefill': edit and save the reusable default values for the form.
// - 'intervention': review/edit prefilled values for a specific intervention
//   and write the answers into the intervention's private metadata.
const FormDetailView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'FormDetail'>>()
  const { formId, mode, interventionId = '' } = route.params
  const toast = useToast()

  const form = useObject<ProjectFormData>(RealmSchema.ProjectForm, formId)
  const intervention = useObject<InterventionData>(
    RealmSchema.Intervention,
    interventionId,
  )
  const { saveFormPrefill, getFormPrefill } = useFormsData()
  const { updateInterventionMetaData } = useInterventionManagement()

  const sections: FormSection[] = useMemo(
    () => parseFormSections(form?.sections || '[]'),
    [form?.sections],
  )

  // Seed values from the saved prefill default.
  const [values, setValues] = useState<FormValues>(() => getFormPrefill(formId))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const onChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }))
    }
  }

  // Validate only visible, required fields (hidden fields are skipped).
  const validate = (): boolean => {
    const next: Record<string, string> = {}
    getAllFields(sections).forEach((field) => {
      if (!evaluateFieldVisibility(field, values)) return
      if (field.required) {
        const v = values[field.id]
        if (v == null || String(v).trim() === '') {
          next[field.id] = 'This field is required'
        }
      }
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.show('Please complete the required fields')
      return
    }

    if (mode === 'prefill') {
      await saveFormPrefill(formId, values)
      toast.show('Saved')
      navigation.goBack()
      return
    }

    // intervention mode: merge answers into meta_data (public/private per
    // each field's visibility) and persist.
    if (!intervention) {
      toast.show('Intervention not found')
      return
    }
    let parsed: any = {}
    try {
      parsed = JSON.parse(intervention.meta_data || '{}')
    } catch (error) {
      parsed = {}
    }
    const formEntries = buildFormMetaEntries(formId, sections, values)
    const updated = {
      ...parsed,
      private: { ...(parsed.private || {}), ...formEntries.private },
      public: { ...(parsed.public || {}), ...formEntries.public },
    }
    await updateInterventionMetaData(interventionId, JSON.stringify(updated))
    toast.show('Form saved')
    navigation.goBack()
  }

  if (!form) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Form" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Form not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label={form.name} note={mode === 'prefill' ? 'Prefill defaults' : undefined} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {!!form.description && <Text style={styles.description}>{form.description}</Text>}
          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              {!!section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
              {!!section.description && (
                <Text style={styles.sectionDesc}>{section.description}</Text>
              )}
              {(section.fields || []).map((field) =>
                evaluateFieldVisibility(field, values) ? (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={values[field.id] ?? ''}
                    error={errors[field.id]}
                    onChange={onChange}
                  />
                ) : null,
              )}
            </View>
          ))}
          <View style={styles.footer} />
        </ScrollView>
        <CustomButton
          label={mode === 'prefill' ? 'Save defaults' : 'Save form'}
          pressHandler={handleSave}
          containerStyle={styles.btnContainer}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default FormDetailView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  description: {
    width: '90%',
    alignSelf: 'center',
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginVertical: 10,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    width: '90%',
    alignSelf: 'center',
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    marginTop: 10,
  },
  sectionDesc: {
    width: '90%',
    alignSelf: 'center',
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginBottom: 4,
  },
  footer: {
    height: 120,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
  },
})
