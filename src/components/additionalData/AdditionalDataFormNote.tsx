import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from 'src/utils/constants';
import i18next from 'src/locales';
import CustomButton from '../common/CustomButton';

interface Props {
  newForm: () => void;
}

const AdditionalDataFormNote = ({ newForm }: Props) => (
  <View style={styles.containerNote}>
    <View style={styles.formMessageContainerNote}>
      <Text style={styles.titleNote}>{i18next.t('label.get_started_forms')}</Text>
      <Text style={styles.descNote}>{i18next.t('label.get_started_forms_description')}</Text>
      <CustomButton
        label={i18next.t('label.create_form')}
        pressHandler={newForm}
        containerStyle={styles.btnContainerNote}
      />
    </View>
  </View>
);

export default AdditionalDataFormNote;

const styles = StyleSheet.create({
  containerNote: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formMessageContainerNote: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '95%',
    marginTop: '20%',
  },
  titleNote: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
    paddingHorizontal: 20,
  },
  descNote: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  btnContainerNote: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
