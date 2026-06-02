import { StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
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
  const { intervention_updated, dataMigrated } = useSelector((state: RootState) => state.appState)

  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true)
  const realm = useRealm()
  const isPageIncrementPending = useRef(false)
  const hasMoreData = useRef(true)
  const isInitialMount = useRef(true)


  useEffect(() => {
    getRelatedIntervention()
  }, [currentPage, selectedLabel])

  const getQuery = (label: string) => {
    if (label === 'planning') {
      return 'is_planned == true AND NOT (status == "PENDING_DATA_UPLOAD" AND is_complete == true)';
    } else if (label === 'unsync') {
      return 'status == "PENDING_DATA_UPLOAD" AND is_complete == true';
    } else if (label === 'incomplete') {
      return 'is_complete==false AND is_planned == false';
    } else if (label === 'all') {
      return 'intervention_id!=""';
    } else {
      return `intervention_key=="${label}" AND is_planned == false`;
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
    const newItems = JSON.parse(JSON.stringify(objects))
    if (newItems.length > 0) {
      setAllIntervention(prev => [...prev, ...newItems])
    } else {
      // No new items — do NOT update state (avoids new array ref → re-render → onEndReached loop)
      hasMoreData.current = false
    }
    setLoading(false)
    isPageIncrementPending.current = false
  }

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    refreshHandler()
  }, [intervention_updated, dataMigrated])


  const handlePageIncrement = () => {
    if (isPageIncrementPending.current || !hasMoreData.current) return
    isPageIncrementPending.current = true
    setCurrentPage(prev => prev + 1)
  }

  const handleLabel = (s: string) => {
    hasMoreData.current = true
    setAllIntervention([])
    setSelectedLabel(s)
    setCurrentPage(0)
  }

  const refreshHandler = () => {
    hasMoreData.current = true
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
