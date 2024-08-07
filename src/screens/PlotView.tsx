import { StyleSheet, View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'i18next'
import Header from 'src/components/common/Header'
import EmptyPlotIcon from 'assets/images/svg/EmptyPlotIcon.svg'

const PlotView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t('label.monitoring_plot_header')} showBackIcon={false} />
      <View style={styles.wrapper}>
        <View style={styles.backDropWrapper}>
          <EmptyPlotIcon />
        </View>
        <Text style={styles.comingSoonLabel}>
          Coming Soon
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default PlotView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BACKDROP_COLOR,
    paddingBottom:'20%'
  },
  backDropWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  comingSoonLabel: {
    width: '90%',
    textAlign: 'center',
    marginTop: 10,
    color:Colors.TEXT_LIGHT,
    fontSize:20,
    fontFamily:Typography.FONT_FAMILY_SEMI_BOLD
  }
})