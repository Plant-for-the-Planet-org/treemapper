import { RefreshControl, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { FlashList } from '@shopify/flash-list'
import InterventionCard from './InterventionCard'
import InterventionHeaderSelector from 'src/components/intervention/InterventionHeaderList'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { Colors, Typography } from 'src/utils/constants'
import EmptyIntervention from 'assets/images/svg/EmptyIntervention.svg'
import { lastScreenNavigationHelper } from 'src/utils/helpers/interventionFormHelper'
import DeleteModal from '../common/DeleteModal'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useDispatch } from 'react-redux'
import { updateNewIntervention } from 'src/store/slice/appStateSlice'
import i18next from 'i18next'
interface Props {
  interventionData: InterventionData[] | any[]
  selectedLabel: string
  setSelectedLabel: (s: string) => void
  handlePageIncrement: () => void
  loading: boolean
  refreshHandler: () => void
}

const InterventionList = (props: Props) => {
  const { interventionData, selectedLabel, setSelectedLabel, handlePageIncrement, refreshHandler, loading } = props
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const [deleteData, setDeleteData] = useState(null)
  const [editModal, setEditModal] = useState(null)

  const { resetIntervention, deleteIntervention } = useInterventionManagement()
  const dispatch = useDispatch()

  const handleNavigation = (item: InterventionData) => {
    setDeleteData(null)
    setEditModal(null)
    const navDetails = lastScreenNavigationHelper(item)
    //@ts-expect-error ignore
    navigation.navigate(navDetails.screen, { ...navDetails.params })
  }

  const handleDelete = async (item: InterventionData) => {
    setDeleteData(null)
    await deleteIntervention(item.intervention_id)
    dispatch(updateNewIntervention())
  }

  const handleEdit = async (item: InterventionData) => {
    const d = JSON.parse(JSON.stringify(item))
    setEditModal(null)
    await resetIntervention(item.intervention_id)
    dispatch(updateNewIntervention())
    navigation.navigate("InterventionPreview", { id: 'preview', intervention: d.intervention_id, interventionId: d.intervention_id })
  }

  const showInfoModal = (item: InterventionData) => {
    const obj = JSON.parse(JSON.stringify(item))
    if (!obj.is_complete) {
      setDeleteData(obj)
    } else if (obj.is_complete && item.status !== 'SYNCED') {
      setEditModal(obj)
    } else {
      handleNavigation(obj)
    }
  }


  const emptyIntervention = () => {
    return (
      <View style={styles.emptyBox}>
        <EmptyIntervention />
        <Text style={styles.emptyHeaderLabel}>{i18next.t("label.no_intervention_to_show")}</Text>
        <Text style={styles.emptyLabel}>{i18next.t("label.no_intervention_note1")} {'\n'} {i18next.t("label.keep_track_progress")}</Text>
      </View>
    )
  }

  return (
    <>
      <DeleteModal isVisible={deleteData !== null} toggleModal={setDeleteData} removeFavSpecie={handleNavigation} headerLabel={'Continue Intervention'} noteLabel={'Do you want to continue completing intervention.'} primeLabel={'Continue'} secondaryLabel={'Delete'} extra={deleteData} secondaryHandler={handleDelete} />
      <DeleteModal isVisible={editModal !== null} toggleModal={setEditModal} removeFavSpecie={handleNavigation} headerLabel={'Edit Intervention'} noteLabel={'Do you want to edit intervention.'} primeLabel={'Preview'} secondaryLabel={'Edit'} extra={editModal} secondaryHandler={handleEdit} />
      <FlashList
        data={interventionData}
        renderItem={({ item }) => (
          <InterventionCard
            item={item}
            key={item.intervention_id}
            openIntervention={showInfoModal}
          />
        )}
        estimatedItemSize={100}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshHandler}
          />}
        ListFooterComponent={<View style={styles.footerWrapper} />}
        ListEmptyComponent={emptyIntervention}
        ListHeaderComponent={
          <InterventionHeaderSelector
            selectedLabel={selectedLabel}
            setSelectedLabel={setSelectedLabel}
          />
        }
        onEndReachedThreshold={0.3}
        // keyExtractor={({ intervention_id }) => intervention_id}
        onEndReached={handlePageIncrement}
      />
    </>
  )
}

export default InterventionList

const styles = StyleSheet.create({
  footerWrapper: {
    height: 140,
    width: '100%',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 80
  },
  emptyHeaderLabel: {
    fontSize: 18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    textAlign: 'center',
    marginHorizontal: 50,
    marginVertical: 20,
    color: Colors.DARK_TEXT_COLOR
  },
  emptyLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    textAlign: 'center',
    color: Colors.TEXT_COLOR
  }
})
