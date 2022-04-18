import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import {
  getInventoryByLocationId,
  getSampleTreeBySampleTreeId,
} from '../../repositories/inventory';
import { Colors, Typography } from '../../styles';
import { setRemeasurementId } from '../../actions/inventory';
import { InventoryContext } from '../../reducers/inventory';
import { useNavigation } from '@react-navigation/native';
import { APIConfig } from '../../actions/Config';
import RNFS from 'react-native-fs';
import { single_tree_png } from '../../assets';
import { cmToInch, meterToFoot, nonISUCountries } from '../../utils/constants';
import i18next from 'i18next';
import { getUserInformation } from '../../repositories/user';
const { protocol, cdnUrl } = APIConfig;

type Props = {
  item: any;
  hideImage?: boolean;
  containerStyle?: ViewStyle;
};

const RemeasurementItem = ({ item, hideImage = false, containerStyle = {} }: Props) => {
  const [inventory, setInventory] = useState<any>();
  const [imageSource, setImageSource] = useState<any>();
  const [isNonISUCountry, setIsNonISUCountry] = useState<boolean>(false);
  const [hid, setHid] = useState<string>('');

  // updates the [imageSource] based on the avaialble image property
  useEffect(() => {
    if (item.imageUrl) {
      const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
      setImageSource({
        uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${item.imageUrl}`,
      });
    } else if (item.cdnImageUrl) {
      setImageSource({
        uri: `${protocol}://${cdnUrl}/media/cache/coordinate/thumb/${item.cdnImageUrl}`,
      });
    } else {
      setImageSource(single_tree_png);
    }
  }, [item]);

  // used to check if the country is nonISU or not
  useEffect(() => {
    getUserInformation().then(user => {
      setIsNonISUCountry(nonISUCountries.includes(user?.country || ''));
    });
  }, []);

  const { dispatch } = useContext(InventoryContext);

  const navigation = useNavigation();

  useEffect(() => {
    getPlantLocation();
  }, [item]);

  // fetches the plant location data and stores the data in [inventory]
  // and also HID which is shown as the title
  const getPlantLocation = async () => {
    let sampleTree;
    // if (item.samplePlantLocationIndex) {
    //   sampleTree = await getSampleTreeBySampleTreeId({ sampleTreeLocationId: item.parentId });
    // }
    // console.log(item.parentId, 'item.parentId');
    const plantLocation = await getInventoryByLocationId({
      locationId: item.parentId,
    });

    if (plantLocation && plantLocation.length > 0) {
      setInventory(plantLocation[0]);
      if (item.samplePlantLocationIndex || item.samplePlantLocationIndex === 0) {
        setHid(plantLocation[0].sampleTrees[item.samplePlantLocationIndex].hid);
      } else {
        setHid(plantLocation[0].hid);
      }
    }
  };

  // handles the onPress and saves the remeasurement id in context state
  // and navigates to the next screen i.e [RemeasurementReview]
  const handleItemOnPress = () => {
    setRemeasurementId(item.id)(dispatch);
    navigation.navigate('RemeasurementReview');
  };

  // if the plant locationis not available the returns fragment
  if (!inventory) {
    return <></>;
  }

  // checks if height is available and if it is then converts it to feet based on ISU country
  const heightWithUnit = item.height
    ? isNonISUCountry
      ? `${Math.round(item.height * meterToFoot * 1000) / 1000} ${i18next.t(
          'label.select_species_feet',
        )}`
      : `${Math.round(item.height * 1000) / 1000} m`
    : '';

  // checks if diameter is available and if it is then converts it to feet based on ISU country
  const diameterWithUnit = item.diameter
    ? isNonISUCountry
      ? `${Math.round(item.diameter * cmToInch) / 1000} ${i18next.t('label.select_species_inches')}`
      : `${Math.round(item.diameter * 1000) / 1000} cm`
    : '';

  return (
    <TouchableOpacity onPress={handleItemOnPress}>
      <View style={[styles.container, containerStyle]}>
        {!hideImage && (
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
          </View>
        )}
        <View style={styles.contentContainer}>
          <Text style={[styles.subHeadingText, styles.title]}>{hid}</Text>
          {/* shows the [height] and [diameter] if present */}
          {/* elses shows the [status] and [statusReason] */}
          {heightWithUnit || diameterWithUnit ? (
            <View style={{ paddingBottom: 2 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 2 }}>
                <Text style={[styles.measurements]}>{heightWithUnit}</Text>
                <Text style={[styles.measurements]}> • {diameterWithUnit}</Text>
              </View>
            </View>
          ) : item.status ? (
            <View style={{ paddingBottom: 2 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 2 }}>
                <Text style={[styles.measurements]}>{item.status}</Text>
                {item.statusReason ? (
                  <Text style={[styles.measurements]}> • {item.statusReason}</Text>
                ) : (
                  []
                )}
              </View>
            </View>
          ) : (
            []
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RemeasurementItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    marginVertical: 20,
  },
  imageContainer: {
    justifyContent: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  image: {
    height: 100,
    width: 100,
  },
  contentContainer: {
    flex: 1.2,
    justifyContent: 'space-evenly',
    marginLeft: 30,
  },
  actionBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subHeadingText: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  activeText: {
    color: Colors.PRIMARY,
  },
  measurements: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    color: Colors.TEXT_COLOR,
  },
  tagId: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.TEXT_COLOR,
  },
});
