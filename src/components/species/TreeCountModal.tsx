import React, { useState, useEffect } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Colors, Typography } from 'src/utils/constants'
import Ionicons from '@expo/vector-icons/Ionicons'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { InputOutline } from 'react-native-input-outline'
import { scaleFont } from 'src/utils/constants/mixins'
import SpeciesIcon from 'assets/images/svg/SpeciesIcon.svg'

interface TreeCountModalProps {
  showTreeCountModal: boolean
  setShowTreeCountModal: any
  activeSpecie: IScientificSpecies
  onPressTreeCountNextBtn: any
}

const TreeCountModal: React.FC<TreeCountModalProps> = ({
  showTreeCountModal,
  setShowTreeCountModal,
  activeSpecie,
  onPressTreeCountNextBtn,
}) => {
  const [treeCount, setTreeCount] = useState('')
  const inputRef = React.useRef(null)

  useEffect(() => {
    setTreeCount('')
    if (showTreeCountModal) {
      setTimeout(() => {
        inputRef?.current?.focus()
      }, 400)
    }
  }, [showTreeCountModal])

  const handlePressNext = () => {
    onPressTreeCountNextBtn(treeCount)
  }

  return (
    <Modal visible={showTreeCountModal} transparent={true}>
      <View style={styles.modalBackground}>
      </View>
      <KeyboardAvoidingView
        behavior={'position'} style={styles.keyboarview}>
        <View style={styles.bottomInputContainer}>
          <View style={styles.wrapper}>
            <View style={styles.headerWrapper}>
              <SpeciesIcon />
              <Text style={styles.headerLabel}>Total Tress</Text>
              <View style={styles.divider} />
              <Ionicons
                name={'close'}
                size={30}
                color={Colors.TEXT_COLOR}
                onPress={() => {
                  setShowTreeCountModal(null)
                }}
              />
            </View>
            {activeSpecie && <Text style={styles.note}>How many  {activeSpecie.aliases.length
                  ? activeSpecie.aliases
                  : activeSpecie.scientific_name} did you plant ?</Text>}
            <View style={styles.inputWrapper}>
              <View style={styles.input}>
                <InputOutline
                  style={styles.inputHolder}
                  value={''}
                  ref={inputRef}
                  placeholder={'Tree Count'}
                  activeColor={Colors.NEW_PRIMARY}
                  inactiveColor={Colors.GRAY_TEXT}
                  placeholderTextColor={Colors.GRAY_TEXT}
                  fontSize={scaleFont(16)}
                  onChangeText={() => { }}
                  keyboardType='number-pad'
                  fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
                />
              </View>
              <TouchableOpacity style={styles.button} onPress={handlePressNext}>
                <Text style={styles.btnLabel}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default TreeCountModal

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  keyboarview: {
    backgroundColor: "green",
    margin: 0,
    padding: 0
  },
  wrapper: {
    width: '100%',
    paddingTop: 10,
    backgroundColor: 'white',
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  bottomInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderColor: Colors.TEXT_COLOR,
    width: '100%',
    borderRadius: 20,
    position: 'absolute',
    bottom: 0
  },
  headerWrapper: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  headerLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    fontSize: scaleFont(20),
    marginLeft: 20
  },
  divider: {
    flex: 1
  },
  note: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
    fontSize: scaleFont(18),
    marginLeft: 15
  },
  inputWrapper: {
    width: '100%',
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  input: {
    width: '60%',
    height: '100%',
    marginHorizontal: 10
  },
  button: {
    width: "30%",
    height: '100%',
    backgroundColor: Colors.NEW_PRIMARY,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputHolder: {
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '90%',
    height: '100%',
    marginHorizontal: '5%',
  },
  btnLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
    fontSize: scaleFont(16),
  },
})
