import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import InterventionList from 'src/components/intervention/InterventionList'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { InterventionData } from 'src/types/interface/slice.interface'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import InterventionHeader from 'src/components/intervention/InterventionHeader'

const InterventionView = () => {
  const [selectedLabel, setSlectedLabel] = useState('all')
  const [allIntervention, setInterventionData] = useState<InterventionData[] | any[]>([])
  const { intervention_updated } = useSelector((state: RootState) => state.appState)

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true)
  const realm = useRealm()


  useEffect(() => {
    getReleatedIntervention()
  }, [currentPage, selectedLabel])

  const getReleatedIntervention = () => {
    const query = selectedLabel === 'unsync' ? 'status != "SYNCED" AND is_complete == true' : selectedLabel === 'incomplete' ? 'is_complete==false' : selectedLabel === 'all' ? 'intervention_id!=""' : `intervention_key=="${selectedLabel}"`;
    const start = currentPage * 20;
    const end = start + 20;
    const objects = realm
      .objects(RealmSchema.Intervention)
      .filtered(query)
      .slice(start, end);
    setInterventionData([...allIntervention, ...JSON.parse(JSON.stringify(objects))])
    setLoading(false)
  }

  useEffect(() => {
    if (!loading) {
      refreshHandler()
    }
  }, [intervention_updated])


  const handlePageIncrement = () => {
    setCurrentPage(currentPage + 1)
  }

  const handleLable = (s: string) => {
    setInterventionData([])
    setSlectedLabel(s)
    setCurrentPage(0)
  }

  const refreshHandler = () => {
    setLoading(true)
    setInterventionData([])
    setCurrentPage(0);
  }



  return (
    <SafeAreaView style={styles.cotnainer}>
      <InterventionHeader />
      <View style={styles.section}>
        <InterventionList interventionData={allIntervention} setSlectedLabel={handleLable} selectedLabel={selectedLabel} handlePageIncrement={handlePageIncrement} refreshHandler={refreshHandler} loading={loading} />
      </View>
    </SafeAreaView>
  )
}

export default InterventionView

const styles = StyleSheet.create({
  cotnainer: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  section: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR
  }
})
