import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'

interface Props {
  data: string
}


const InterventionMetaData = (props: Props) => {
  const [additionalData, setAdditionalData] = useState<Array<{ key: string, value: string }>>([]);
  const { data } = props


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


  const convertData = () => {
    const checkForPublic: { value: string; key: string }[] = [];
    if (typeof data === 'string') {
      const parsedData = JSON.parse(data);
      if (parsedData?.public && typeof parsedData.public === 'object' && !Array.isArray(parsedData.public)) {
        Object.entries(parsedData.public).forEach(([key, value]: [string, { value: string , label: string }]) => {
          if (key !== 'isEntireSite' && typeof value === 'string') {
            checkForPublic.push({ value, key });
          }
          if (key !== 'isEntireSite' && typeof value !== 'string' && value.value && value.label) {
            if (isJsonString(value.value)) {
              const parsedData = JSON.parse(value.value)
              if (JSON.parse(value.value))
                checkForPublic.push({ value: parsedData.value, key: value.label });
            } else {
              checkForPublic.push({ value: value.value, key: value.label });
            }
          }
        });
      }
    }

    setAdditionalData(checkForPublic);
  };


  const renderData = () => {
    return additionalData.map((el) => (<View style={styles.cardWrapper} key={el.key}>
      <Text style={styles.cardTitle}> {el.key}</Text>
      <Text style={styles.cardLabel}>
        {el.value}
      </Text>
    </View>))
  }

  if (additionalData.length === 0) {
    return null
  }


  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>{i18next.t("label.meta_data")}</Text>
        {renderData()}
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
