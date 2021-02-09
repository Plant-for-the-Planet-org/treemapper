import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Colors, Typography } from '_styles';
import { tree, placeholder_image, map_img } from '../../../assets';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import i18next from 'i18next';
import RNFS from 'react-native-fs';

const InventoryCard = ({ data, icon, activeBtn, onPressActiveBtn, inventoryType }) => {
  const onPressActiveButton = () => {
    if (onPressActiveBtn) onPressActiveBtn(data.index);
  };
  let imageSource =
    activeBtn === true
      ? map_img
      : data.subHeading.includes(i18next.t('label.tree_inventory_off_site'))
      ? map_img
      : activeBtn === false
      ? placeholder_image
      : tree;
  if (data.imageURL) {
    const imageURIPrefix = Platform.OS === 'android' ? 'file://' : '';
    imageSource = { uri: `${imageURIPrefix}${RNFS.DocumentDirectoryPath}/${data.imageURL}` };
  }
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode={'stretch'} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.subHeadingText, styles.title]}>{data.title}</Text>
        <Text style={styles.subHeadingText}>{data.subHeading}</Text>
        <View style={styles.actionBtnContainer}>
          <Text
            style={[styles.subHeadingText, activeBtn && styles.activeText]}
            onPress={onPressActiveButton}>
            {data.date}
          </Text>
          {icon && inventoryType != 'incomplete' && (
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
    borderRadius: 5,
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
