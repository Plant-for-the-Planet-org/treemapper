import {FlatList, StyleSheet, Text, View} from 'react-native'
import React from 'react'
import OfflineMapCards from './OfflineMapCards'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import useOfflineMapManager from 'src/hooks/realm/useOfflineMapManger'
import Maplibre from '@maplibre/maplibre-react-native'

const OfflineMapList = () => {
  const {deleteOfflineMap} = useOfflineMapManager()
  const allData = useQuery(RealmSchema.OfflineMap, data => {
    return data
  })
  const handleDelte=async(item:any)=>{
    await Maplibre.offlineManager.invalidatePack(item.name)
    await deleteOfflineMap(item)
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={allData}
        renderItem={({item,index}) => <OfflineMapCards data={item} index={index} delete={handleDelte}/>}
        ListHeaderComponent={() => (
          <Text style={styles.header}>Saved Offline Areas</Text>
        )}
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
    color: Colors.TEXT_LIGHT,
    marginTop: 20,
  },
})
