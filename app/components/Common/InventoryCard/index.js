import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Colors, Typography } from '_styles';
import { single_tree_png, placeholder_image, map_img, multiple_tree_png } from '../../../assets';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import i18next from 'i18next';
import RNFS from 'react-native-fs';
import { INCOMPLETE, INCOMPLETE_SAMPLE_TREE, SINGLE } from '../../../utils/inventoryConstants';
import { APIConfig } from './../../../actions/Config';

const { protocol, cdnUrl } = APIConfig;

const InventoryCard = ({ data, icon, activeBtn, onPressActiveBtn, hideImage }) => {
  const [imageSource, setImageSource] = useState();
  useEffect(() => {
    if (data.imageURL) {
      const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
      setImageSource({
        uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${data.imageURL}`,
      });
    } else if (data.cdnImageUrl) {
      setImageSource({
        // uri: `https://bucketeer-894cef84-0684-47b5-a5e7-917b8655836a.s3.eu-west-1.amazonaws.com/development/media/cache/coordinate/thumb/${data.cdnImageUrl}`,
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

  return (
    <View style={styles.container}>
      {!hideImage && (
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
        </View>
      )}
      <View style={styles.contentContainer}>
        <Text style={[styles.subHeadingText, styles.title]}>{data.title}</Text>
        <Text style={styles.subHeadingText}>{data.subHeading}</Text>
        <View style={styles.actionBtnContainer}>
          <Text
            style={[styles.subHeadingText, activeBtn && styles.activeText]}
            onPress={onPressActiveButton}>
            {data.date}
          </Text>
          {icon && data.status !== INCOMPLETE && data.status !== INCOMPLETE_SAMPLE_TREE && (
            <MCIcons name={icon} size={22} style={styles.activeText} />
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
  },
  image: {
    height: 100,
    width: 100,
    borderRadius: 8,
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
});
