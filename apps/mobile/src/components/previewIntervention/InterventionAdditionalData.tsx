import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { FormElement } from 'src/types/interface/form.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import i18next from 'src/locales/index'

interface Props {
  data: FormElement[]
  id: string
  canEdit: boolean
}

const InterventionAdditionalData = (props: Props) => {

  const [additionalData, setAdditionalData] = useState<FormElement[]>([])
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { data, id, canEdit } = props

  useEffect(() => {
    if (data.length > 0) {
      setAdditionalData(data)
    }
  }, [data])

  // Hidden only when there is nothing to show and nothing to do. While the
  // intervention is still editable the card stays, so the Add button has a home
  // even on an intervention that carries no extra fields yet.
  if (additionalData.length === 0 && !canEdit) {
    return null
  }

  const renderValue = (d: FormElement) => {
    if (d.type === "DROPDOWN") {
      return d.value.length ? JSON.parse(d.value).value : d.value + d.unit;
    } else if (d.type === 'YES_NO') {
      const parsedData = d.value.length ? JSON.parse(d.value) : false
      if (parsedData) {
        return 'Yes'
      } else {
        return 'No'
      }
    } else {
      return d.value + " " + d.unit;
    }
  }

  const renderData = () => {
    const finalData = []
    additionalData.forEach(el => {
      if (el.type === 'GAP') {
        finalData.push(
          <View style={styles.cardWrapper} key={el.key}>
            <View style={styles.cardBottomWrapper} />
          </View>
        )
      } else if (el.type === 'HEADING') {
        finalData.push(
          <View style={styles.cardWrapper} key={el.key}>
            <Text style={styles.headerLabel}> {el.label}</Text>
          </View>
        )
      } else {
        finalData.push(
          <View style={styles.cardWrapper} key={el.key}>
            <Text style={styles.cardTitle}> {el.label}</Text>
            <Text style={styles.cardLabel}>
              {renderValue(el)}
            </Text>
          </View>
        )
      }
    })
    return finalData
  }

  const editData = () => {
    navigation.navigate('EditAdditionData', { 'interventionID': id })
  }

  const addData = () => {
    navigation.navigate('AddInterventionData', { interventionId: id, target: 'additional' })
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {canEdit && additionalData.length > 0 && <TouchableOpacity onPress={editData} style={styles.editWrapper}>
          <PenIcon width={30} height={30} />
        </TouchableOpacity>}
        <Text style={styles.title}>{i18next.t("label.additional_data")}</Text>
        {renderData()}
        {canEdit && <TouchableOpacity onPress={addData} style={styles.addWrapper}>
          <Text style={styles.addLabel}>+ Add field</Text>
        </TouchableOpacity>}
      </View>
    </View>
  )
}

export default InterventionAdditionalData

const styles = StyleSheet.create({
  addWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.NEW_PRIMARY,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: scaleSize(14),
    color: Colors.NEW_PRIMARY,
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20
  },
  wrapper: {
    width: '90%',
    borderRadius: 12,
    paddingVertical: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 0.5,
    borderColor: '#f2ebdd',
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  cardBottomWrapper: {
    width: '90%',
    height: 1,
    backgroundColor: Colors.TEXT_COLOR
  },
  cardTitle: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: scaleSize(14),
    marginBottom: 5,
    color: Colors.TEXT_COLOR,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(16),
    marginBottom: 5,
    marginVertical: 5,
    marginLeft: 20,
    color: Colors.DARK_TEXT_COLOR,
  },
  cardLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    marginLeft: 5,
    color: Colors.TEXT_COLOR,
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(20),
    color: Colors.TEXT_COLOR,
  },
  editWrapper: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
    borderRadius: 8,
    right: 10,
    position: 'absolute',
    top: 10
  }
})
