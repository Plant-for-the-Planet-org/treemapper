import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Colors, Typography } from 'src/utils/constants'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { ProjectFormData } from 'src/types/interface/projectForm.interface'

interface Props {
  forms: ProjectFormData[]
  interventionId: string
  confirmedIds: Set<string>
  // When false the forms are read-only (e.g. already synced interventions).
  canEdit: boolean
}

// Lists the forms a registered intervention must complete before it can be
// saved. Each row shows its status and opens the form in 'intervention' mode.
const InterventionFormsRequired = (props: Props) => {
  const { forms, interventionId, confirmedIds, canEdit } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  if (!forms.length) return null

  const openForm = (formId: string) => {
    navigation.navigate('FormDetail', {
      formId,
      mode: 'intervention',
      interventionId,
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Forms</Text>
      {forms.map((form) => {
        const confirmed = confirmedIds.has(form.id)
        return (
          <View key={form.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{form.name}</Text>
              <Text style={[styles.status, confirmed ? styles.done : styles.pending]}>
                {confirmed ? 'Completed' : 'Required'}
              </Text>
            </View>
            {canEdit && (
              <TouchableOpacity style={styles.button} onPress={() => openForm(form.id)}>
                <Text style={styles.buttonText}>{confirmed ? 'Edit' : 'Open form'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      })}
    </View>
  )
}

export default InterventionFormsRequired

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 16,
  },
  heading: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    padding: 14,
    marginBottom: 10,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  status: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginTop: 4,
  },
  pending: {
    color: Colors.ALERT,
  },
  done: {
    color: Colors.NEW_PRIMARY,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.NEW_PRIMARY,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
  },
})
