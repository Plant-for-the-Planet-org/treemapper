import { Pressable, StyleSheet, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import GroupPlotList from 'src/components/monitoringPlot/GroupPlotList'


const PlotGroupView = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const openInfo = () => {
      navigation.navigate('MonitoringInfo')
  }
  return (
    <SafeAreaView style={styles.container}>
      <Header label='Plot Groups'  rightComponet={<Pressable onPress={openInfo} style={styles.infoWrapper}><InfoIcon style={styles.infoWrapper} onPress={openInfo} /></Pressable>} />
      <View style={styles.wrapper}>
        <GroupPlotList />
      </View>
    </SafeAreaView>
  )
}

export default PlotGroupView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  infoWrapper: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '5%'
}
})
