import {StyleSheet, View} from 'react-native'
import React, {useEffect} from 'react'
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native'
import {RootStackParamList} from 'src/types/type/navigation.type'
import {StackNavigationProp} from '@react-navigation/stack'
import {useDispatch} from 'react-redux'
import {setUpIntervention} from 'src/utils/formHelper/selectIntervention'
import {initiateForm} from 'src/store/slice/registerFormSlice'

const FormIntermediateView = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'FormIntermediate'>>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()

  useEffect(() => {
    setUpRegisterFlow()
  }, [route.params])

  const setUpRegisterFlow = () => {
    const formFlowData = setUpIntervention(route.params.id)
    dispatch(initiateForm({...formFlowData}))
    setTimeout(() => {
      if (formFlowData.location_type === 'Point') {
        navigation.replace('PointMarker')
      } else {
        navigation.replace('PolygonMarker')
      }
    }, 500)
  }

  return <View style={styles.container}></View>
}

export default FormIntermediateView

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
