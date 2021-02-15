import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { close, logo, logout } from '../../assets';
import { Colors, Typography } from '_styles';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import ProfileListItem from './ProfileListItem';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileModal = ({
  isUserLogin,
  onPressCloseProfileModal,
  isProfileModalVisible,
  onPressLogout,
  userInfo,
  cdnUrls,
}) => {
  const [visibility, setVisibility] = useState(isProfileModalVisible);
  const navigation = useNavigation();

  useEffect(() => {
    setVisibility(isProfileModalVisible);
  }, [navigation, visibility]);

  const onPressSupport = () => {
    Linking.openURL('mailto:support@plant-for-the-planet.org');
  };
  const onPressPolicy = () => {
    Linking.openURL('https://www.trilliontreecampaign.org/data-protection-policy');
  };
  const onPressEdit = () => {
    Linking.openURL('https://www.trilliontreecampaign.org/edit-profile');
  };
  let avatar = userInfo.image
    ? `${cdnUrls.cache}/profile/avatar/${userInfo.image}`
    : 'https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png';

  const onPressManageSpecies = () => {
    onPressCloseProfileModal();
    navigation.navigate('ManageSpecies');
  };

  const profileListItems = [
    {
      media: 'user-edit',
      mediaType: 'icon',
      onPressFunction: onPressEdit,
      text: 'edit_profile',
    },
    {
      media: 'leaf',
      mediaType: 'icon',
      onPressFunction: onPressManageSpecies,
      text: 'manage_species',
    },
    {
      media: 'map-marked',
      mediaType: 'icon',
      text: 'manage_offline',
    },
    // {
    //   media: 'pulse-outline',
    //   text: 'activity_logging',
    //   mediaType: 'ionicon',
    // onPressFunction: () => {
    //   navigation.navigate('Logs');
    //   onPressCloseProfileModal();
    // },
    // },
    {
      media: 'history',
      mediaType: 'icon',
      text: 'activity_logs',
      onPressFunction: () => {
        navigation.navigate('Logs');
        onPressCloseProfileModal();
      },
    },
    {
      media: logout,
      mediaType: 'image',
      onPressFunction: onPressLogout,
      text: 'logout',
    },
  ];

  return (
    <Modal visible={isProfileModalVisible} transparent>
      <View style={styles.container}>
        {userInfo.email && (
          <View style={styles.subContainer}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={onPressCloseProfileModal}
                accessible={true}
                accessibilityLabel="Profile Modal"
                testID="profile_modal">
                <Ionicons name={'md-close'} size={30} color={Colors.TEXT_COLOR} />
              </TouchableOpacity>
              <SvgXml xml={logo} />
              <View />
            </View>
            <View style={styles.profileSection1}>
              <Image
                style={{ width: 50, height: 50, marginHorizontal: 10, borderRadius: 50 }}
                source={{ uri: avatar }}
              />
              <View style={styles.nameAndEmailContainer}>
                <Text style={styles.userEmail}>{`${userInfo.firstName} ${userInfo.lastName}`}</Text>
                <Text style={styles.userName}>{userInfo.email}</Text>
              </View>
            </View>
            {profileListItems.map((item, index) => (
              <ProfileListItem key={index} {...item} />
            ))}
            <View style={styles.horizontalBar} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <Text onPress={onPressPolicy} style={styles.textAlignCenter}>
                {i18next.t('label.privacy_policy')}
              </Text>
              <Text>•</Text>
              <Text onPress={onPressSupport} style={styles.textAlignCenter}>
                {i18next.t('label.terms_of_service')}
              </Text>
            </View>
          </View>
        )}
        <View />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  subContainer: {
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSection1: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingTop: 15,
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
  primaryBtnContainer: {
    borderColor: Colors.LIGHT_BORDER_COLOR,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  textAlignCenter: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  horizontalBar: {
    borderWidth: 0.5,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    marginHorizontal: -20,
    marginVertical: 20,
  },
  userName: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  userEmail: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    textTransform: 'capitalize',
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imgIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 20,
  },
});

export default ProfileModal;
