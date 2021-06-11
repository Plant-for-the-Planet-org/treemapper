import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors, Typography } from '../../styles';
import { marginTop24, marginTop30 } from '../../styles/design';
import { Header, PrimaryButton } from '../Common';
import OutlinedInput from '../Common/OutlinedInput';

interface IKeyValueFormProps {
  headingText: string;
  showPublicToggle: boolean;
  handleOnSubmit: (fieldData: any) => void;
  fieldKey?: string;
  fieldValue?: string;
  isPublic?: boolean;
  onBackPress?: any;
}

const KeyValueForm = ({
  headingText,
  showPublicToggle,
  handleOnSubmit,
  fieldKey: fieldKeyProp = '',
  fieldValue: fieldValueProp = '',
  isPublic: isPublicProp = false,
  onBackPress,
}: IKeyValueFormProps) => {
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldKeyError, setFieldKeyError] = useState<string>('');

  const [fieldValue, setFieldValue] = useState<string>('');
  const [fieldValueError, setFieldValueError] = useState<string>('');

  const [isPublic, setIsPublic] = useState<boolean>(false);

  const allowedKeyCharacters = new RegExp(/^[a-zA-Z0-9 _-]+$/);

  useEffect(() => {
    setFieldKey(fieldKeyProp || '');
    setFieldValue(fieldValueProp || '');
    setIsPublic(isPublicProp || false);
  }, [fieldKeyProp, fieldValueProp]);

  const areFieldsValid = () => {
    let errorCount = 0;
    if (!fieldKey) {
      setFieldKeyError(i18next.t('label.field_key_required'));
      errorCount += 1;
    } else if (!allowedKeyCharacters.test(fieldKey)) {
      setFieldKeyError(i18next.t('label.invalid_key_error'));
      errorCount += 1;
    } else {
      setFieldKeyError('');
    }

    if (!fieldValue) {
      setFieldValueError(i18next.t('label.field_value_required'));
      errorCount += 1;
    } else {
      setFieldValueError('');
    }

    return errorCount === 0;
  };

  const handleOnPress = () => {
    const fieldData = {
      key: fieldKey,
      value: fieldValue,
      isPublic,
    };
    if (areFieldsValid()) {
      handleOnSubmit(fieldData);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <ScrollView>
          <Header headingText={headingText} onBackPress={onBackPress} />
          <OutlinedInput
            label={i18next.t('label.additional_data_field_key')}
            value={fieldKey}
            onChangeText={setFieldKey}
            error={fieldKeyError}
            style={marginTop24}
          />
          <OutlinedInput
            label={i18next.t('label.additional_data_field_value')}
            value={fieldValue}
            onChangeText={setFieldValue}
            error={fieldValueError}
            style={marginTop24}
          />
          {showPublicToggle && (
            <View style={[styles.switchContainer, marginTop30]}>
              <Text style={styles.switchText}>{i18next.t('label.make_this_public')}</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#d4e7b1' }}
                thumbColor={isPublic ? Colors.PRIMARY : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setIsPublic(!isPublic)}
                value={isPublic}
              />
            </View>
          )}
        </ScrollView>
        <PrimaryButton
          onPress={handleOnPress}
          btnText={i18next.t('label.continue')}
          style={{ marginTop: 10 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default KeyValueForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    marginRight: 10,
  },
});
