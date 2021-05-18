import i18next from 'i18next';
import React from 'react';
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
} from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, CommonStyles } from '_styles';
import { species_default } from '../../../assets';
import { Header } from '../';

export default function TreeCountModal({
  showTreeCountModal,
  activeSpecie,
  setTreeCount,
  treeCount,
  onPressTreeCountNextBtn,
}) {
  let specieName = showTreeCountModal ? activeSpecie?.aliases : '';
  return (
    <Modal visible={showTreeCountModal} transparent={true}>
      <View style={styles.modalBackground}>
        <View style={styles.inputModal}>
          <Image
            source={activeSpecie?.image ? { uri: `${activeSpecie.image}` } : species_default}
            style={{
              alignSelf: 'center',
              marginVertical: 20,
              width: 150,
              height: 100,
              borderRadius: 5,
              resizeMode: activeSpecie?.image ? null : 'contain',
            }}
          />
          {/* {activeSpecie.image ? (
            <Image
              source={{
                uri: `${activeSpecie.image}`,
              }}
              style={{ alignSelf: 'center', marginVertical: 20 }}
            />
          ) : (
            []
          )} */}
          <Header
            hideBackIcon
            subHeadingText={i18next.t('label.select_species_tree_count_modal_header')}
            textAlignStyle={{ textAlign: 'center' }}
          />
          <Header
            hideBackIcon
            subHeadingText={i18next.t('label.select_species_tree_count_modal_sub_header', {
              specieName,
            })}
            textAlignStyle={{ textAlign: 'center', fontStyle: 'italic' }}
          />
          <Header
            hideBackIcon
            subHeadingText={i18next.t('label.select_species_tree_count_modal_sub_header_2')}
            textAlignStyle={{ textAlign: 'center' }}
          />
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
            value={treeCount.toString()}
            style={CommonStyles.bottomInputText}
            autoFocus
            placeholderTextColor={Colors.TEXT_COLOR}
            onChangeText={(text) => setTreeCount(text.replace(/[^0-9]/g, ''))}
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
  );
}

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
});
