import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform, ViewStyle } from 'react-native';
import { Colors, Typography } from '../../../styles';
import { single_tree_png, placeholder_image, map_img, multiple_tree_png } from '../../../assets';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import i18next from 'i18next';
import RNFS from 'react-native-fs';
import { INCOMPLETE, INCOMPLETE_SAMPLE_TREE, SINGLE } from '../../../utils/inventoryConstants';
import { APIConfig } from './../../../actions/Config';
import { cmToInch, meterToFoot, nonISUCountries } from '../../../utils/constants';
const { protocol, cdnUrl } = APIConfig;

interface IInventoryCardProps {
  data?: any;
  icon?: any;
  activeBtn?: any;
  onPressActiveBtn?: any;
  hideImage?: any;
  containerStyle?: ViewStyle;
}

const InventoryCard = ({
  data,
  icon,
  activeBtn,
  onPressActiveBtn,
  hideImage,
  containerStyle = {},
}: IInventoryCardProps) => {
  const [imageSource, setImageSource] = useState<any>();
  useEffect(() => {
    if (data.imageURL) {
      const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
      setImageSource({
        uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${data.imageURL}`,
      });
    } else if (data.cdnImageUrl) {
      setImageSource({
        uri: `${protocol}://${cdnUrl}/media/cache/coordinate/thumb/${data.cdnImageUrl}`,
      });
    } else if (
      activeBtn === true ||
      data.subHeading.includes(i18next.t('label.tree_inventory_off_site'))
    ) {
      setImageSource(map_img);
    } else if (activeBtn === false) {
      setImageSource(placeholder_image);
    } else {
      if (data.treeType === SINGLE) {
        setImageSource(single_tree_png);
      } else {
        setImageSource(multiple_tree_png);
      }
    }
  }, []);
  const onPressActiveButton = () => {
    if (onPressActiveBtn) onPressActiveBtn(data.index);
  };

  const heightWithUnit = nonISUCountries.includes(data.countryCode)
    ? `${Math.round(data.height * meterToFoot * 1000) / 1000} ${i18next.t(
        'label.select_species_feet',
      )}`
    : `${Math.round(data.height * 1000) / 1000} m`;

  const diameterWithUnit = nonISUCountries.includes(data.countryCode)
    ? `${Math.round(data.diameter * cmToInch) / 1000} ${i18next.t('label.select_species_inches')}`
    : `${Math.round(data.diameter * 1000) / 1000} cm`;

  return (
    <View style={[styles.container, containerStyle]}>
      {!hideImage && (
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
        </View>
      )}
      <View style={styles.contentContainer}>
        <Text style={[styles.subHeadingText, styles.title]}>{data.title}</Text>
        <Text style={styles.subHeadingText}>{data.subHeading}</Text>
        {data.treeType == SINGLE && data.height ? (
          <View style={{ paddingBottom: 2 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 2 }}>
              <Text style={[styles.measurements]}>{heightWithUnit}</Text>
              <Text style={[styles.measurements]}> • {diameterWithUnit}</Text>
            </View>
            {data.tagId ? <Text style={[styles.tagId]}>{data.tagId}</Text> : []}
          </View>
        ) : (
          []
        )}
        <View style={styles.actionBtnContainer}>
          <Text
            style={[styles.subHeadingText, activeBtn && styles.activeText]}
            onPress={onPressActiveButton}>
            {data.date}
          </Text>
          {icon && data.status !== INCOMPLETE && data.status !== INCOMPLETE_SAMPLE_TREE && (
            <MCIcon name={icon} size={22} style={styles.activeText} />
          )}
        </View>
      </View>
    </View>
  );
};
export default InventoryCard;

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
