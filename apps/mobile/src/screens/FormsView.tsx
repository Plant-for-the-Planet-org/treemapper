import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@realm/react'
import { useSelector } from 'react-redux'
import NetInfo from '@react-native-community/netinfo'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { RealmSchema } from 'src/types/enum/db.enum'
import { ProjectFormData } from 'src/types/interface/projectForm.interface'
import { RootState } from 'src/store'
import useFormsData from 'src/hooks/realm/useFormsData'
import { getProjectForms } from 'src/api/api.fetch'

// Lists the published forms for the current project. Forms are cached in Realm
// so the list works offline; a fresh fetch runs on mount when online.
const FormsView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { currentProject } = useSelector((state: RootState) => state.projectState)
  const projectId = currentProject?.projectId || ''
  const { upsertProjectForms } = useFormsData()
  const [loading, setLoading] = useState(false)

  const forms = useQuery<ProjectFormData>(
    RealmSchema.ProjectForm,
    (collection) => collection.filtered('project_id == $0', projectId),
    [projectId],
  )

  const syncForms = async () => {
    if (!projectId) return
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) return
    setLoading(true)
    try {
      const { response, success } = await getProjectForms(projectId)
      const data = Array.isArray(response) ? response : response?.data
      if (success && Array.isArray(data)) {
        await upsertProjectForms(projectId, data)
      }
    } catch (error) {
      // offline / failed fetch -> keep cached forms
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    syncForms()
  }, [projectId])

  const openForm = (form: ProjectFormData) => {
    navigation.navigate('FormDetail', { formId: form.id, mode: 'prefill' })
  }

  const renderItem = ({ item }: { item: ProjectFormData }) => (
    <TouchableOpacity style={styles.card} onPress={() => openForm(item)}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      {!!item.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  )

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {projectId
            ? 'No forms available for this project yet.'
            : 'Select a project to see its forms.'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header label="Forms" note={currentProject?.projectName || undefined} />
      {loading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />
        </View>
      )}
      <FlatList
        data={[...forms]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

export default FormsView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  loaderRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    textAlign: 'center',
  },
})
