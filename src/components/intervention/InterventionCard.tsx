import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
import i18next from 'i18next'
import SwipeableItem from "react-native-swipeable-item";
import BinIcon from 'assets/images/svg/BinIcon.svg'
import ExportArrows from 'assets/images/svg/ExportArrow.svg'
import { exportAllInterventionData } from 'src/utils/helpers/fileManagementHelper'
import PenIcon from 'assets/images/svg/PenIcon.svg'

interface Props {
  item: InterventionData
  openIntervention: (item: InterventionData) => void
  deleteHandler: (item: InterventionData) => void
  openEditModal: (item: InterventionData) => void
}
const OVERSWIPE_DIST = 20;

const InterventionCard = (props: Props) => {
  const { item, openIntervention } = props
  const handleIntervention = () => {
    const finalItem = { ...JSON.parse(JSON.stringify(item)) }
    openIntervention({ ...finalItem })
  }
  const renderFixLabel = () => {
    if (item.fix_required === "PROJECT_ID_MISSING") {
      return "Project not assigned";
    } else {
      return "Fix Required";
    }
  };
  const exportInterventionData = async () => {
    await exportAllInterventionData(item)
  }


  const swipeableLeftComp = () => {
    return <View style={styles.leftContainer}><View style={styles.leftWrapper}>
      <TouchableOpacity style={styles.trayIconWrapper} onPress={exportInterventionData}>
        <ExportArrows />
      </TouchableOpacity>
      {!item.is_complete && <TouchableOpacity style={styles.trayIconWrapper} onPress={() => { props.deleteHandler(item) }}>
        <BinIcon width={19} height={19} fill={"tomato"} />
      </TouchableOpacity>}
      {item.is_complete && item.status == 'PENDING_DATA_UPLOAD' ? <TouchableOpacity style={styles.trayIconWrapper} onPress={() => { props.openEditModal(item) }}>
        <PenIcon width={25} height={30} />
      </TouchableOpacity> : null}
    </View></View>
  }

  return (
    <SwipeableItem
      key={item.intervention_id}
      item={item}
      overSwipe={OVERSWIPE_DIST}
      renderUnderlayLeft={() => (swipeableLeftComp())}
      snapPointsLeft={item.status=== 'SYNCED'?[100]:[150]}
      snapPointsRight={[0]}
    >
      <Pressable style={styles.container} onPress={handleIntervention}>
        <View style={styles.wrapper}>
          <InterventionIconSwitch icon={item.intervention_type} />
          {!item.is_complete && item.fix_required === "NO" ? (
            <View style={styles.incompleteTagWrapper}>
              <Text style={styles.incompleteTagLabel}>{i18next.t("label.incomplete")}</Text>
            </View>
          ) : null}
          {item.is_complete && item.fix_required !== "NO" ? (
            <View style={styles.projectAssignWrapper}>
              <Text style={styles.projectLabel}>{renderFixLabel()}</Text>
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
              <Text style={styles.metaLabel}>{item.location.type}</Text>
              <DividerDot width={20} height={20} size={20} color={Colors.TEXT_COLOR} />
              <InterventionMetaInfo item={item} />
              <Text style={styles.metaLabel}>
                {timestampToBasicDate(item.intervention_date)}
              </Text>
            </View>
          </View>
          {!item.is_complete && <View style={styles.editIconWrapper}>
            <EditInterventionIcon height={30} width={30} />
          </View>}
        </View>
      </Pressable>
    </SwipeableItem>
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
    height: 18,
    backgroundColor: Colors.GRAY_BACKDROP,
    position: 'absolute',
    top: 0,
    width: '22%',
    right: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 5
  },
  incompleteTagLabel: {
    fontSize: 8,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  projectAssignWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 18,
    width: '25%',
    backgroundColor: '#ff8383',
    position: 'absolute',
    top: 0,
    right: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 5
  },
  projectLabel: {
    fontSize: 8,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE
  },
  editIconWrapper: {
    height: '100%',
    width: 30,
    marginRight: 15,
    marginLeft: 5,
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
  metaLabel: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  leftContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftWrapper: {
    width: '90%',
    height: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 12,
    backgroundColor: Colors.NEW_PRIMARY + '1A',
  },
  trayIconWrapper: {
    width: 35,
    height: 35,
    marginRight: 20,
    borderRadius: 5,
    backgroundColor: Colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
