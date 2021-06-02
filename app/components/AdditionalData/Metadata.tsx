import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {
  deleteMetadataField,
  getMetadata,
  updateMetadata,
} from '../../repositories/additionalData';
import { Colors, Typography } from '../../styles';
import { marginTop24 } from '../../styles/design';
import { accessTypes } from '../../utils/additionalData/constants';
import { sortByField } from '../../utils/sortBy';
import { Loader, PrimaryButton } from '../Common';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AdditionalDataButton from './AdditionalDataButton';
import KeyValueInput from './KeyValueInput';

interface IMetadataProps {
  metadata: any;
  updateMetadataOrder: any;
  addMetadataInState: any;
  loading: boolean;
}

const { width } = Dimensions.get('window');

export default function Metadata({
  metadata,
  updateMetadataOrder,
  addMetadataInState,
  loading,
}: IMetadataProps): JSX.Element {
  const [dragging, setDragging] = useState<boolean>(false);

  const navigation = useNavigation();

  const onSwipe = (fieldId: string = '') => {
    deleteMetadataField(fieldId).then((success) => {
      if (success) {
        addMetadataInState();
      }
    });
  };

  return (
    <>
      {loading ? (
        <Loader
          isLoaderShow={loading}
          loadingText={i18next.t('label.loading_form_editor')}
          isModal={false}
        />
      ) : !metadata || (metadata && metadata.length) === 0 ? (
        <View style={[styles.emptyFormMessageContainer]}>
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
      ) : (
        <DraggableFlatList
          style={styles.container}
          data={metadata}
          contentContainerStyle={
            metadata && metadata.length === 0
              ? {
                  justifyContent: 'center',
                  alignItems: 'center',
                }
              : { paddingBottom: 30 }
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
          dragHitSlop={{ right: -width + 50 + 36 }}
          keyExtractor={(item: any) => `metadata-field-${item.id}`}
          onDragEnd={({ data }) => updateMetadataOrder(data)}
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
        />
      )}
    </>
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
    paddingHorizontal: 25,
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
    textAlign: 'left',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
});
