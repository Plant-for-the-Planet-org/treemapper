import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { logo, logout } from '../../assets';
import { Colors, Typography } from '_styles';
import { SvgXml } from 'react-native-svg';
import i18next from 'i18next';
import ProfileListItem from './ProfileListItem';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AvatarIcon from '../Common/AvatarIcon';
import { APIConfig } from '../../actions/Config';

const { protocol, cdnUrl, webAppUrl } = APIConfig;

interface ProfileModalProps {
  onPressCloseProfileModal: any;
  isProfileModalVisible: any;
  onPressLogout: any;
  userInfo: any;
  cdnUrls: any;
}

const ProfileModal = ({
  onPressCloseProfileModal,
  isProfileModalVisible,
  onPressLogout,
  userInfo,
}: ProfileModalProps) => {
  const onPressEdit = () => {
    Linking.openURL(`${protocol}://${webAppUrl}/login`);
  };

  const onPressManageSpecies = () => {
    onPressCloseProfileModal();
    navigation.navigate('ManageSpecies');
  };

  const onPressAdditionalData = () => {
    onPressCloseProfileModal();
    navigation.navigate('AdditionalData');
  };

  const onPressManageProjects = () => {
    onPressCloseProfileModal();
    navigation.navigate('ManageProjects');
  };

  const onPressActivityLogs = () => {
    onPressCloseProfileModal();
    navigation.navigate('Logs');
  };

  const [visibility, setVisibility] = useState(isProfileModalVisible);
  const [profileListItems, setProfileListItems] = useState<any>([]);
  const navigation = useNavigation();
  const profileItems = [
    {
      media: 'user-edit',
      mediaType: 'icon',
      text: 'edit_profile',
      onPressFunction: onPressEdit,
      isVisible: true,
    },
    {
      media: 'leaf',
      mediaType: 'icon',
      text: 'manage_species',
      onPressFunction: onPressManageSpecies,
      isVisible: true,
    },
    {
      media: 'project',
      mediaType: 'octicon',
      text: 'manage_projects',
      onPressFunction: onPressManageProjects,
      isVisible: true,
    },
    {
      media: 'file-alt',
      mediaType: 'icon',
      onPressFunction: onPressAdditionalData,
      text: 'additional_data',
    },
    {
      media: 'history',
      mediaType: 'icon',
      text: 'activity_logs',
      onPressFunction: onPressActivityLogs,
      isVisible: true,
    },
    {
      media: logout,
      mediaType: 'image',
      text: 'logout',
      onPressFunction: onPressLogout,
      isVisible: true,
    },
  ];

  useEffect(() => {
    let updatedListItems = profileItems.map((profileItem: any) => {
      if (profileItem.text === 'manage_projects') {
        profileItem.isVisible = userInfo?.type === 'tpo';
      }
      return profileItem;
    });
    setProfileListItems(updatedListItems);
  }, [userInfo, onPressCloseProfileModal]);

  useEffect(() => {
    setVisibility(isProfileModalVisible);
  }, [navigation, visibility]);

  // adds the user name according to the available data
  let userName = '';
  if (userInfo.firstName) {
    userName += userInfo.firstName;
    if (userInfo.lastName) {
      userName += ` ${userInfo.lastName}`;
    }
  } else if (userInfo.type === 'tpo' && userInfo.displayName) {
    userName = userInfo.displayName;
  }

  let avatar =
    cdnUrl && userInfo.image
      ? `${protocol}://${cdnUrl}/media/cache/profile/avatar/${userInfo.image}`
      : '';

  const onPressLegals = () => {
    onPressCloseProfileModal();
    navigation.navigate('Legals');
  };
  const onPressSupport = () => {
    Linking.openURL('mailto:support@plant-for-the-planet.org').catch(() =>
      // TODO:i18n - if this is used, please add translations
      alert('Can write mail to support@plant-for-the-planet.org'),
    );
  };

  const signUpItem = {
    media: 'exclamation-circle',
    mediaType: 'icon',
    onPressFunction: () => {
      navigation.navigate('SignUp');
      onPressCloseProfileModal();
    },
    text: 'complete_signup',
  };

  return (
    <Modal visible={isProfileModalVisible} transparent>
      <View style={styles.container}>
        <View style={styles.subContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={onPressCloseProfileModal}
              accessible={true}
              accessibilityLabel="Profile Modal"
              testID="profile_modal">
              <Ionicons name={'md-close'} size={30} color={Colors.TEXT_COLOR} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <SvgXml xml={logo} />
            </View>
          </View>
          {userInfo.email ? (
            <>
              <View style={styles.profileSection1}>
                {avatar ? (
                  <Image
                    style={{
                      width: 50,
                      height: 50,
                      marginLeft: 10,
                      marginRight: 4,
                      borderRadius: 50,
                    }}
                    source={{ uri: avatar }}
                  />
                ) : (
                  <AvatarIcon
                    name={userInfo.firstName}
                    style={{ marginLeft: 10, marginRight: 14 }}
                  />
                )}
                <View style={styles.nameAndEmailContainer}>
                  {userName ? <Text style={styles.userEmail}>{`${userName}`}</Text> : []}

                  <Text style={styles.userName}>{userInfo.email}</Text>
                </View>
              </View>
              {profileListItems.map((item: any, index: number) =>
                item.isVisible ? <ProfileListItem key={index} {...item} /> : [],
              )}
            </>
          ) : (
            <View style={{ marginTop: 20 }}>
              <ProfileListItem key={0} {...signUpItem} />
              <ProfileListItem key={1} {...profileListItems[profileListItems.length - 1]} />
            </View>
          )}
          <View style={styles.horizontalBar} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              marginHorizontal: 50,
            }}>
            <Text onPress={onPressLegals} style={styles.textAlignCenter}>
              {i18next.t('label.legal_docs')}
            </Text>
            <Text>•</Text>
            <Text onPress={onPressSupport} style={styles.textAlignCenter}>
              {i18next.t('label.support')}
            </Text>
          </View>
        </View>

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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoContainer: {
    height: 44,
    width: 44,
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
  imgIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 20,
  },
});

export default ProfileModal;
