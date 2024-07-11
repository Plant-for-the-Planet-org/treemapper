import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { scaleFont } from 'src/utils/constants/mixins'
import InterventionIconSwitch from './InterventionIconSwitch'
import { Colors, Typography } from 'src/utils/constants'
import EditInterventionIcon from 'assets/images/svg/EditInterventionIcon.svg'
import SyncIcon from 'assets/images/svg/CloudSyncIcon.svg'
import UnSyncIcon from 'assets/images/svg/UnSyncIcon.svg'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { InterventionData } from 'src/types/interface/slice.interface'
import InterventionCardHeader from './InterventionCardHeader'
import InterventionMetaInfo from './InterventionMetaInfo'
import DividerDot from '../common/DividerDot'


interface Props {
  item: InterventionData
  openIntervention: (item: InterventionData) => void
}

const InterventionCard = (props: Props) => {
  const { item, openIntervention } = props
  const handleIntervention = () => {
    const finalItem = { ...JSON.parse(JSON.stringify(item)) }
    openIntervention({ ...finalItem })
  }
  return (
    <TouchableOpacity style={styles.container} onPress={handleIntervention}>
      <View style={styles.wrapper}>
        <InterventionIconSwitch icon={item.intervention_type} />
        {!item.is_complete ? (
          <View style={styles.incompleteTagWrapper}>
            <Text style={styles.incompleteTagLable}>INCOMPLETE</Text>
          </View>
        ) : null}
        <View style={styles.sectionWrapper}>
          <InterventionCardHeader item={item} />
          <View style={styles.metaWrapper}>
            <View style={styles.syncIconWrapper}>
              {item.status !== "SYNCED" ? (
                <UnSyncIcon width={15} height={15} />
              ) : (
                <SyncIcon width={15} height={15} />
              )}
            </View>
            <Text style={styles.metaLable}>{item.location_type}</Text>
            <DividerDot width={20} height={20} size={20} color={Colors.TEXT_COLOR}/>
            <InterventionMetaInfo item={item} />
            <Text style={styles.metaLable}>
              {timestampToBasicDate(item.intervention_date)}
            </Text>
          </View>
        </View>
        {item.status !== 'SYNCED' && <View style={styles.editIconWrapper}>
          <EditInterventionIcon height={30} width={30} />
        </View>}
      </View>
    </TouchableOpacity>
  )
}

export default InterventionCard

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
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
    elevation: 5, // This adds a shadow on Android
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    paddingLeft: 10,
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
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  editIconWrapper: {
    height: '100%',
    width: 30,
    marginRight: 15,
    marginLeft:5,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: '4%',
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
    marginRight: 5,
  },
  metaWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLable: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
})
