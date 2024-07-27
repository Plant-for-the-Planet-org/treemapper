import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { FormElement } from 'src/types/interface/form.interface'

interface Props {
  formData: string
}

const InterventionFormData = (props: Props) => {

  const [formValues, setFormValues] = useState<FormElement[]>([])

  const { formData } = props

  useEffect(() => {
    const parsedData = JSON.parse(formData);
    if(parsedData.length!==0){
      setFormValues(parsedData)
    }
  }, [formData])

  if(formValues.length==0){
    return null
  }


  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        {formValues.map((el, i) => {
          return <View style={styles.cardWrapper} key={String(i)}>
            <Text style={styles.cardTitle}>{el.placeholder}</Text>
            <Text style={styles.cardLabel}>
              {el.value} {el.unit}
            </Text>
          </View>
        })}
      </View>
    </View>
  )
}

export default InterventionFormData

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical:20
  },
  wrapper: {
    width: '90%',
    borderRadius: 12,
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    paddingVertical: 20,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  cardTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    marginBottom: 5,
    color: Colors.TEXT_LIGHT,
  },
  cardLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_COLOR,
  },
})
