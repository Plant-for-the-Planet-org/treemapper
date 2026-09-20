import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { RootStackParamList } from 'src/types/type/navigation.type'
import i18next from 'src/locales/index'

interface Entry {
  key: string
  value: string
  isPrivate: boolean
}

interface Props {
  data: string
  interventionId: string
  canEdit: boolean
}


const InterventionMetaData = (props: Props) => {
  const [additionalData, setAdditionalData] = useState<Entry[]>([]);
  const { data, interventionId, canEdit } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()


  useEffect(() => {
    convertData()
  }, [data])

  function isJsonString(str) {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }


  // Reads one meta_data bucket into flat rows. An entry is either a bare string
  // or the {label, value} object that forms, device metadata and manually added
  // entries all use; a value that is itself JSON (a dropdown answer) carries the
  // display text inside.
  const readBucket = (bucket: unknown, isPrivate: boolean): Entry[] => {
    const rows: Entry[] = []
    if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) {
      return rows
    }
    Object.entries(bucket as Record<string, any>).forEach(([key, value]) => {
      if (key === 'isEntireSite') return
      if (typeof value === 'string') {
        rows.push({ value, key, isPrivate })
        return
      }
      if (value?.value && value?.label) {
        if (isJsonString(value.value)) {
          rows.push({ value: JSON.parse(value.value).value, key: value.label, isPrivate })
        } else {
          rows.push({ value: value.value, key: value.label, isPrivate })
        }
      }
    })
    return rows
  }

  const convertData = () => {
    if (typeof data !== 'string' || !data) {
      setAdditionalData([])
      return
    }
    let parsedData: any
    try {
      parsedData = JSON.parse(data)
    } catch (error) {
      setAdditionalData([])
      return
    }
    // Public entries show whatever wrote them. On the private side only the
    // entries typed here are listed: form answers default to private and belong
    // to the form that collected them, so listing them here would repeat a whole
    // form on every preview.
    const privateManual = Object.fromEntries(
      Object.entries((parsedData?.private || {}) as Record<string, any>)
        .filter(([, entry]) => entry?.elementType === 'metaData')
    )
    setAdditionalData([
      ...readBucket(parsedData?.public, false),
      ...readBucket(privateManual, true),
    ]);
  };

  const renderData = () => {
    return additionalData.map((el) => (<View style={styles.cardWrapper} key={`${el.key}-${el.isPrivate}`}>
      <View style={styles.titleRow}>
        <Text style={styles.cardTitle}> {el.key}</Text>
        {el.isPrivate && <Text style={styles.privateTag}>Private</Text>}
      </View>
      <Text style={styles.cardLabel}>
        {el.value}
      </Text>
    </View>))
  }

  const addData = () => {
    navigation.navigate('AddInterventionData', { interventionId, target: 'metadata' })
  }

  // Same rule as the additional data card: stay out of the way when there is
  // nothing to show and nothing to add.
  if (additionalData.length === 0 && !canEdit) {
    return null
  }


  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>{i18next.t("label.meta_data")}</Text>
        {renderData()}
        {canEdit && <TouchableOpacity onPress={addData} style={styles.addWrapper}>
          <Text style={styles.addLabel}>+ Add metadata</Text>
        </TouchableOpacity>}
      </View>
    </View>
  )
}

export default InterventionMetaData

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateTag: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: scaleSize(10),
    color: Colors.TEXT_LIGHT,
    borderWidth: 1,
    borderColor: Colors.GRAY_BORDER,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 8,
    marginBottom: 5,
  },
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
  }
})
