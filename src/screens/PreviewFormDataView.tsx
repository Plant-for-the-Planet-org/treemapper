import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { scaleSize } from 'src/utils/constants/mixins'

const PreviewFormData = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const navigateToNext = () => {
      navigation.popToTop()
    }
    return (
      <View style={styles.container}>
        <Text>PreviewFormData</Text>
        <CustomButton
          label="Done"
          containerStyle={styles.btnContainer}
          pressHandler={navigateToNext}
        />
      </View>
    )
  }
  
  export default PreviewFormData
  
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
  