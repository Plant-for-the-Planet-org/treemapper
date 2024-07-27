import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { Inventory } from 'src/types/interface/slice.interface'
import { Typography } from 'src/utils/constants'
import WrapperIcon from 'assets/images/svg/ExportJsonIcon.svg'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'

import { convertData, onlyExportJSON } from 'src/utils/helpers/exportOldInventory'
import Header from 'src/components/common/Header'


const OldInvenoryDataView = () => {
  const [inventoryData, setInventoryData] = useState<Inventory[]>([])
  const realm = useRealm()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    showOldData()
  }, [])

  const showOldData = async () => {
    const data = realm.objects<Inventory>(RealmSchema.Inventory).filtered('status != "SYNCED"')
    setInventoryData([...data])
  }

  const exportData = async (el: Inventory) => {
    setLoading(true)
    await convertData(el)
    setLoading(false)
  }

  const renderItemElement = (i: Inventory) => {
    return <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lableText}>{i.inventory_id}</Text>
          <Text style={styles.lableText}>{i.status}</Text>
        </View>
        <Pressable style={styles.rightCorner} onPress={() => { exportData(i) }}>
          <WrapperIcon />
        </Pressable>
        <Pressable style={styles.rightCorner} onPress={() => { onlyExportJSON(i) }}>
          <InfoIcon />
        </Pressable>
      </View>
    </View>
  }



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor:"white" }}>
      {loading && <View style={{ position: 'absolute', zIndex: 10, alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', height: '100%' }}>
        <ActivityIndicator size={'large'} />
      </View>}
      <Header label='Back' />
      <FlatList
        data={inventoryData}
        renderItem={({ item }) => renderItemElement(item)}
      />
    </SafeAreaView>
  )
}

export default OldInvenoryDataView

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    marginVertical: 20,
    borderWidth:0.5,
    borderColor:'lightgray'
  },
  wrapper: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lableText: {
    color: "red",
    fontSize: 20,
    marginTop: 20,
    flex: 1
  },
  rightCorner: {
    marginRight: 20
  }
})