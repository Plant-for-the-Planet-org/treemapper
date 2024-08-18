import { ActivityIndicator, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import PointMarkerMap from 'src/components/map/PointMarkerMap'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import InfoModal from 'src/components/common/InfoModal'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import UserlocationMarker from 'src/components/map/UserlocationMarker'
import { InterventionData } from 'src/types/interface/slice.interface'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'

const PointMarkerView = () => {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [interventionData, setInterventionData] = useState<InterventionData | null>(null)
  
  const route = useRoute<RouteProp<RootStackParamList, 'PointMarker'>>()
  const realm = useRealm()

  const interventionID = route.params?.id ?? '';

  useEffect(() => {
    const InterventionData = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
    setInterventionData(InterventionData)
  }, [])

  if (!interventionData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        label={"Select Location"}
        rightComponent={<GpsAccuracyTile showModalInfo={setShowInfoModal} />}
      />
      <PointMarkerMap interventionKey={interventionData.intervention_key} form_id={interventionData.form_id || interventionData.intervention_id} tree_details={interventionData.sample_trees} />
      <InfoModal isVisible={showInfoModal} toggleModal={setShowInfoModal} />
      <UserlocationMarker stopAutoFocus />
      <LocationPermissionModal required />
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
