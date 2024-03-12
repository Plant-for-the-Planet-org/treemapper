import React, { useRef, useState } from 'react';
import { Modalize } from 'react-native-modalize';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

import MultipleTreeIconBackdrop from 'assets/images/svg/MultipleTreeIconBackdrop.svg';
import FolderIcon from 'assets/images/svg/Folder.svg';
import Exclamation from 'assets/images/svg/Exclamation.svg';
import SyncFail from 'assets/images/svg/SyncFail.svg';
import SyncSuccess from 'assets/images/svg/SyncSuccess.svg';
import CleanerPhone from 'assets/images/svg/ClearPhone.svg';

import { Colors, Typography } from 'src/utils/constants';
import {LinearGradient} from 'expo-linear-gradient';

const FILTER_TYPES = ['All', 'Incomplete', 'Synced', 'Unsynced'];
const INTERVENTION_DATA = [
  {
    title: '1 Apple Tree',
    type: ['On Site', 'Point'],
    createdAt: 'Feb 18, 2020',
    synced: false,
    complete: false,
  },
  {
    title: '24 Tree',
    type: ['On Site', 'Point'],
    createdAt: 'Feb 18, 2020',
    synced: true,
    complete: true,
  },
  {
    title: '136 m',
    type: ['Fire Break', 'On Site', 'Point'],
    createdAt: 'Feb 18, 2020',
    synced: false,
    complete: false,
  },
  {
    title: '8 m2',
    type: ['Invasive Grass Removal', 'On Site', 'Point'],
    createdAt: 'Feb 18, 2020',
    synced: true,
    complete: true,
  },
  {
    title: '12 m2',
    type: ['Invasive Grass Removal', 'On Site', 'Point'],
    createdAt: 'Feb 18, 2020',
    synced: false,
    complete: true,
  },
];

function getColor(key: string) {
  switch (key) {
    case 'Point':
      return { color: '#F2994A', backgroundColor: '#F2994A20' };
    case 'On Site':
    case 'Invasive Grass Removal':
      return { color: Colors.PRIMARY, backgroundColor: Colors.PRIMARY + '20' };
    case 'Fire Break':
      return { color: '#EB5757', backgroundColor: '#EB575720' };
    default:
      break;
  }
}

