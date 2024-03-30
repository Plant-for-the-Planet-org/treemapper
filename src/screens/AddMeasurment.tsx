import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation'

const AddMeasurment = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const navigateToNext = () => {
    navigation.navigate('PreviewFormData')
  }
  return (
    <View style={styles.container}>
      <Text>AddMeasurment Form</Text>
      <CustomButton
        label="Continue"
        containerStyle={styles.btnContainer}
        pressHandler={navigateToNext}
      />
    </View>
  )
}

export default AddMeasurment

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
})
