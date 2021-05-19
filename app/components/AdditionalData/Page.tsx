import { useNavigation } from '@react-navigation/core';
import i18next from 'i18next';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Colors, Typography } from '../../styles';
import { marginTop24 } from '../../styles/design';
import SwipeDeleteRow from '../Common/SwipeDeleteRow';
import AdditionalDataButton from './AdditionalDataButton';
import ElementSwitcher from './ElementSwitcher';

interface IPageProps {
  pageNo: number;
  elements: any;
  formId: string;
  handleDeletePress: any;
  formOrder: number;
  updateForm: any;
  deleteElement: (elementIndex: any) => void;
}

export default function Page({
  pageNo,
  elements,
  formId,
  handleDeletePress,
  formOrder,
  updateForm,
  deleteElement,
}: IPageProps) {
  const [dragging, setDragging] = useState<boolean>(false);

  const navigation = useNavigation();

  const handleButtonPress = () => {
    navigation.navigate('SelectElement', { formId, formOrder });
  };

  const renderItem = useCallback(
    ({ item, index, drag }: RenderItemParams<any>) => {
      return (
        <SwipeDeleteRow
          style={marginTop24}
          onSwipe={() => deleteElement(index)}
          isDraggable
          drag={drag}
          dragging={dragging}
          setDragging={setDragging}>
          <ElementSwitcher {...item} />
        </SwipeDeleteRow>
      );
    },
    [dragging, setDragging],
  );

  console.log('elements', elements);

  return (
    <View style={[styles.pageContainer, pageNo > 1 ? styles.newPage : {}]}>
      <View style={[styles.formHeading, styles.paddingLeft8]}>
        <Text style={styles.formHeadingText}>{i18next.t('label.form_page', { pageNo })}</Text>
        <TouchableOpacity style={styles.deleteIcon} onPress={handleDeletePress}>
          <FeatherIcon name="trash-2" size={20} color={Colors.ALERT} />
        </TouchableOpacity>
      </View>
      <DraggableFlatList
        data={elements}
        renderItem={renderItem}
        keyExtractor={(item) => `elements-${item.id}`}
        onDragEnd={({ data }) => {
          setDragging(false);
          updateForm(data);
        }}
        scrollEnabled={false}
        contentContainerStyle={styles.pageContents}
        ListFooterComponent={() => (
          <AdditionalDataButton handleButtonPress={handleButtonPress} style={styles.marginLeft8} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    paddingRight: 25,
    paddingLeft: 17,
    flexGrow: 1,
    paddingTop: 24,
  },
  newPage: {
    borderTopWidth: 2,
    borderTopColor: Colors.LIGHT_BORDER_COLOR,
    borderStyle: 'dashed',
    paddingTop: 40,
  },
  pageContents: { paddingBottom: 30 },
  formHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formHeadingText: {
    fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
    fontSize: Typography.FONT_SIZE_22,
    color: Colors.TEXT_COLOR,
    marginRight: 24,
  },
  deleteIcon: {
    padding: 10,
  },
  paddingLeft8: {
    paddingLeft: 8,
  },
  marginLeft8: {
    marginLeft: 8,
  },
});
