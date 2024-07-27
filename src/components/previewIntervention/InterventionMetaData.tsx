import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { FORM_TYPE } from 'src/types/type/app.type'

interface Props {
  data: string
}

const InterventionMetaData = (props: Props) => {

  const [additiionalData, setAdditiionalData] = useState<{ [key: string]: { value: string, label: string, type?: FORM_TYPE } }>({})

  const { data } = props
  useEffect(() => {
    if (data.length) {
      const parsedData = JSON.parse(data);
      if (parsedData?.['public'] && Object.keys(parsedData['public']).length === 0) {
        return
      }
      if (parsedData.length !== 0) {
        setAdditiionalData(parsedData)
      }
    }
  }, [data])

  if (Object.keys(additiionalData).length === 0) {
    return null
  }


  const renderData = () => {
    const finalData = []
    const publicData = additiionalData.public;
    let i = 0
    for (const prop in publicData) {
      i++
      finalData.push(
        <View style={styles.cardWrapper} key={i}>
          <Text style={styles.cardTitle}> {prop}</Text>
          <Text style={styles.cardLabel}>
            {publicData[prop]}
          </Text>
        </View>
      )
    }
    return finalData
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Meta Data</Text>
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
  cardBotttomWrapper: {
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
    color: Colors.TEXT_COLOR,
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(20),
    color: Colors.TEXT_COLOR,
  }
})
