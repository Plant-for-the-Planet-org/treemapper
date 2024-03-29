import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import Modal from 'react-native-modal'
import FilterMapIcon from 'assets/images/svg/FilterMinimal.svg'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import {Colors} from 'src/utils/constants'
import CustomDropDownPicker from '../common/CustomDropDown'
interface Props {
  isVisible: boolean
  toogleModal: () => void
}

const ProjectModal = (props: Props) => {
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
            <Text style={styles.headerLable}>Zoom To Site</Text>
            <View style={styles.divider} />
            <CloseIcon style={styles.iconWrapper} onPress={toogleModal} />
          </View>
          <CustomDropDownPicker />
        </View>
      </View>
    </Modal>
  )
}

export default ProjectModal

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
    backgroundColor: Colors.GRAY_BACKDROP,
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
    fontSize: 18,
  },
  cardLable: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  divider: {
    flex: 1,
  },
})
