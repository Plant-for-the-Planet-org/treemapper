import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors, Typography } from '_styles';
import i18next from 'i18next';

export default function ProfileListItem({
  media,
  mediaType,
  text,
  onPressFunction,
  containerStyle,
  mediaStyle,
}) {
  return (
    <View style={[styles.profileSection, containerStyle ? containerStyle : {}]}>
      {mediaType === 'image' ? (
        <Image source={media} style={[styles.imgIcon, mediaStyle ? mediaStyle : {}]} />
      ) : (
        <Icon name={media} size={25} color={Colors.TEXT_COLOR} style={styles.avatar} />
      )}
      <TouchableOpacity
        onPress={onPressFunction ? onPressFunction : () => {}}
        style={styles.nameAndEmailContainer}>
        <Text style={styles.userName}>{i18next.t(`label.${text}`)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginHorizontal: 20,
  },
  nameAndEmailContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    paddingLeft: 13,
  },
  userName: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  imgIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 20,
  },
});
