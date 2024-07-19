import {StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import AdditionalTabView from 'src/components/additionalData/AdditionalTabView'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

const AdditionalDataView = () => {

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const handleNav=()=>{
    navigation.navigate("ImportForm")
  }

  const renderRightComponent=()=>{
    return <TouchableOpacity 
    onPress={handleNav}
    style={styles.wrapper}><Icon name={'import-export'} size={30} color={Colors.TEXT_COLOR} /></TouchableOpacity>
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Header label="Additional Data" rightComponet={renderRightComponent()}/>
      <AdditionalTabView />
    </SafeAreaView>
  )
}

export default AdditionalDataView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:Colors.WHITE
  },
  wrapper:{
    width:50,
    height:'100%',
    justifyContent:'center',
    alignItems:'center',
    marginRight:10
  }
})
