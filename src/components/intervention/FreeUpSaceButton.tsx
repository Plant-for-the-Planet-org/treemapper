import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import CleanerPhone from 'assets/images/svg/ClearPhone.svg';
import ClearSpaceModal from './ClearSpaceModal';
import i18next from 'src/locales/index'

const FreeUpSaceButton = () => {
  const [showModal, setModal] = useState(false)
  const tooglemodal = () => {
    setModal(!showModal)
  }

  const handleFreeSpace = () => {
    setModal(false)
  }


  return (
    <>
      <TouchableOpacity style={styles.container} onPress={tooglemodal}>
        <View style={styles.wrapper}>
          <CleanerPhone width={25} height={25} />
          <Text style={styles.lable}>{i18next.t('label.free_up_space')}</Text>
        </View>
      </TouchableOpacity>
      <ClearSpaceModal isVisible={showModal} toogleModal={tooglemodal} handleFreeSpace={handleFreeSpace} />
    </>

  )
}

export default FreeUpSaceButton

const styles = StyleSheet.create({
  container: {
    width: '35%',
    height: '100%',
    justifyContent: "center",
    alignItems: 'center',
    marginRight: 15,
  },
  wrapper: {
    backgroundColor: Colors.NEW_PRIMARY + '1A',
    height: '70%',
    width: '100%',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  lable: {
    fontSize: scaleFont(12),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    marginRight: 10,
    color: Colors.TEXT_COLOR
  }
})