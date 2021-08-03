import i18next from 'i18next';
import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import { Colors, Typography } from '../../styles';

interface ProfileListItemProps {
  media: string | ImageSourcePropType;
  mediaType: string;
  text: string;
  onPressFunction?: (event?: GestureResponderEvent) => void;
  containerStyle?: any;
  mediaStyle?: any;
}

export default function ProfileListItem({
  media,
  mediaType,
  text,
  onPressFunction,
  containerStyle = {},
  mediaStyle,
}: ProfileListItemProps) {
  return (
    <View style={[styles.profileSection, containerStyle]}>
      <TouchableOpacity
        onPress={onPressFunction ? onPressFunction : () => {}}
        style={[styles.nameAndEmailContainer, { position: 'relative' }]}>
        <View style={styles.iconColumn}>
          {mediaType === 'image' ? (
            <Image source={media} style={[styles.imgIcon, mediaStyle ? mediaStyle : {}]} />
          ) : mediaType === 'icon' ? (
            <Icon name={media} size={20} color={Colors.TEXT_COLOR} />
          ) : mediaType === 'octicon' ? (
            <Octicons name={media} size={20} color={Colors.TEXT_COLOR} />
          ) : (
            <Ionicons name={media} size={20} color={Colors.TEXT_COLOR} />
          )}
        </View>
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
  nameAndEmailContainer: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  imgIcon: {
    width: 20,
    height: 20,
  },
  iconColumn: {
    width: 56,
    marginLeft: 20,
    justifyContent: 'center',
  },
});
