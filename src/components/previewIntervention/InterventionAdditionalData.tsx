import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { FORM_TYPE } from 'src/types/type/app.type'

interface Props {
  data: string
}

const InterventionAdditionalData = (props: Props) => {

  const [additiionalData, setAdditiionalData] = useState<{ [key: string]: { value: string, label: string, type?: FORM_TYPE } }>({})

  const { data } = props

  useEffect(() => {
    if (data.length) {
      const parsedData = JSON.parse(data);
      if (parsedData.length !== 0) {
        setAdditiionalData(parsedData)
      }
    }
  }, [data])

  if (Object.keys(additiionalData).length === 0) {
    return null
  }

  const renderValue = (d: { value: string, label: string, type?: FORM_TYPE }) => {
    switch (d.type) {
      case "DROPDOWN":
        return d.value.length?JSON.parse(d.value).value:d.value
      default:
        return d.value
    }
  }

  const renderData = () => {
    const finalData = []
    let i = 0
    for (const prop in additiionalData) {
      i++
      if (additiionalData[prop].type === 'GAP') {
        finalData.push(
          <View style={styles.cardWrapper} key={i}>
            <View style={styles.cardBotttomWrapper} />
          </View>
        )
      } else if (additiionalData[prop].type === 'HEADING') {
        finalData.push(
          <View style={styles.cardWrapper} key={i}>
            <Text style={styles.headerLabel}> {additiionalData[prop].label}</Text>
          </View>
        )
      } else {
        finalData.push(
          <View style={styles.cardWrapper} key={i}>
            <Text style={styles.cardTitle}> {additiionalData[prop].label}</Text>
            <Text style={styles.cardLabel}>
              {renderValue(additiionalData[prop])}
            </Text>
          </View>
        )
      }
    }
    return finalData
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Additional Data</Text>
        {renderData()}
      </View>
    </View>
  )
}

export default InterventionAdditionalData

const styles = StyleSheet.create({
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
    marginLeft:5,
    color: Colors.TEXT_COLOR,
  },
  headerLabel:{
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(20),
    color: Colors.TEXT_COLOR, 
  }
})
