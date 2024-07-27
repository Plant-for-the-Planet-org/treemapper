import i18next from 'i18next';
import React, { useRef } from 'react';
import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  Text,
  ReturnKeyTypeOptions,
  TouchableOpacity,
  KeyboardType,
} from 'react-native';
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, CommonStyles, Typography } from 'src/utils/constants';

interface IInputModalProps {
  value: any;
  setValue: any;
  onSubmitInputField: any;
  isOpenModal: any;
  inputType: KeyboardType;
  isRequired?: boolean;
  placeholder?: string;
  returnKeyType?: ReturnKeyTypeOptions;
}

const EditInputModal = ({
  value,
  setValue,
  onSubmitInputField,
  isOpenModal,
  inputType,
  isRequired = false,
  placeholder = '',
  returnKeyType = 'default',
}: IInputModalProps) => {

  const textInput = useRef<TextInput>(null);
  const setFocus = () => {
    setTimeout(() => {
      textInput?.current.focus();
    }, 300)
  }
  return (
    <Modal
      transparent={true}
      visible={isOpenModal}
      onShow={setFocus}
    >
      <View style={styles.cont}>
        <View style={styles.cont} />
        <KeyboardAvoidingView
          behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
          style={styles.bgWhite}>
          <View style={CommonStyles.bottomInputContainer}>
            <TextInput
              ref={textInput}
              defaultValue={value}
              keyboardType={inputType}
              style={CommonStyles.bottomInputText}
              placeholder={placeholder}
              multiline={true}
              onChangeText={(text) => {
                if (inputType === 'default') {
                  setValue(text);
                } else {
                  setValue(text.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
                }
              }}
              returnKeyType={returnKeyType}
            />
            <TouchableOpacity style={{ padding: 10 }} onPress={onSubmitInputField}>
              <MCIcon
                name={'arrow-right'}
                size={30}
                color={(isRequired && value) || !isRequired ? Colors.PRIMARY : Colors.GRAY_DARK}
              />
            </TouchableOpacity>
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

export default EditInputModal;
