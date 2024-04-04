import i18next from 'i18next'
import React, {useState, useEffect} from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons'
import {Colors, CommonStyles, Typography} from 'src/utils/constants'
import MultipleTreeIcon from 'assets/images/svg/MultiTreeIcon.svg'
import Ionicons from '@expo/vector-icons/Ionicons'
import {IScientificSpecies} from 'src/types/interface/app.interface'

interface TreeCountModalProps {
  showTreeCountModal: boolean
  setShowTreeCountModal: any
  activeSpecie: any
  setTreeCount: any
  treeCount: string
  onPressTreeCountNextBtn: any
  speciesInfo: IScientificSpecies
}

const TreeCountModal: React.FC<TreeCountModalProps> = ({
  showTreeCountModal,
  setShowTreeCountModal,
  activeSpecie,
  setTreeCount,
  treeCount,
  onPressTreeCountNextBtn,
  speciesInfo
}) => {
  const specieName = showTreeCountModal ? activeSpecie?.aliases : ''
  const [specie, setSpecie] = useState<IScientificSpecies>()

  const inputRef = React.useRef(null)

  useEffect(() => {
    setTimeout(() => {
      inputRef?.current?.focus()
    }, 400)
    if (activeSpecie?.id && showTreeCountModal) {
      setSpecie(speciesInfo)
      setTreeCount(activeSpecie.treeCount)
    }
  }, [activeSpecie, showTreeCountModal])

  return (
    <Modal visible={showTreeCountModal} transparent={true}>
      <View style={styles.modalBackground}>
        <View style={styles.inputModal}>
          <Ionicons
            name={'close'}
            size={30}
            color={Colors.TEXT_COLOR}
            onPress={() => {
              setShowTreeCountModal(false)
            }}
          />
          {activeSpecie?.image ? (
            <Image
              source={{uri: `${activeSpecie?.image}`}}
              style={styles.image}
            />
          ) : specie?.image ? (
            <Image source={{uri: `${specie?.image}`}} style={styles.image} />
          ) : (
            <View style={styles.iconContainer}>
              <MultipleTreeIcon width={150} height={120} />
            </View>
          )}
          <View style={styles.textCon}>
            <Text style={styles.speciesText}>
              {i18next.t('label.select_species_tree_count_modal_header')}
            </Text>
            {i18next.t('label.select_species_tree_count_modal_sub_header')}
            {specieName}
            <Text style={styles.speciesText}>
              {i18next.t('label.select_species_tree_count_modal_sub_header_2')}
            </Text>
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
        style={styles.bgWhite}>
        <View style={CommonStyles.bottomInputContainer}>
          <Text style={CommonStyles.bottomInputLabel}>
            {i18next.t('label.select_species_modal_label')}
          </Text>
          <TextInput
            ref={inputRef}
            value={treeCount?.toString()}
            style={CommonStyles.bottomInputText}
            placeholderTextColor={Colors.TEXT_COLOR}
            onChangeText={text => setTreeCount(text.replace(/[^0-9]/g, ''))}
            keyboardType={'number-pad'}
          />
          <MCIcon
            onPress={onPressTreeCountNextBtn}
            name={'arrow-right'}
            size={30}
            color={Colors.PRIMARY}
          />
        </View>
        <SafeAreaView />
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
  inputModal: {
    backgroundColor: Colors.WHITE,
    marginVertical: 30,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    width: '80%',
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
  speciesText: {
    marginTop: 16,
    marginHorizontal: 20,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  speciesName: {
    marginTop: 16,
    marginHorizontal: 20,
    fontFamily: Typography.FONT_FAMILY_ITALIC_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    textAlign: 'center',
  },
  textCon: {
    marginBottom: 8,
  },
  image: {
    alignSelf: 'center',
    marginVertical: 20,
    width: 150,
    height: 100,
    borderRadius: 5,
  },
  iconContainer: {
    alignSelf: 'center',
    marginTop: 10,
    borderBottomWidth: 2,
    borderColor: '#d3d3d350',
  },
})
