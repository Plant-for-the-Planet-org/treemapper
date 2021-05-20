import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {
  deleteMetadataField,
  getMetadata,
  updateMetadata,
} from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24 } from '../../styles/design';
import { accessTypes } from '../../utils/additionalDataConstants';
import { sortByField } from '../../utils/sortBy';
import { PrimaryButton } from '../Common';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AdditionalDataButton from './AdditionalDataButton';
import KeyValueInput from './KeyValueInput';

export default function Metadata({ route }: any): JSX.Element {
  const [metadata, setMetadata] = useState<any>([]);
  const [dragging, setDragging] = useState<boolean>(false);

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      addMetadataInState();
    });
    return unsubscribe;
  }, [navigation]);

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

  const onSwipe = (fieldId: string = '') => {
    deleteMetadataField(fieldId).then((success) => {
      if (success) {
        addMetadataInState();
      }
    });
  };
  console.log('metadata', metadata);
  return (
    <ScrollView style={styles.container}>
      <DraggableFlatList
        data={metadata}
        contentContainerStyle={
          metadata && metadata.length === 0 ? styles.container : { paddingBottom: 30 }
        }
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
                onPress={() =>
                  navigation.navigate('AddMetadata', {
                    metadataOrder: item.order,
                    metadataId: item.id,
                    fieldKey: item.key,
                    fieldValue: item.value,
                    isPublic: item.accessType === accessTypes.PUBLIC,
                  })
                }
              />
            </SwipeDeleteRow>
          </View>
        )}
        keyExtractor={(item: any) => `metadata-field-${item.id}`}
        onDragEnd={({ data }) => updateMetadataOrder(data)}
        ListEmptyComponent={() => {
          return (
            <View style={[styles.emptyFormMessageContainer, styles.marginLeft8]}>
              <Text style={styles.title}>{i18next.t('label.get_started_metadata')}</Text>
              <Text style={styles.desc}>{i18next.t('label.get_started_metadata_description')}</Text>
              <PrimaryButton
                btnText={i18next.t('label.create_metadata')}
                onPress={() =>
                  navigation.navigate('AddMetadata', {
                    metadataOrder: metadata.length,
                  })
                }
              />
            </View>
          );
        }}
        ListFooterComponent={() => {
          if (metadata.length > 0) {
            return (
              <AdditionalDataButton
                buttonType="field"
                handleButtonPress={() =>
                  navigation.navigate('AddMetadata', {
                    metadataOrder: metadata.length,
                  })
                }
                style={styles.marginLeft8}
              />
            );
          } else {
            return <></>;
          }
        }}
        scrollEnabled={false}
      />
    </ScrollView>
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
  emptyFormMessageContainer: {
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
  desc: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
});
