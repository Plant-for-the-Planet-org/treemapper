import { ActivityIndicator, StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from 'src/components/common/Header'
import PolygonMarkerMap from 'src/components/map/PolygonMarkerMap'
import { Colors } from 'src/utils/constants'
import LocationPermissionModal from 'src/components/map/LocationPermissionModal'
import { SafeAreaView } from 'react-native-safe-area-context'
import GpsAccuracyTile from 'src/components/map/GpsAccuracyTile'
import InfoModal from 'src/components/common/InfoModal'
import { useRoute, RouteProp } from '@react-navigation/native'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { InterventionData } from 'src/types/interface/slice.interface'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { setUpIntervention } from 'src/utils/helpers/formHelper/selectIntervention'
import { StatusBar } from 'expo-status-bar'

const PolygonMarker = () => {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [interventionData, setInterventionData] = useState<InterventionData | null>(null)
  const route = useRoute<RouteProp<RootStackParamList, 'PolygonMarker'>>()
  const realm = useRealm()

  const interventionID = route.params?.id ?? '';


  useEffect(() => {
    const InterventionData = realm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, interventionID);
    setInterventionData(InterventionData)
  }, [])

  if (!interventionData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.NEW_PRIMARY} />
      </View>
    )
  }

  const { species_required, location_title } = setUpIntervention(interventionData.intervention_key)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style='dark' />
      <Header label={location_title}
        rightComponent={<GpsAccuracyTile showModalInfo={setShowInfoModal} />} />
      <PolygonMarkerMap
        intervention_key={interventionData.intervention_key}
        species_required={species_required} form_id={interventionData.form_id || interventionData.intervention_id} />
      <InfoModal isVisible={showInfoModal} toggleModal={setShowInfoModal} />
      <LocationPermissionModal/>
    </SafeAreaView>
  )
}

export default PolygonMarker

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
})
