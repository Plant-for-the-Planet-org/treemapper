import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  addForm,
  deleteForm,
  deleteFormElement,
  getForms,
  updateFormElements,
} from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { sortByField } from '../../utils/sortBy';
import { Loader, PrimaryButton } from '../Common';
import Page from './Page';

interface FormProps {}

export default function Form(): JSX.Element {
  const [forms, setForms] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      addFormsToState();
    });
    return unsubscribe;
  }, [navigation]);

  const addNewForm = async () => {
    await addForm({ order: Array.isArray(forms) ? forms.length + 1 : 1 });
    addFormsToState();
  };

  const addFormsToState = () => {
    getForms().then((formsData: any) => {
      if (formsData) {
        setForms(sortByField('order', formsData));
      }
      setLoading(false);
    });
  };

  const deleteFormById = (formId: string) => {
    deleteForm(formId).then((success) => {
      if (success) {
        addFormsToState();
      }
    });
  };

  const updateForm = async (elements: any, formId: any) => {
    await updateFormElements({ elements, formId }).then((success) => {
      if (success) {
        addFormsToState();
      }
    });
  };

  const deleteElementFromForm = (formId: string, elementIndexToDelete: number) => {
    deleteFormElement(formId, elementIndexToDelete).then((success) => {
      if (success) {
        addFormsToState();
      }
    });
  };

  console.log('loading', loading);

  return (
    <ScrollView>
      <View style={styles.container}>
        {loading ? (
          <Loader isLoaderShow={loading} loadingText={i18next.t('label.loading_content')} />
        ) : Array.isArray(forms) && forms.length > 0 ? (
          forms.map((form: any, index) => (
            <Page
              step={index + 1}
              elements={form.elements}
              key={`form-step-${index}`}
              formId={form.id}
              handleDeletePress={() => deleteFormById(form.id)}
              formOrder={form.order}
              updateForm={(elements: any) => updateForm(elements, form.id)}
              deleteElement={(elementIndex: number) => deleteElementFromForm(form.id, elementIndex)}
            />
          ))
        ) : (
          <View style={styles.formMessageContainer}>
            <Text style={styles.title}>{i18next.t('label.get_started_forms')}</Text>
            <Text>{i18next.t('label.get_started_forms_description')}</Text>
            <PrimaryButton btnText={i18next.t('label.create_form')} onPress={addNewForm} />
          </View>
        )}
      </View>
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
