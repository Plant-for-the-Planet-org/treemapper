import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ExploreBackDrop from 'assets/images/svg/ExploreBackDrop.svg'
import Header from 'src/components/common/Header'
import { SCALE_14, SCALE_18 } from 'src/utils/constants/spacing'
import { Colors, Typography } from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import ExternalLinkIcon from 'assets/images/svg/ExternalLinkIcon.svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import i18next from 'src/locales/index'

const DataExplorerView = () => {

  const openLink = () => {
    openWebView(`https://pp.eco/explore`);

  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <Header label="Data Explorer" />
      <View style={styles.container}>
        <ExploreBackDrop />
        <Text style={styles.header}>{i18next.t("label.explore_tile")}</Text>
        <Text style={styles.section}>
          {i18next.t("label.learn_note_explore")}
        </Text>
        <Text style={styles.section}>
          {i18next.t("label.explore_download_note")}
        </Text>
        <Text>
          {'\n'}
        </Text>
        <Text style={styles.section}> {i18next.t("label.explore_available")}</Text>
        <Text style={styles.section}>{i18next.t("label.best_desktop")}</Text>
      </View>
      <CustomButton
        label={i18next.t("label.explore_now")}
        containerStyle={styles.btnContainer}
        pressHandler={openLink}
        loading={false}
        leftIcon={<ExternalLinkIcon width={25} height={25} />}
      />
    </SafeAreaView>
  )
}

export default DataExplorerView

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BACKDROP_COLOR
  },
  header: {
    fontSize: SCALE_18,
    color: Colors.DARK_TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    marginBottom: 10
  },
  section: {
    fontSize: SCALE_14,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginBottom: 10
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 25,
  },

})
