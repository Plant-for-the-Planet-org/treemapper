import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import OfflineMapCards from './OfflineMapCards'
import { scaleFont } from 'src/utils/constants/mixins'
import { Colors, Typography } from 'src/utils/constants'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useOfflineMapManager from 'src/hooks/realm/useOfflineMapManger'
import MapLibreGL from '@maplibre/maplibre-react-native'
import DeleteModal from '../common/DeleteModal'
import i18next from 'src/locales/index'

const OfflineMapList = () => {

  const [deleteData, setDeleteData] = useState(null)

  const { deleteOfflineMap } = useOfflineMapManager()
  const allData = useQuery(RealmSchema.OfflineMap, data => {
    return data
  })
  const handleDelete = async (item: any) => {
    await MapLibreGL.offlineManager.invalidatePack(item.name)
    await deleteOfflineMap(item)
    setDeleteData(null)
  }

  const renderHeader = () => (
    <Text style={styles.header}>{i18next.t("label.save_offline_area")}</Text>
  )

  const renderEmptyComp = () => (
    <Text style={styles.emptylabel}>{i18next.t("label.no_offline_map")}</Text>
  )

  return (
    <View style={styles.container}>
      <DeleteModal isVisible={deleteData !== null} toggleModal={setDeleteData} removeFavSpecie={handleDelete} headerLabel={'Delete Map'} noteLabel={'Are you sure you want to this map.'} primeLabel={'Delete'} secondaryLabel={'Cancel'} extra={deleteData} />
      <FlatList
        data={allData}
        renderItem={({ item }) => <OfflineMapCards data={item} delete={setDeleteData} />}
        ListEmptyComponent={renderEmptyComp}
        ListHeaderComponent={renderHeader}
      />
    </View>
  )
}

export default OfflineMapList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginLeft: 20,
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    marginTop: 20,
  },
  emptylabel: {
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_LIGHT,
    marginTop: 100,
    width: '100%',
    textAlign: 'center'
  },
})
