import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import { SampleTree } from 'src/types/interface/slice.interface'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import DetailIcon from 'assets/images/svg/DetailIcon.svg'
import RemeasurementIcon from 'assets/images/svg/RemeasurementIcon.svg'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import DeleteModal from '../common/DeleteModal'
import i18next from 'src/locales/index'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { nonISUCountries } from 'src/utils/constants/appConstant'
import { INTERVENTION_STATUS } from 'src/types/type/app.type'

interface Props {
  sampleTress: SampleTree[]
  interventionId: string
  hasSampleTress: boolean
  isSynced: boolean
  status: INTERVENTION_STATUS
  selectedTree: string
}

const SampleTreePreviewList = (props: Props) => {
  const { sampleTress, interventionId, hasSampleTress, isSynced, status, selectedTree } = props
  const [deleteData, setDeleteData] = useState(null)
  const { country, type } = useSelector((state: RootState) => state.userState)
  const Country = country
  const { deleteSampleTreeIntervention } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const deleteTreeDetails = async (id: string) => {
    await deleteSampleTreeIntervention(id, interventionId)
  }



  const handleDelete = async (item: any) => {
    deleteTreeDetails(item)
    setDeleteData(null)
  }



  const editTreeDetails = async (id: string) => {
    navigation.navigate("ReviewTreeDetails", { detailsCompleted: false, interventionID: id, synced: isSynced, id: interventionId })
  }

  const viewTreeDetails = async (id: string) => {
    navigation.navigate("ReviewTreeDetails", { detailsCompleted: false, interventionID: id, synced: true, id: interventionId })
  }

  const remeasurement = async (id: string) => {
    navigation.navigate("TreeRemeasurement", { interventionId: interventionId, treeId: id })
  }

  const getConvertedMeasurementText = (measurement: any, unit: 'cm' | 'm' = 'cm'): string => {
    let text = i18next.t('label.tree_review_unable');
    const isNonISUCountry: boolean = nonISUCountries.includes(Country);

    if (measurement && isNonISUCountry) {
      text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${i18next.t(
        unit === 'cm' ? 'label.select_species_inches' : 'label.select_species_feet',
      )} `;
    } else if (measurement) {
      text = ` ${Math.round(Number(measurement) * 1000) / 1000} ${unit} `;
    }
    return text;
  };


  const hasDetails = sampleTress && sampleTress.length > 0
  const renderCard = () => {
    return sampleTress.map((details, i) => {
      const uri = details.cdn_image_url ? `${process.env.EXPO_PUBLIC_API_PROTOCOL}://cdn.plant-for-the-planet.org/media/cache/coordinate/large/${details.cdn_image_url}` : details.image_url

      return (
        <View style={[styles.wrapper, { backgroundColor: details.tree_id === selectedTree ? Colors.NEW_PRIMARY + '1A' : Colors.WHITE }]} key={details.tree_id + i}>
          <DeleteModal isVisible={deleteData !== null} toggleModal={setDeleteData} removeFavSpecie={handleDelete} headerLabel={'Delete Tree'} noteLabel={'Are you sure you want to Delete this tree.'} primeLabel={'Delete'} secondaryLabel={'Cancel'} extra={deleteData} />
          <View style={styles.deleteWrapper}>
            {status === 'INITIALIZED' && <TouchableOpacity style={styles.deleteWrapperIcon} onPress={() => {
              editTreeDetails(details.tree_id)
            }}>
              <PenIcon width={30} height={30} />
            </TouchableOpacity>}
            {hasSampleTress && !isSynced && status === 'INITIALIZED' ? <TouchableOpacity style={styles.deleteWrapperIcon} onPress={() => {
              setDeleteData(details.tree_id)
            }}>
              <BinIcon width={18} height={18} fill={Colors.TEXT_COLOR} />
            </TouchableOpacity> : null}
            {type === 'tpo' && details.tree_type !== 'single' && details.status === 'SYNCED' ? <TouchableOpacity style={styles.editWrapperIcon} onPress={() => {
              remeasurement(details.tree_id)
            }}>
              <RemeasurementIcon width={30} height={30} fill={Colors.TEXT_COLOR} />
            </TouchableOpacity> : null}
            {status !== 'INITIALIZED' ? <TouchableOpacity style={styles.editWrapperIcon} onPress={() => {
              viewTreeDetails(details.tree_id)
            }}>
              <DetailIcon width={30} height={30} fill={Colors.TEXT_COLOR} />
            </TouchableOpacity> : null}
          </View>
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>{i18next.t("label.intervention_date")}</Text>
            <Text style={styles.valueLabel}>
              {timestampToBasicDate(details.plantation_date)}
            </Text>
          </View>
          <View style={styles.imageSectionWrapper}>
            <Image source={{ uri: uri }} style={styles.imageWrapper} />
            <View style={styles.mainMetaWrapperContent}>
              {!!details.specie_name && <View style={styles.metaWrapperContent}>
                <Text style={styles.title}>{i18next.t("label.species")}</Text>
                <Text style={styles.speciesName}>{details.specie_name}</Text>
              </View>}
              {!!details.local_name && <View style={styles.metaWrapperContent}>
                <Text style={styles.title}>{i18next.t("label.local_common_name")}</Text>
                <Text style={styles.valueLabel}>{details.local_name}</Text>
              </View>}
            </View>
          </View>
          <View style={styles.dimensionWrapper}>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>{i18next.t("label.height")}</Text>
              <View style={styles.iconMetaWrapper}>
                <HeightIcon width={10} height={20} />
                <Text style={styles.iconLabel}> {getConvertedMeasurementText(details.specie_height, 'm')}</Text>
              </View>
            </View>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>{i18next.t("label.dbh")}</Text>
              <View style={styles.iconMetaWrapper}>
                <View style={styles.iconHolder}>
                  <WidthIcon width={20} height={20} />
                </View>
                <Text style={styles.iconLabel}> {getConvertedMeasurementText(details.specie_diameter)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.footerMeta}>
            {!!details.tag_id && (
              <View style={styles.footermetaWrapper}>
                <Text style={styles.title}>Tag Id</Text>
                <Text style={styles.valueLabel}>{details.tag_id}</Text>
              </View>
            )}
            {!!details.hid && (
              <View style={styles.footermetaWrapper}>
                <Text style={styles.title}>HID</Text>
                <Text style={styles.valueLabel}>{details.hid}</Text>
              </View>
            )}
          </View>
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
  imageSectionWrapper: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
    alignItems: 'center',

  },
  imageWrapper: {
    marginLeft: '5%',
    width: 100,
    height: 100,
    borderRadius: 12
  },

  mainMetaWrapperContent: {
  },
  metaWrapperContent: {

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
  valueLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: 14,
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  speciesName: {
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: 14,
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  iconTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(13),
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
    marginBottom: 5,
  },
  iconLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
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
  editWrapperIcon: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 8,
  },
  iconHolder: {
    marginTop: 10
  },
  footerMeta:{
    width:'100%',
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row'
  },
  footermetaWrapper:{
    flex:1
  }
})
