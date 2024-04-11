import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {scaleFont, scaleSize} from 'src/utils/constants/mixins'
import InterventionIconSwitch from './InterventionIconSwitch'
import {Colors, Typography} from 'src/utils/constants'
import EditInterventionIcon from 'assets/images/svg/EditInterventionIcon.svg'
import SyncIcon from 'assets/images/svg/SyncIcon.svg'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg'
import {timestampToBasicDate} from 'src/utils/appHelper/dataAndTimeHelper'

const newDate = new Date().getTime()

const InterventionCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <InterventionIconSwitch icon="FireBreak" />
        <View style={styles.incompleteTagWrapper}>
          <Text style={styles.incompleteTagLable}>INCOMPLETE</Text>
        </View>
        <View style={styles.sectionWrapper}>
          <Text style={styles.label}>8 Trees Planted</Text>
          <View style={styles.metaWrapper}>
            <View style={styles.syncIconWrapper}>
              { newDate ? (
                <UnSyncIcon width={15} height={15} />
              ) : (
                <SyncIcon width={15} height={15} />
              )}
            </View>
            <Text style={styles.metaLable}>Point</Text>
            <Text style={styles.metaLable}>
              {timestampToBasicDate(Date.now())}
            </Text>
          </View>
        </View>
        <View style={styles.editIconWrapper}>
          <EditInterventionIcon height={25} width={25} />
        </View>
      </View>
    </View>
  )
}

export default InterventionCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: scaleSize(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.WHITE,
  },
  incompleteTagWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: scaleFont(20),
    backgroundColor: Colors.GRAY_BACKDROP,
    width: '22%',
    position: 'absolute',
    top: 0,
    right: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  incompleteTagLable: {
    fontSize: scaleFont(8),
    fontFamily: Typography.FONT_FAMILY_BOLD,
  },
  editIconWrapper: {
    height: '100%',
    width: 30,
    marginHorizontal: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  sectionWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    marginLeft: 10,
  },
  label: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  syncIconWrapper: {
    margin: 5,
  },
  metaWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLable: {
    fontSize: scaleFont(12),
    marginHorizontal: 5,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
})
