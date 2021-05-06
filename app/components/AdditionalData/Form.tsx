import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addForm, deleteForm, getForms } from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { PrimaryButton } from '../Common';
import Page from './Page';

interface FormProps {}

export default function Form(): JSX.Element {
  const [forms, setForms] = useState<any>([]);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      addFormsToState();
    });
    return unsubscribe;
  }, [navigation]);

  const sortFormByOrder = (formsData: any) => {
    return formsData.sort((a: any, b: any) => {
      return a.order - b.order;
    });
  };

  const addNewForm = async () => {
    await addForm({ order: Array.isArray(forms) ? forms.length + 1 : 1 });
    addFormsToState();
  };

  const addFormsToState = () => {
    getForms().then((formsData: any) => {
      if (formsData) {
        setForms(sortFormByOrder(formsData));
      }
    });
  };

  const deleteFormById = (formId: string) => {
    deleteForm(formId).then((success) => {
      if (success) {
        addFormsToState();
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      {Array.isArray(forms) && forms.length > 0 ? (
        forms.map((form: any, index) => (
          <Page
            step={index + 1}
            elements={form.elements}
            key={`form-step-${index}`}
            formId={form.id}
            handleDeletePress={() => deleteFormById(form.id)}
            formOrder={form.order}
          />
        ))
      ) : (
        <View style={styles.formMessageContainer}>
          <Text style={styles.title}>{i18next.t('label.get_started_forms')}</Text>
          <Text>{i18next.t('label.get_started_forms_description')}</Text>
          <PrimaryButton btnText={i18next.t('label.create_form')} onPress={addNewForm} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    flex: 1,
  },
  formMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
  },
});
