import { Pressable, StyleSheet, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import PlotList from 'src/components/monitoringPlot/PlotList'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import AddIcon from 'assets/images/svg/Addicon.svg'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import {MonitoringPlot } from 'src/types/interface/slice.interface'

const PlotView = () => {

  const plotData = useQuery<MonitoringPlot>(
    RealmSchema.MonitoringPlot,
    data => {
      return data
    },
  )

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const addGroups = () => {
    navigation.navigate('PlotGroup')
  }

  const renderIcon = () => {
    return <Pressable onPress={addGroups} style={styles.rightContainer}><AddIcon width={16} height={16} /></Pressable>
  }
  return (
    <SafeAreaView style={styles.container}>
      <Header label='Monitoring Plots' showBackIcon={false} rightComponet={renderIcon()} />
      <View style={styles.wrapper}>
        <PlotList data={plotData} />
      </View>
    </SafeAreaView>
  )
}

export default PlotView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  wrapper: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR,
  },
  rightContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.NEW_PRIMARY,
    marginRight: 20,
    borderRadius:8
  }
})
