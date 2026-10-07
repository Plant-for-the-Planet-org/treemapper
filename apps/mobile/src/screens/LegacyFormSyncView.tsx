import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useObject, useQuery } from '@realm/react'
import { useToast } from 'react-native-toast-notifications'
import NetInfo from '@react-native-community/netinfo'
import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import CustomDropDown from 'src/components/common/CustomDropDown'
import { Colors, Typography } from 'src/utils/constants'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RealmSchema } from 'src/types/enum/db.enum'
import {
  DropdownData,
  IAdditionalDetailsForm,
  ProjectInterface,
} from 'src/types/interface/app.interface'
import { AllIntervention } from 'src/utils/constants/knownIntervention'
import {
  convertLegacyForm,
  isSyncable,
} from 'src/utils/helpers/formHelper/legacyFormConverter'
import { createProjectForm } from 'src/api/api.fetch'
import useLegacyFormMigration from 'src/hooks/realm/useLegacyFormMigration'
import useFormsData from 'src/hooks/realm/useFormsData'

type SiteAssignment = 'all' | 'none' | 'specific'
type InterventionAssignment = 'all' | 'specific'

// A form can only be created by someone the server would let create one:
// owner/admin of the project, or a member carrying `manage_form`. Mirrors
// ProjectPermissionsGuard so the picker does not offer a project the write
// would bounce on. An unknown role (a device that has not fetched projects
// since the field was added) is offered anyway: the server decides, and
// hiding every project would be the worse mistake of the two.
const canCreateForms = (project: ProjectInterface): boolean => {
  const role = project.role
  if (!role) return true
  if (role === 'owner' || role === 'admin') return true
  return (project.extra_permissions || []).includes('manage_form')
}

