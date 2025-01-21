import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {FormElement} from 'src/types/interface/form.interface'

interface Props {
  data: FormElement
}

const FormInfoElement = (props: Props) => {
  const {data} = props
  return (
    <View style={styles.container}>
      <Text>{data.label}</Text>
    </View>
  )
}

export default FormInfoElement

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    borderWidth: 0.5,
    borderColor: 'black',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '90%',
    height: '95%',
  },
})
