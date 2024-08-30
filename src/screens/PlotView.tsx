import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'src/locales/index'
import ComingSoon from 'assets/images/svg/ComingSoon.svg'

const PlotView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t('label.monitoring_plot_header')} showBackIcon={false} />
      <View style={styles.wrapper}>
        <ComingSoon />
        <Text style={styles.mainLabel}>Monitoring Plots Coming Soon</Text>
        <Text style={styles.secondaryLabel}>You'll soon be able to monitor and {'\n'}manage your plots with detailed insights.{'\n'}Stay tuned!</Text>
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
    justifyContent:'center',
    alignItems:'center'
  },
  mainLabel: {
    fontSize: 18,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    width:'100%',
    textAlign:'center',
    marginTop:10
  },
  secondaryLabel: {
    fontSize: 16,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginTop: 10,
    width:'100%',
    textAlign:'center',
  },
})
