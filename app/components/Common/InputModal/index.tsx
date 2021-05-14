import i18next from 'i18next';
import React, { useRef } from 'react';
import {
  Modal,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, CommonStyles, Typography } from '../../../styles';

interface IInputModalProps {
  value: any;
  setValue: any;
  onSubmitInputField: any;
  isOpenModal: any;
  setIsOpenModal: any;
  inputType: any;
  isRequired?: boolean;
  placeholder?: string;
}

const InputModal = ({
  value,
  setValue,
  onSubmitInputField,
  isOpenModal,
  setIsOpenModal,
  inputType,
  isRequired = false,
  placeholder = '',
}: IInputModalProps) => {
  const onSubmit = () => {
    if (isRequired && !value) {
      return;
    }
    Keyboard.dismiss();
    onSubmitInputField();
    setIsOpenModal(false);
  };

  const textInput = useRef<TextInput>(null);
  return (
    <Modal
      transparent={true}
      visible={isOpenModal}
      onShow={() => {
        textInput?.current.focus();
      }}>
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
              placeholder={placeholder}
              multiline={true}
              onChangeText={(text) => {
                if (inputType === 'text') {
                  setValue(text);
                } else {
                  setValue(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
                }
              }}
              onSubmitEditing={onSubmit}
            />
            <MCIcon
              onPress={onSubmit}
              name={'arrow-right'}
              size={30}
              color={isRequired && value ? Colors.PRIMARY : Colors.GRAY_DARK}
            />
          </View>
          {isRequired ? (
            <Text style={styles.requiredFieldLabel}>{i18next.t('label.required_field')}</Text>
          ) : (
            []
          )}
        </KeyboardAvoidingView>
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
  requiredFieldLabel: {
    backgroundColor: Colors.GRAY_LIGHT,
    color: Colors.TEXT_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderRadius: 4,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
});

export default InputModal;
