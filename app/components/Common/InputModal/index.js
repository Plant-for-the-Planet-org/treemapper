import React, { useRef } from 'react';
import {
  Modal,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, CommonStyles } from '_styles';

const InputModal = ({
  value,
  setValue,
  onSubmitInputField,
  isOpenModal,
  setIsOpenModal,
  inputType,
}) => {
  const textInput = useRef(null);
  return (
    <Modal
      transparent={true}
      visible={isOpenModal}
      onShow={() => {
        textInput.current.focus();
      }}>
      <View style={styles.cont}>
        <View style={styles.cont}>
          <View style={styles.cont} />
          <KeyboardAvoidingView
            behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
            style={styles.bgWhite}>
            <View style={CommonStyles.bottomInputContainer}>
              <TextInput
                value={value}
                ref={textInput}
                keyboardType={inputType === 'text' ? 'default' : 'decimal-pad'}
                style={CommonStyles.bottomInputText}
                // autoFocus={true}
                placeholderTextColor={Colors.TEXT_COLOR}
                multiline={true}
                onChangeText={(text) => {
                  if (inputType === 'text') {
                    setValue(text);
                  } else {
                    setValue(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
                  }
                }}
                onSubmitEditing={() => {
                  onSubmitInputField();
                  setIsOpenModal(false);
                }}
              />
              <MCIcon
                onPress={() => {
                  setIsOpenModal(false);
                  Keyboard.dismiss();
                  onSubmitInputField();
                }}
                name={'arrow-right'}
                size={30}
                color={Colors.PRIMARY}
              />
            </View>
            <SafeAreaView />
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cont: {
    flex: 1,
  },
  bgWhite: {
    backgroundColor: Colors.WHITE,
  },
});

export default InputModal;
