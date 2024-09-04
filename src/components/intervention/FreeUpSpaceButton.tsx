import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import CleanerPhone from 'assets/images/svg/ClearPhone.svg';
import ClearSpaceModal from './ClearSpaceModal';
import i18next from 'src/locales/index'


interface Props {
  handleCleanup: () => void
  imageSize: string
}
const FreeUpSpaceButton = (props: Props) => {
  const { handleCleanup, imageSize } = props;
  const [showModal, setShowModal] = useState(false)
  const toggleModal = () => {
    setShowModal(!showModal)
  }

  const handleFreeSpace = () => {
    setShowModal(false)
    handleCleanup()
  }




  return (
    <>
      <TouchableOpacity style={styles.container} onPress={toggleModal}>
        <View style={styles.wrapper}>
          <CleanerPhone width={25} height={25} />
          <Text style={styles.label}>{i18next.t('label.free_up_space')} {`${imageSize}`}</Text>
        </View>
      </TouchableOpacity>
      <ClearSpaceModal isVisible={showModal} toggleModal={toggleModal} handleFreeSpace={handleFreeSpace} size={imageSize} />
    </>

  )
}

export default FreeUpSpaceButton

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: "center",
    alignItems: 'center',
    marginRight: 15,
    marginLeft: '5%',
  },
  wrapper: {
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    height: '70%',
    paddingHorizontal:10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  label: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginRight: 10,
    color: Colors.TEXT_COLOR
  }
})