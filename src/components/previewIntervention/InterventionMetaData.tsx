import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import i18next from 'src/locales/index'

interface Props {
  data: string
  synced: boolean
}


const InterventionMetaData = (props: Props) => {
  const [additionalData, setAdditionalData] = useState<Array<{ key: string, value: string }>>([]);
  const { data } = props
  useEffect(() => {
    convertData()
  }, [data])





  const convertData = () => {
    const checkForPublic = [];


    if (!!data && typeof data === 'string') {
      const parsedData = JSON.parse(data)
      if (!!parsedData && parsedData?.public) {
        const publicData = parsedData.public;
        if (typeof publicData === 'object' && publicData !== null && !Array.isArray(publicData)) {
          for (const key in publicData) {
            if (key!=='isEntireSite') {  // optional: ensure the property is not inherited
              checkForPublic.push({ value: publicData[key], key: key });
            }
          }
        }
      }

    }
    setAdditionalData(checkForPublic)
  }


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
