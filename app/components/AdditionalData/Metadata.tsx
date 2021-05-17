import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {
  addOrUpdateMetadataField,
  deleteMetadataField,
  getMetadata,
  updateMetadata,
} from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24 } from '../../styles/design';
import { sortByField } from '../../utils/sortBy';
import { InputModal, PrimaryButton } from '../Common';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AdditionalDataButton from './AdditionalDataButton';
import DragHandle from './DragHandle';
import KeyValueInput from './KeyValueInput';

interface MetadataProps {}

type toEditType = 'key' | 'value';

export default function Metadata(props: MetadataProps): JSX.Element {
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<string>('');
  const [metadata, setMetadata] = useState<any>([]);
  const [showTempField, setShowTempField] = useState<boolean>(false);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [toEdit, setToEdit] = useState<toEditType>('key');
  const [placeholder, setPlaceholder] = useState<string>('');
  const [selectedField, setSelectedField] = useState<any>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    addMetadataInState();
  }, []);

  const addMetadataInState = () => {
    getMetadata().then((data: any) => {
      if (data) {
        setMetadata(sortByField('order', data));
      }
    });
  };

  const updateMetadataOrder = async (updatedMetadata: any) => {
    await updateMetadata(updatedMetadata).then((success: boolean) => {
      if (success) {
        addMetadataInState();
      }
    });
  };

  const resetFieldState = () => {
    setFieldKey('');
    setFieldValue('');
    setSelectedField(null);
  };

  const addTempField = () => {
    resetFieldState();
    setShowTempField(true);
    editText('key');
  };

  const editText = (editType: toEditType, field: any = null) => {
    setToEdit(editType);

    setPlaceholder(
      editType === 'key' ? i18next.t('label.field_key') : i18next.t('label.field_value'),
    );
    if (field?.id) {
      setFieldKey(field.key);
      setFieldValue(field.value);
      setSelectedField(field);
    }
    setShowInputModal(true);
  };

  const validateAndModifyField = () => {
    if (fieldKey && fieldValue) {
      const fieldData = {
        id: selectedField?.id,
        key: fieldKey,
        value: fieldValue,
        order: selectedField?.order ? selectedField.order : metadata.length,
      };
      addOrUpdateMetadataField(fieldData).then((success: boolean) => {
        if (success) {
          addMetadataInState();
          setShowTempField(false);
          resetFieldState();
        }
      });
    }
  };

  const onSwipe = (fieldId: string = '') => {
    if (!fieldId && showTempField) {
      setShowTempField(false);
    } else {
      deleteMetadataField(fieldId).then((success) => {
        if (success) {
          addMetadataInState();
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={metadata}
        renderItem={({ item, drag }: any) => (
          <View style={styles.fieldWrapper} key={`metadata-${item.id}`}>
            <SwipeDeleteRow
              onSwipe={() => onSwipe(item.id)}
              isDraggable
              drag={drag}
              dragging={dragging}
              setDragging={setDragging}>
              <KeyValueInput
                fieldKey={item.key}
                fieldValue={item.value}
                editText={(editType: toEditType) => editText(editType, item)}
              />
            </SwipeDeleteRow>
          </View>
        )}
        keyExtractor={(item: any) => `metadata-field-${item.id}`}
        onDragEnd={({ data }) => updateMetadataOrder(data)}
        ListEmptyComponent={() => {
          if (!showTempField) {
            return (
              <View style={styles.formMessageContainer}>
                <Text style={styles.title}>{i18next.t('label.get_started_forms')}</Text>
                <Text>{i18next.t('label.get_started_forms_description')}</Text>
                <PrimaryButton btnText={i18next.t('label.create_form')} onPress={addTempField} />
              </View>
            );
          } else return <></>;
        }}
        ListFooterComponent={() => {
          if (showTempField) {
            return (
              <View style={marginTop24}>
                <SwipeDeleteRow onSwipe={() => onSwipe()} setDragging={setDragging}>
                  <KeyValueInput
                    fieldKey={fieldKey}
                    fieldValue={fieldValue}
                    editText={(editType: toEditType) => editText(editType)}
                  />
                </SwipeDeleteRow>
              </View>
            );
          }
          if (metadata.length > 0) {
            return (
              <AdditionalDataButton
                buttonType="field"
                handleButtonPress={addTempField}
                style={styles.marginLeft8}
              />
            );
          } else {
            return <></>;
          }
        }}
      />
      {showInputModal ? (
        <InputModal
          inputType="text"
          onSubmitInputField={validateAndModifyField}
          isOpenModal={showInputModal}
          setIsOpenModal={setShowInputModal}
          placeholder={placeholder}
          value={toEdit === 'key' ? fieldKey : fieldValue}
          setValue={toEdit === 'key' ? setFieldKey : setFieldValue}
          isRequired
        />
      ) : (
        []
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 25,
    paddingLeft: 17,
    backgroundColor: Colors.WHITE,
    flex: 1,
  },
  fieldWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
    ...marginTop24,
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
  marginLeft8: {
    marginLeft: 8,
  },
});
