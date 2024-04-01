import {ScrollView, StyleSheet, View} from 'react-native'
import React from 'react'
import {useNavigation} from '@react-navigation/native'
import {StackNavigationProp} from '@react-navigation/stack'
import CustomButton from 'src/components/common/CustomButton'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {scaleSize} from 'src/utils/constants/mixins'
import Header from 'src/components/common/Header'
import IterventionCoverImage from 'src/components/previewIntervention/IterventionCoverImage'
import InterventionBasicInfo from 'src/components/previewIntervention/InterventionBasicInfo'
import InterventionArea from 'src/components/previewIntervention/InterventionArea'

const PreviewFormData = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const navigateToNext = () => {
    navigation.popToTop()
  }
  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          <Header label="Review" />
          <IterventionCoverImage />
          <InterventionBasicInfo />
          <InterventionArea />
          <CustomButton
            label={'Done'}
            pressHandler={navigateToNext}
            containerStyle={styles.btnContainer}
          />
        </View>
      </ScrollView>
    </View>
  )
}

export default PreviewFormData

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    flexDirection: 'row',
    alignItems: 'center',
  },
})
