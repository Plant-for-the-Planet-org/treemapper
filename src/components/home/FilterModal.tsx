import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import FilterMapIcon from 'assets/images/svg/FilterMinimal.svg'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import Switch from '../common/Switch'
import { Colors } from 'src/utils/constants'
interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const FilterModal = (props: Props) => {
  const {isVisible, toogleModal} = props
  return (
    <Modal
      style={styles.container}
      isVisible={isVisible}
      onBackdropPress={toogleModal}>
      <View style={styles.sectionWrapper}>
        <View style={styles.contnetWrapper}>
          <View style={styles.header}>
            <FilterMapIcon onPress={() => {}} style={styles.iconWrapper} />
            <Text style={styles.headerLable}>Filters</Text>
            <View style={styles.divider} />
            <CloseIcon style={styles.iconWrapper} onPress={toogleModal}/>
          </View>
          <View style={[styles.card,{backgroundColor:Colors.NEW_PRIMARY + '1A'}]}>
            <Text style={styles.cardLable}>Interventions</Text>
            <View style={styles.divider} />
            <Switch value={true} onValueChange={() => {}} disabled={false} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLable}>Monitoring Plots</Text>
            <View style={styles.divider} />
            <Switch value={false} onValueChange={() => {}} disabled={false} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLable}>Only Interverntion that need {'\n'} remeasurment</Text>
            <View style={styles.divider} />
            <Switch value={false} onValueChange={() => {}} disabled={false} />
          </View>
          <View />
        </View>
      </View>
    </Modal>
  )
}

export default FilterModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  sectionWrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  contnetWrapper: {
    width: '95%',
    paddingTop: 10,
  },
  card: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.GRAY_LIGHT
  },
  header: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrapper: {
    marginHorizontal: 10,
  },
  headerLable: {
    fontSize: 20,
  },
  cardLable: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  divider: {
    flex: 1,
  },
})
