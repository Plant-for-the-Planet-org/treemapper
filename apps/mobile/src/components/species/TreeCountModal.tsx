import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Modal from 'react-native-modal'
import { Colors, Typography } from 'src/utils/constants'
import Ionicons from '@expo/vector-icons/Ionicons'
import { InputOutline } from 'react-native-input-outline'
import { scaleFont } from 'src/utils/constants/mixins'
import SpeciesIcon from 'assets/images/svg/SpeciesIcon.svg'
import { InputOutlineMethods } from 'react-native-input-outline/lib/typescript/components/InputOutline'
import i18next from 'src/locales/index'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { AvoidSoftInputView } from 'react-native-avoid-softinput'

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
  const inputRef = React.useRef<InputOutlineMethods>(null)
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    setTreeCount('')
    if (showTreeCountModal) {
      setTimeout(() => {
        inputRef?.current?.focus()
      }, 400)
    }
  }, [showTreeCountModal])

  const handlePressNext = () => {
    if (errorMessage.length > 0 || treeCount === '0' || treeCount.length == 0) {
      return null
    }
    inputRef?.current?.blur()
    onPressTreeCountNextBtn(treeCount)
  }


  const isValidNumberString = (input: string) => {
    const regex = /^\d+(\.\d+)?$/;
    if (regex.test(input)) {
      setTreeCount(input)
      setErrorMessage("")
    } else {
      setErrorMessage("Please input valid Tree count")
    }
  }
  const returnButtonColor = () => {
    if (errorMessage.length || treeCount.length === 0) {
      return Colors.GRAY_BACKDROP
    }
    return Colors.NEW_PRIMARY
  }


  return (
    <Modal style={styles.container}
      isVisible={showTreeCountModal}
      onBackdropPress={() => { }}>
      <AvoidSoftInputView
        avoidOffset={0}
        showAnimationDuration={200}
        style={styles.sectionWrapper}>
        <View style={styles.wrapper}>
          <View style={styles.headerWrapper}>
            <SpeciesIcon />
            <Text style={styles.headerLabel}>{i18next.t("label.total_trees")}</Text>
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
          {activeSpecie && <Text style={styles.note}>{i18next.t('label.how_many')}  <Text style={styles.speciesLabel}>{activeSpecie.aliases.length
            ? activeSpecie.aliases
            : activeSpecie.scientificName}</Text>{i18next.t("label.did_you_plant")}</Text>}
          <View style={styles.inputWrapper}>
            <View style={styles.input}>
              <InputOutline
                style={styles.inputHolder}
                ref={inputRef}
                placeholder={'Tree Count'}
                activeColor={Colors.NEW_PRIMARY}
                inactiveColor={Colors.GRAY_TEXT}
                placeholderTextColor={Colors.GRAY_TEXT}
                fontSize={scaleFont(16)}
                onChangeText={isValidNumberString}
                keyboardType='numeric'
                error={errorMessage.length > 0 ? errorMessage : null}
                fontFamily={Typography.FONT_FAMILY_SEMI_BOLD}
              />
            </View>
            <TouchableOpacity style={[styles.button, { backgroundColor: returnButtonColor()}]} onPress={handlePressNext}>
              <Text style={styles.btnLabel}>{i18next.t("label.continue")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AvoidSoftInputView>
    </Modal>
  )
}

export default TreeCountModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  sectionWrapper: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  wrapper: {
    paddingTop: 10,
    backgroundColor: 'white',
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    color: Colors.DARK_TEXT,
    fontSize: scaleFont(18),
    marginLeft: 15,
    paddingRight: 10
  },
  inputWrapper: {
    width: '100%',
    height: 55,
    flexDirection: 'row',
    marginTop: 20,
  },
  input: {
    width: '60%',
    height: '100%',
    marginHorizontal: 10,
  },
  speciesLabel: {
    fontFamily: Typography.FONT_FAMILY_ITALIC_BOLD
  },
  button: {
    width: "30%",
    height: '100%',
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
