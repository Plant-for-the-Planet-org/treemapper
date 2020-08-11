import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Typography } from '_styles';
import { tree, placeholder_image } from '../../../assets';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const InventoryCard = ({ data, icon, activeBtn, onPressActiveBtn }) => {

  const onPressActiveButton = () => {
    if (onPressActiveBtn)
      onPressActiveBtn(data.index);
  };
  let imageSource = activeBtn ? placeholder_image : tree;
  if (data.imageURL) {
    imageSource = { uri: data.imageURL };
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
          <Text style={[styles.subHeadingText, activeBtn && styles.activeText]} onPress={onPressActiveButton}>{data.date}</Text>
          {icon && <MCIcons name={icon} size={22} style={styles.activeText} />}
        </View>
      </View>
    </View>
  );
};
export default InventoryCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: Colors.WHITE, marginVertical: 20
  },
  imageContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  image: {
    height: 100, width: 100, borderRadius: 5
  },
  contentContainer: {
    flex: 1.2, justifyContent: 'space-evenly', marginHorizontal: 20
  },
  actionBtnContainer: {
    flexDirection: 'row', justifyContent: 'space-between'
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




