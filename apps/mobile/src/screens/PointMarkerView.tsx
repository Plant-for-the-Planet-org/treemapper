import { ActivityIndicator, StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import Header from 'src/components/common/Header'
import PointMarkerMap from 'src/components/map/PointMarkerMap'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import InfoModal from 'src/components/common/InfoModal'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useObject } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { StatusBar } from 'expo-status-bar'

const PointMarkerView = () => {
  const [showInfoModal, setShowInfoModal] = useState(false)

  const route = useRoute<RouteProp<RootStackParamList, 'PointMarker'>>()

  const interventionID = route.params?.id ?? '';

  // A live query, not a one-off snapshot. This screen is reused for every
  // sample tree in the loop, so it is not remounted between trees. The map
  // draws existing tree markers from sample_trees and rejects a pin placed too
  // close to one, and both need the current list, not the one from first mount.
  const interventionData = useObject<InterventionData>(
    RealmSchema.Intervention, interventionID
  )

  if (!interventionData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style='dark' />
      <Header
        label={"Select Location"}
        rightComponent={<GpsAccuracyTile showModalInfo={setShowInfoModal} />}
      />
      <PointMarkerMap interventionKey={interventionData.intervention_key} form_id={interventionData.form_id || interventionData.intervention_id} tree_details={interventionData.sample_trees} siteId={interventionData.site_id} />
      <InfoModal isVisible={showInfoModal} toggleModal={setShowInfoModal} />
      <UserlocationMarker stopAutoFocus />
      <LocationPermissionModal/>
    </SafeAreaView>
  )
}

export default PointMarkerView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
