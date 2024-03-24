import {StyleSheet, View} from 'react-native'
import React, {useState} from 'react'
import DisplayMap from 'src/components/map/DisplayMap'
import HomeHeader from 'src/components/home/HomeHeader'
import AppModal from 'src/components/home/HomeModal'

const HomeMapView = () => {
  const [showFilterModal, setFileterModal] = useState(false)

  const toogleFilterModal = () => {
    setFileterModal(!showFilterModal)
  }

  return (
    <View style={styles.contaner}>
      <HomeHeader toogleFilterModal={toogleFilterModal} />
      <DisplayMap />
      <AppModal isVisible={showFilterModal} toogleModal={toogleFilterModal}/>
    </View>
  )
}

export default HomeMapView

const styles = StyleSheet.create({
  contaner: {
    flex: 1,
  },
})