const Interventions = () => {
  const [interventionsList, setInterventionsList] = useState<Array<unknown>>(INTERVENTION_DATA);
  const [selectedFilter, setSelectedFilter] = useState<string>(FILTER_TYPES[0]);

  const modalizeRef = useRef<Modalize>(null);

  const handleEdit = () => {};
  const onOpen = () => {
    modalizeRef.current?.open();
  };
  const onClose = () => {
    modalizeRef.current?.close();
  };

  const _handleSelectFilter = (item: string) => () => {
    setSelectedFilter(item);
    if (item === 'All') {
      setInterventionsList(INTERVENTION_DATA);
    } else if (item === 'Incomplete') {
      setInterventionsList(INTERVENTION_DATA.filter(el => !el.complete));
    } else if (item === 'Synced') {
      setInterventionsList(INTERVENTION_DATA.filter(el => el.synced));
    } else {
      setInterventionsList(INTERVENTION_DATA.filter(el => !el.synced && el.complete));
    }
  };

  const filteredLength = (key: string) => {
    if (key === 'All') {
      return INTERVENTION_DATA.length;
    } else if (key === 'Incomplete') {
      return INTERVENTION_DATA.filter(el => !el.complete).length;
    } else if (key === 'Synced') {
      return INTERVENTION_DATA.filter(el => el.synced).length;
    } else {
      return (
        INTERVENTION_DATA.filter(el => !el.synced).length -
        INTERVENTION_DATA.filter(el => !el.complete).length
      );
    }
  };

  const renderFilters = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.filterItemCon,
        item === selectedFilter
          ? {
              backgroundColor: Colors.PRIMARY_DARK,
            }
          : { borderWidth: 1, borderColor: Colors.GRAY_MEDIUM },
      ]}
      onPress={_handleSelectFilter(item)}>
      <Text
        style={[
          styles.filterLabel,
          item === selectedFilter && {
            fontWeight: Typography.FONT_WEIGHT_BOLD,
            color: Colors.WHITE,
            marginTop: 0,
          },
        ]}>
        {item === 'All' ? `${item} ${filteredLength(item)}` : `${filteredLength(item)} ${item}`}
      </Text>
    </TouchableOpacity>
  );

  const renderIntervention = ({ item }) => (
    <View style={[styles.itemCon, styles.boxShadow]}>
      <View style={styles.itemInfoCon}>
        <View style={styles.avatar}>{item.complete ? <MultipleTreeIconBackdrop /> : <Exclamation />}</View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <View style={styles.typeCon}>
            {item.type.map((type, index) => (
              <View
                key={index}
                style={[styles.itemWrap, { backgroundColor: getColor(type)?.backgroundColor }]}>
                <Text style={[styles.type, { color: getColor(type)?.color }]}>{type}</Text>
              </View>
            ))}
          </View>
          {!item.complete && <Text style={styles.itemDate}>{item.createdAt}</Text>}
        </View>
      </View>
      {!item.complete ? (
        <View style={styles.btns}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEdit} style={styles.editBtn}>
            <FontAwesome name="pencil" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEdit} style={styles.trashBtn}>
            <FontAwesome name="trash" size={20} color={Colors.ALERT} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.btns, { position: 'absolute', right: 25, top: 7 }]}>
            <Text style={styles.itemDate}>{item.createdAt}</Text>
          </View>
          <View
            style={[
              styles.syncContainer,
              {
                backgroundColor: item.synced ? Colors.PRIMARY + '20' : Colors.PLANET_CRIMSON + '20',
              },
            ]}>
            {item.synced ? <SyncSuccess /> : <SyncFail />}
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpen} activeOpacity={0.7} style={styles.freeSpaceBtn}>
          <CleanerPhone />
          <Text style={styles.freeSpaceTxt}>Free up space</Text>
        </TouchableOpacity>
      </View>
      <LinearGradient
        colors={['rgba(224, 224, 224, 0.15)', '#fff', 'rgba(224, 224, 224, 0.15)']}
        style={{ flex: 1 }}>
        <FlatList
          horizontal
          data={[...FILTER_TYPES]}
          style={styles.filterList}
          renderItem={renderFilters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListCon}
          keyExtractor={(item, index) => `FILTER_TYPES${index}`}
        />
        <FlatList
          data={interventionsList}
          contentContainerStyle={styles.interventionList}
          renderItem={renderIntervention}
          keyExtractor={(item, index) => `INTERVENTION_DATA${index}`}
        />
      </LinearGradient>

      <Modalize
        withReactModal
        ref={modalizeRef}
        withHandle={false}
        adjustToContentHeight
        modalStyle={styles.modalContainer}>
        <View style={styles.modal}>
          <FolderIcon />
          <Text style={styles.modalTitle}>Clear Up Some Space</Text>
          <Text style={styles.modalDesc}>
            Reclaim storage by removing local copies of images. All files will continue to be
            available in the cloud.
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.btnFreeSpace}>Free up space</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </SafeAreaView>
  );
};

export default Interventions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingRight: 16,
  },
  freeSpaceBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderColor: Colors.PRIMARY + '10',
    backgroundColor: Colors.PRIMARY + '20',
  },
  freeSpaceTxt: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_10,
    color: Colors.TEXT_COLOR,
  },
  filterItemCon: {
    marginRight: 5,
    borderRadius: 120,
    backgroundColor: Colors.WHITE,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterLabel: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_14,
  },
  filterList: {
    marginTop: 16,
    maxHeight: 30,
    paddingHorizontal: 16,
  },
  flatListCon: {
    alignItems: 'center',
    paddingRight: 25,
  },
  interventionList: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#8282821A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCon: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.WHITE,
  },
  itemInfoCon: {
    flexDirection: 'row',
  },
  itemInfo: {
    marginLeft: 13,
  },
  itemTitle: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: '#4F4F4F',
  },

  typeCon: {
    flexDirection: 'row',
  },
  itemWrap: {
    borderRadius: 4,
    marginRight: 4,
    marginVertical: 6,
  },
  type: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    fontSize: Typography.FONT_SIZE_8,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
  },
  itemDate: {
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
  btns: {
    flexDirection: 'row',
    marginRight: 15,
    height: '85%',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY + '20',
  },
  trashBtn: {
    width: 28,
    height: 28,
    marginLeft: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PLANET_CRIMSON + '20',
  },
  syncContainer: {
    top: 0,
    right: 0,
    width: 32,
    height: 26,
    alignItems: 'center',
    position: 'absolute',
    borderTopRightRadius: 8,
    justifyContent: 'center',
    borderBottomLeftRadius: 8,
  },
  boxShadow: {
    // shadow
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4.62,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    marginTop: 281,
    borderRadius: 12,
    marginBottom: 251,
    alignSelf: 'center',
    marginHorizontal: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    marginTop: 16,
    fontSize: Typography.FONT_SIZE_18,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
  modalDesc: {
    marginTop: 4,
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.DARK_TEXT_COLOR,
    textAlign: 'center',
  },
  btnFreeSpace: {
    marginTop: 22,
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
});
