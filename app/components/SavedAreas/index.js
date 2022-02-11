import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import { placeholder_image } from '../../assets';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { getAllOfflineMaps, deleteOfflineMap } from '../../repositories/maps';
import i18next from 'i18next';

const SavedAreas = ({ navigation }) => {
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    getAllOfflineMaps().then((offlineMaps) => {
      setAreas(offlineMaps);
    });
  };

  const deleteArea = async (name) => {
    deleteOfflineMap({ name }).then(async () => {
      setTimeout(async () => await MapboxGL.offlineManager.deletePack(name), 0);
      loadAreas();
    });
  };

  const onPressAddArea = () => {
    navigation.navigate('DownloadMap');
  };

  const renderSavedAreaItem = ({ item }) => {
    const { areaName, size, name } = item;
    return (
      <View style={styles.areaContainer}>
        <View style={styles.areaImageContainer}>
          <Image source={placeholder_image} resizeMode={'stretch'} />
        </View>
        <View style={styles.areaContentContainer}>
          <Text style={styles.subHeadingText}>{areaName}</Text>
          <View style={styles.bottomContainer}>
            <Text style={[styles.subHeadingText, styles.regularText]}>{`${size / 1000} MB`}</Text>
            <Text style={[styles.subHeadingText, styles.redText]} onPress={() => deleteArea(name)}>
              {i18next.t('label.save_areas_delete')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        <Header headingText={i18next.t('label.save_areas_header')} />
        <View style={styles.areaListContainer}>
          {areas && areas.length > 0 ? (
            <FlatList data={areas} renderItem={renderSavedAreaItem} />
          ) : areas && areas.length == 0 ? (
            <Text style={{ alignSelf: 'center', textAlignVertical: 'center', margin: 20 }}>
              {i18next.t('label.save_areas_offline')}
            </Text>
          ) : (
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          )}
        </View>
        <PrimaryButton onPress={onPressAddArea} btnText={i18next.t('label.save_areas_add_area')} />
      </View>
    </SafeAreaView>
  );
};
export default SavedAreas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  areaContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    elevation: 2,
    borderWidth: 0,
    marginVertical: 10,
    marginHorizontal: 25,
    borderRadius: 10,
  },
  areaImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaContentContainer: {
    flex: 1.2,
    justifyContent: 'space-evenly',
    marginHorizontal: 20,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  areaListContainer: {
    flex: 1,
    marginHorizontal: -25,
    paddingBottom: 10,
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_REGULAR,
  },
  redText: {
    color: 'red',
  },
  regularText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
    textAlign: 'center',
  },
});
