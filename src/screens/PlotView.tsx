import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import PlotList from 'src/components/monitoringPlot/PlotList'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import AddIcon from 'assets/images/svg/MoreOptionIcon.svg'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { MonitoringPlot } from 'src/types/interface/slice.interface'
import Popover from 'react-native-popover-view';
import i18next from 'src/locales/index'
import { ctaHaptic } from 'src/utils/helpers/hapticFeedbackHelper'
import PlotSyncing from 'src/components/monitoringPlot/PlotSyncing'


const PlotView = () => {
  const [popupVisible, setPopupVisible] = useState(false)
  const plotData = useQuery<MonitoringPlot>(
    RealmSchema.MonitoringPlot,
    data => {
      return data.filtered("lastScreen != 'form'")
    },
  )

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const addGroups = () => {
    togglePopup()
    navigation.navigate('PlotGroup')
  }

  const togglePopup = () => {
    ctaHaptic()
    setPopupVisible(!popupVisible)
  }



  const renderIcon = () => {
    return <Popover
      isVisible={popupVisible}
      backgroundStyle={{ opacity: 0 }}
      verticalOffset={Platform.OS === 'android' ? -50 : 0}
      onRequestClose={togglePopup}
      from={(
        <Pressable onPress={togglePopup} style={styles.rightContainer}><AddIcon width={16} height={16} fill={Colors.WHITE} /></Pressable>
      )}>
      <View style={styles.popOverWrapper}>
        <Pressable onPress={addGroups}><Text style={styles.menuLabel}>{i18next.t('label.plot_group')}</Text></Pressable>
      </View>

    </Popover>


  }
  return (
    <SafeAreaView style={styles.container}>
      <PlotSyncing isLoggedIn={true}/>
      <Header label={i18next.t('label.monitoring_plot_header')} showBackIcon={false} rightComponent={renderIcon()} />
      <View style={styles.wrapper}>
        <PlotList data={[...plotData]} />
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
    marginRight: 10,
    borderRadius: 8
  },
  popOverWrapper: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.PALE_WHITE,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.PALE_WHITE,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 8,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,

  }
})
