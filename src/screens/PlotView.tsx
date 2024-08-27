import { StyleSheet } from 'react-native'
import React from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from 'src/utils/constants'
import i18next from 'src/locales/index'


const PlotView = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header label={i18next.t('label.monitoring_plot_header')} showBackIcon={false} />
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
    marginRight: 20,
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
