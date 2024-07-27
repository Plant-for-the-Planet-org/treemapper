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
  const [selectedLabel, setSelectedLabel] = useState('all')
  const [allIntervention, setAllIntervention] = useState<InterventionData[] | any[]>([])
  const { intervention_updated } = useSelector((state: RootState) => state.appState)

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true)
  const realm = useRealm()


  useEffect(() => {
    getRelatedIntervention()
  }, [currentPage, selectedLabel])

  const getQuery = (label) => {
    if (label === 'unsync') {
      return 'status != "SYNCED" AND is_complete == true';
    } else if (label === 'incomplete') {
      return 'is_complete==false';
    } else if (label === 'all') {
      return 'intervention_id!=""';
    } else {
      return `intervention_key=="${label}"`;
    }
  };

  const getRelatedIntervention = () => {
    const query = getQuery(selectedLabel);
    const start = currentPage * 20;
    const end = start + 20;
    const objects = realm
      .objects(RealmSchema.Intervention)
      .filtered(query)
      .slice(start, end);
    setAllIntervention([...allIntervention, ...JSON.parse(JSON.stringify(objects))])
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

  const handleLabel = (s: string) => {
    setAllIntervention([])
    setSelectedLabel(s)
    setCurrentPage(0)
  }

  const refreshHandler = () => {
    setLoading(true)
    setAllIntervention([])
    setCurrentPage(0);
  }



  return (
    <SafeAreaView style={styles.container}>
      <InterventionHeader />
      <View style={styles.section}>
        <InterventionList interventionData={allIntervention} setSelectedLabel={handleLabel} selectedLabel={selectedLabel} handlePageIncrement={handlePageIncrement} refreshHandler={refreshHandler} loading={loading} />
      </View>
    </SafeAreaView>
  )
}

export default InterventionView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  section: {
    flex: 1,
    backgroundColor: Colors.BACKDROP_COLOR
  }
})
