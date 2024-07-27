import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CustomButton from 'src/components/common/CustomButton'
import {scaleSize} from 'src/utils/constants/mixins'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import {RootStackParamList} from 'src/types/type/navigation.type'

const PreviewPolygon = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const navigateToNext = () => {
    navigation.goBack()
  }
  return (
    <View style={styles.container}>
      <Text>PreviewPolygon</Text>
      <CustomButton
        label="Continue"
        containerStyle={styles.btnContainer}
        pressHandler={navigateToNext}
      />
    </View>
  )
}

export default PreviewPolygon

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
