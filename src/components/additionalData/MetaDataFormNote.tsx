import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import i18next from 'src/locales/index';
import { Typography, Colors } from 'src/utils/constants';
import CustomButton from '../common/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';

const MetaDataFormNote: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handlePress = () => {
    navigation.navigate('MetaDataElement');
  };

  return (
    <View style={styles.containerMeta}>
      <View style={styles.formMessageContainerMeta}>
        <Text style={styles.titleMeta}>{i18next.t('label.get_started_forms')}</Text>
        <Text style={styles.descMeta}>{i18next.t('label.get_started_forms_description')}</Text>
        <CustomButton label={i18next.t('label.create__meta_form')}
          pressHandler={handlePress} containerStyle={styles.btnContainerMeta} />
      </View>
    </View>
  );
};

export default MetaDataFormNote;

const styles = StyleSheet.create({
  containerMeta: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formMessageContainerMeta: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '95%',
    marginTop: '20%',
  },
  titleMeta: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
    paddingHorizontal: 20,
  },
  descMeta: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  btnContainerMeta: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