// Moves one Additional Data form into a project's Forms. Everything the
// dashboard builder asks for is asked here, because the form goes live the
// moment it lands: it is published, not parked as a draft.
const LegacyFormSyncView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'LegacyFormSync'>>()
  const formId = route.params?.formId || ''
  const toast = useToast()
  const { markFormMigrated } = useLegacyFormMigration()
  const { cacheProjectForm } = useFormsData()

  const localForm = useObject<IAdditionalDetailsForm>(
    RealmSchema.AdditionalDetailsForm,
    formId,
  )
  const projects = useQuery<ProjectInterface>(RealmSchema.Projects)

  const writableProjects = useMemo(
    () => [...projects].filter(canCreateForms),
    [projects],
  )

  const converted = useMemo(
    () => (localForm ? convertLegacyForm(localForm) : null),
    [localForm],
  )

  const [name, setName] = useState(localForm?.title || '')
  const [description, setDescription] = useState(localForm?.description || '')
  const [project, setProject] = useState<DropdownData>({
    label: writableProjects[0]?.name || '',
    value: writableProjects[0]?.id || '',
    index: 0,
  })
  const [interventionAssignment, setInterventionAssignment] =
    useState<InterventionAssignment>('all')
  const [interventionTypes, setInterventionTypes] = useState<string[]>([])
  const [siteAssignment, setSiteAssignment] = useState<SiteAssignment>('all')
  const [siteIds, setSiteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const selectedProject = useMemo(
    () => writableProjects.find((p) => p.id === project.value),
    [writableProjects, project.value],
  )

  const sites = useMemo(
    () => (selectedProject ? [...selectedProject.sites] : []),
    [selectedProject],
  )

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const handleProjectSelect = (data: DropdownData) => {
    setProject(data)
    // Sites belong to the project, so a change invalidates the selection.
    setSiteIds([])
    setSiteAssignment('all')
  }

  const validate = (): string => {
    if (!converted || !isSyncable(converted)) {
      return 'This form has no field that can be moved'
    }
    if (!name.trim()) return 'Give the form a name'
    if (!project.value) return 'Choose a project'
    if (interventionAssignment === 'specific' && interventionTypes.length === 0) {
      return 'Choose at least one intervention type'
    }
    if (siteAssignment === 'specific' && siteIds.length === 0) {
      return 'Choose at least one site'
    }
    return ''
  }

  const handleSync = async () => {
    if (!converted || !localForm) return
    const error = validate()
    if (error) {
      toast.show(error)
      return
    }
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      toast.show('You need to be online to sync a form')
      return
    }

    setLoading(true)
    try {
      const { response, success } = await createProjectForm(project.value, {
        name: name.trim(),
        description: description.trim(),
        status: 'published',
        siteAssignment,
        siteIds: siteAssignment === 'specific' ? siteIds : [],
        interventionAssignment,
        interventionTypes:
          interventionAssignment === 'specific' ? interventionTypes : [],
        schema: { sections: converted.sections },
      })
      const created = response?.data ?? response
      if (!success || !created?.id) {
        toast.show(
          response?.statusCode === 403
            ? 'Only a project owner or admin can add forms to this project'
            : response?.message || 'Could not sync this form, please try again',
        )
        return
      }
      await markFormMigrated(localForm.form_id, {
        formUid: created.id,
        projectId: project.value,
        projectName: project.label,
      })
      // Show it in the project's Forms list straight away rather than on the
      // next fetch, which may not happen before the device goes offline again.
      await cacheProjectForm(project.value, created)
      toast.show(`Synced to ${project.label}`)
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  if (!localForm || !converted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Sync form" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>This form is no longer on the device.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (writableProjects.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header label="Sync form" note={localForm.title || 'Untitled form'} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {projects.length === 0
              ? 'Sign in and load your projects first. A form has to belong to a project.'
              : 'Forms are managed by project owners and admins. Ask an admin of your project to add this form, or to give you permission to manage forms.'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const renderChips = (
    options: { label: string; value: string }[],
    selected: string[],
    onToggle: (value: string) => void,
  ) => (
    <View style={styles.chipWrap}>
      {options.map((option) => {
        const active = selected.includes(option.value)
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(option.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const renderSegmented = (
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (value: string) => void,
  ) => (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = selected === option.value
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Sync form" note={localForm.title || 'Untitled form'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Form name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Form name"
          placeholderTextColor={Colors.TEXT_LIGHT}
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this form for?"
          placeholderTextColor={Colors.TEXT_LIGHT}
          multiline
        />

        <Text style={styles.sectionLabel}>Project</Text>
        <CustomDropDown
          label="Project"
          data={writableProjects.map((p, index) => ({
            label: p.name,
            value: p.id,
            index,
          }))}
          onSelect={handleProjectSelect}
          selectedValue={project}
          whiteBG
        />

        <Text style={styles.sectionLabel}>Show this form for</Text>
        {renderSegmented(
          [
            { label: 'All interventions', value: 'all' },
            { label: 'Chosen types', value: 'specific' },
          ],
          interventionAssignment,
          (value) => setInterventionAssignment(value as InterventionAssignment),
        )}
        {interventionAssignment === 'specific' &&
          renderChips(AllIntervention, interventionTypes, (value) =>
            setInterventionTypes(toggle(interventionTypes, value)),
          )}

        <Text style={styles.sectionLabel}>Sites</Text>
        {renderSegmented(
          [
            { label: 'All sites', value: 'all' },
            { label: 'No site', value: 'none' },
            { label: 'Chosen sites', value: 'specific' },
          ],
          siteAssignment,
          (value) => setSiteAssignment(value as SiteAssignment),
        )}
        {siteAssignment === 'specific' &&
          (sites.length > 0 ? (
            renderChips(
              sites.map((site: any) => ({ label: site.name, value: site.id })),
              siteIds,
              (value) => setSiteIds(toggle(siteIds, value)),
            )
          ) : (
            <Text style={styles.helperText}>This project has no sites yet.</Text>
          ))}

        <Text style={styles.sectionLabel}>What will be synced</Text>
        <View style={styles.preview}>
          {converted.sections.map((section) => (
            <View key={section.id} style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>{section.title}</Text>
              {section.fields.map((field) => (
                <Text key={field.id} style={styles.previewField}>
                  {field.label}
                  <Text style={styles.previewFieldType}>{`  ${field.type}`}</Text>
                  {field.required ? (
                    <Text style={styles.previewRequired}>  required</Text>
                  ) : null}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {converted.dropped.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>
              {converted.dropped.length} item
              {converted.dropped.length === 1 ? '' : 's'} will be left out
            </Text>
            {converted.dropped.map((item, index) => (
              <Text key={`${item.label}-${index}`} style={styles.warningItem}>
                {item.label || item.type} · {item.reason}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.helperText}>
          The form goes live on the project as soon as it is synced, and reaches
          every device on that project. You can edit it later on the dashboard.
        </Text>

        <View style={styles.buttonWrap}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.NEW_PRIMARY} />
          ) : (
            <CustomButton
              label="Sync to dashboard"
              pressHandler={handleSync}
              containerStyle={styles.button}
              hideFadeIn
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default LegacyFormSyncView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: '5%',
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  segmentActive: {
    backgroundColor: Colors.NEW_PRIMARY,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  segmentTextActive: {
    color: Colors.WHITE,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: Colors.NEW_PRIMARY,
    borderColor: Colors.NEW_PRIMARY,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
  },
  chipTextActive: {
    color: Colors.WHITE,
  },
  preview: {
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    borderRadius: 12,
    padding: 14,
  },
  previewSection: {
    marginBottom: 12,
  },
  previewSectionTitle: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 6,
  },
  previewField: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    paddingVertical: 3,
  },
  previewFieldType: {
    fontSize: 11,
    color: Colors.TEXT_LIGHT,
  },
  previewRequired: {
    fontSize: 11,
    color: Colors.NEW_PRIMARY,
  },
  warning: {
    backgroundColor: Colors.BACKDROP_COLOR,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 6,
  },
  warningItem: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    paddingVertical: 2,
  },
  helperText: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 14,
    lineHeight: 18,
  },
  buttonWrap: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  button: {
    width: '100%',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
  },
})
