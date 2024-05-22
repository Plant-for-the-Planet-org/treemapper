import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { SampleTree } from 'src/types/interface/slice.interface'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useDispatch } from 'react-redux'
import { updateLastUpdatedAt } from 'src/store/slice/interventionSlice'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'

interface Props {
  sampleTress: SampleTree[]
  interventionId: string
  hasSampleTress: boolean
  isSynced: boolean
}

const SampleTreePreviewList = (props: Props) => {
  const { sampleTress, interventionId, hasSampleTress, isSynced } = props
  const { deleteSampleTreeIntervention } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const dispatch = useDispatch()
  const deleteTreeDetails = async (id: string) => {
    await deleteSampleTreeIntervention(id, interventionId)
    dispatch(updateLastUpdatedAt())
  }

  const editTreeDetails = async (id: string) => {
    navigation.navigate("ReviewTreeDetails", { detailsCompleted: false, interventionID: id, synced: isSynced })
  }


  const hasDetails = sampleTress && sampleTress.length > 0
  const renderCard = () => {
    return sampleTress.map((details, i) => {
      return (
        <View style={styles.wrapper} key={i}>
          <View style={styles.deleteWrapper}>
            <TouchableOpacity style={styles.deleteWrapperIcon} onPress={() => {
              editTreeDetails(details.tree_id)
            }}>
              <PenIcon width={30} height={30} />
            </TouchableOpacity>
            {hasSampleTress && !isSynced ? <TouchableOpacity style={styles.deleteWrapperIcon} onPress={() => {
              deleteTreeDetails(details.tree_id)
            }}>
              <BinIcon width={18} height={18} fill={Colors.TEXT_COLOR} />
            </TouchableOpacity> : null}
          </View>
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>Intervention Date</Text>
            <Text style={styles.valueLable}>
              {timestampToBasicDate(details.plantation_date)}
            </Text>
          </View>
          {details.specie_name && <View style={styles.metaWrapper}>
            <Text style={styles.title}>Species</Text>
            <Text style={styles.speciesName}>{details.specie_name}</Text>
          </View>}
          {details.specie_name && <View style={styles.metaWrapper}>
            <Text style={styles.title}>Local common name</Text>
            <Text style={styles.valueLable}>{details.local_name}</Text>
          </View>}
          <View style={styles.dimensionWrapper}>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>Height</Text>
              <View style={styles.iconMetaWrapper}>
                <HeightIcon width={20} height={20} />
                <Text style={styles.iconLabel}>{details.specie_height}</Text>
              </View>
            </View>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>Width</Text>
              <View style={styles.iconMetaWrapper}>
                <WidthIcon width={20} height={20} />
                <Text style={styles.iconLabel}>{details.specie_diameter}</Text>
              </View>
            </View>
          </View>
          {details.tag_id && (
            <View style={styles.metaWrapper}>
              <Text style={styles.title}>Tag Id</Text>
              <Text style={styles.valueLable}>{details.tag_id}</Text>
            </View>
          )}
        </View>
      )
    })
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {hasDetails && sampleTress[0].tree_type === 'sample'
          ? 'Sample Trees'
          : 'Tree Details'}
      </Text>
      {renderCard()}
    </View>
  )
}

export default SampleTreePreviewList

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(18),
    color: Colors.TEXT_COLOR,
    marginBottom: 5,
    width: '100%',
    paddingLeft: '5%',
  },
  wrapper: {
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: Colors.WHITE,
    borderWidth: 0.5,
    borderColor: '#f2ebdd',
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 8,
    paddingVertical: 10,
  },
  metaWrapper: {
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
  },
  dimensionWrapper: {
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    flex: 1,
  },
  divider: {
    flex: 1,
  },
  iconMetaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
  },
  valueLable: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  speciesName: {
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  iconTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
    marginBottom: 5,
  },
  iconLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 5,
  },
  deleteWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 10,
    top: 10,
    zIndex: 1
  },
  deleteWrapperIcon: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    borderRadius: 8,
  },
})
