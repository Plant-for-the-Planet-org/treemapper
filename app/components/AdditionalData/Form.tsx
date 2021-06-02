import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  addForm,
  deleteForm,
  deleteFormElement,
  getForms,
  updateForm,
} from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { MULTI, OFF_SITE, ON_SITE, SAMPLE, SINGLE } from '../../utils/inventoryConstants';
import { filterFormByTreeAndRegistrationType, sortByField } from '../../utils/sortBy';
import { Loader, PrimaryButton } from '../Common';
import Dropdown from '../Common/Dropdown';
import Page from './Page';

interface IFormProps {
  filteredForm: any;
  addFormsToState: any;
  loading: boolean;
  registrationTypeOptions: any;
  setRegistrationType: React.Dispatch<React.SetStateAction<string>>;
  treeTypeOptions: React.Dispatch<React.SetStateAction<any>>;
  setTreeType: React.Dispatch<React.SetStateAction<string>>;
  selectedTreeOption: React.Dispatch<React.SetStateAction<any>>;
  addNewForm: any;
}

export default function Form({
  filteredForm,
  addFormsToState,
  loading,
  registrationTypeOptions,
  setRegistrationType,
  treeTypeOptions,
  setTreeType,
  selectedTreeOption,
  addNewForm,
}: IFormProps): JSX.Element {
  const deleteFormById = (formId: string) => {
    deleteForm(formId).then((success) => {
      if (success) {
        addFormsToState();
      }
    });
  };

  const updateFormElements = async (elements: any, formId: any) => {
    await updateForm({ elements, id: formId }).then((success) => {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        { flexGrow: 1 },
        loading || (Array.isArray(filteredForm) && filteredForm.length > 0)
          ? {}
          : styles.alignCenter,
      ]}>
      {loading ? (
        <Loader
          isLoaderShow={loading}
          loadingText={i18next.t('label.loading_form_editor')}
          isModal={false}
        />
      ) : (
        Array.isArray(filteredForm) &&
        filteredForm.length > 0 && (
          <>
            <View style={styles.formFilterContainer}>
              <Dropdown
                label={i18next.t('label.registrationType')}
                options={registrationTypeOptions}
                onChange={(type: any) => setRegistrationType(type.key)}
                defaultValue={treeTypeOptions[0]}
                editable={true}
                containerStyle={{ marginRight: 16, flex: 1 }}
                backgroundLabelColor={'#f2f2f2'}
                containerBackgroundColor={'#f2f2f2'}
              />
              <Dropdown
                label={i18next.t('label.treeType')}
                options={treeTypeOptions}
                onChange={(type: any) => setTreeType(type.key)}
                defaultValue={registrationTypeOptions[0]}
                editable={true}
                containerStyle={{ flex: 1 }}
                backgroundLabelColor={'#f2f2f2'}
                containerBackgroundColor={'#f2f2f2'}
                selectedOption={selectedTreeOption}
              />
            </View>
            {filteredForm.map((form: any, index: number) => (
              <Page
                pageNo={index + 1}
                title={form.title}
                elements={form.elements}
                key={`form-page-${index}`}
                formId={form.id}
                handleDeletePress={() => deleteFormById(form.id)}
                formOrder={form.order}
                updateFormElements={(elements: any) => updateFormElements(elements, form.id)}
                deleteElement={(elementIndex: number) =>
                  deleteElementFromForm(form.id, elementIndex)
                }
                reloadForm={addFormsToState}
              />
            ))}
          </>
        )
      )}
      {!loading && Array.isArray(filteredForm) && filteredForm.length === 0 && (
        <>
          <Text style={styles.title}>{i18next.t('label.get_started_forms')}</Text>
          <Text style={styles.desc}>{i18next.t('label.get_started_forms_description')}</Text>
          <PrimaryButton btnText={i18next.t('label.create_form')} onPress={addNewForm} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  alignCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  formMessageContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
  },
  desc: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'left',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  formFilterContainer: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 1,
    height: 80,
  },
});
