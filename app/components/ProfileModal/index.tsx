import i18next from 'i18next';
import { SvgXml } from 'react-native-svg';
import React, { memo, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { logo } from '../../assets';
import AvatarIcon from '../Common/AvatarIcon';
import ProfileListItem from './ProfileListItem';
import { APIConfig } from '../../actions/Config';
import { Colors, Typography } from '../../styles';
import openWebView from '../../utils/openWebView';

const { protocol, cdnUrl, webAppUrl } = APIConfig;

interface ProfileModalProps {
  onPressCloseProfileModal: any;
  isProfileModalVisible: any;
  onPressLogout: any;
  userInfo: any;
}

const ProfileModal = ({
  onPressCloseProfileModal,
  isProfileModalVisible,
  onPressLogout,
  userInfo,
}: ProfileModalProps) => {
  const onPressEdit = () => {
    openWebView(`${protocol}://${webAppUrl}/login`);
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

  const onPressAddArea = () => {
    onPressCloseProfileModal();
    navigation.navigate('DownloadMap');
  };

  const [visibility, setVisibility] = useState(isProfileModalVisible);
  const [profileListItems, setProfileListItems] = useState<any>([]);
  const navigation = useNavigation();
  const profileItems = [
    {
      media: 'exclamation-circle',
      mediaType: 'icon',
      onPressFunction: () => {
        navigation.navigate('SignUp');
        onPressCloseProfileModal();
      },
      text: 'complete_signup',
      isVisible: false,
      order: 0,
    },
    {
      media: 'user-edit',
      mediaType: 'icon',
      text: 'edit_profile',
      onPressFunction: onPressEdit,
      isVisible: true,
      order: 1,
    },

    {
      media: 'leaf',
      mediaType: 'icon',
      text: 'manage_species',
      onPressFunction: onPressManageSpecies,
      isVisible: true,
      order: 2,
    },
    {
      media: 'project',
      mediaType: 'octicon',
      text: 'manage_projects',
      onPressFunction: onPressManageProjects,
      isVisible: true,
      order: 3,
    },
    {
      media: 'file-alt',
      mediaType: 'icon',
      onPressFunction: onPressAdditionalData,
      text: 'additional_data',
      isVisible: true,
      order: 4,
    },
    {
      media: 'map',
      mediaType: 'icon',
      onPressFunction: onPressAddArea,
      text: 'download_maps',
      isVisible: true,
      order: 5,
    },

    {
      media: 'sign-out-alt',
      mediaType: 'icon',
      text: 'logout',
      onPressFunction: onPressLogout,
      isVisible: true,
      order: 6,
    },
  ];

  useEffect(() => {
    let updatedListItems = profileItems.map((profileItem: any) => {
      // shows manage paroject item only in user account type is "tpo"
      if (profileItem.text === 'manage_projects') {
        profileItem.isVisible = userInfo?.type === 'tpo';
      }

      // shows complete signup item only if signup is required
      if (profileItem.text === 'complete_signup') {
        profileItem.isVisible = userInfo?.isSignUpRequired;
      }

      // shows edit profile item only if email is present and used is already signed up
      if (profileItem.text === 'edit_profile') {
        profileItem.isVisible = userInfo?.email && !userInfo?.isSignUpRequired;
      }

      // shows logout only if user is logged i.e. when email id is present
      if (profileItem.text === 'logout') {
        profileItem.isVisible = !!userInfo?.email || userInfo?.isSignUpRequired;
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

  return (
    <Modal visible={isProfileModalVisible} transparent>
      <TouchableOpacity style={styles.container} onPressIn={() => onPressCloseProfileModal()} />
      <View style={styles.mainContainer}>
        <View style={styles.subContainer}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={onPressCloseProfileModal}
              accessible={true}
              accessibilityLabel="Profile Modal"
              testID="profile_modal">
              <Ionicons name={'close'} size={30} color={Colors.TEXT_COLOR} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <SvgXml xml={logo} />
            </View>
          </View>
          {userInfo.email ? (
            <>
              <View style={styles.profileSection1}>
                {avatar ? (
                  <Image style={styles.profileAvatar} source={{ uri: avatar }} />
                ) : (
                  <AvatarIcon name={userInfo.firstName} style={styles.avatarIcon} />
                )}
                <View style={styles.nameAndEmailContainer}>
                  {userName ? <Text style={styles.userName}>{`${userName}`}</Text> : []}

                  <Text style={styles.userEmail}>{userInfo.email}</Text>
                </View>
              </View>
            </>
          ) : (
            []
          )}
          {profileListItems.map((item: any, index: number) =>
            item.isVisible ? <ProfileListItem key={index} {...item} /> : [],
          )}
          <View style={styles.horizontalBar} />
          <View style={styles.horizontalBarAction}>
            <TouchableOpacity onPress={onPressLegals}>
              <Text style={styles.textAlignCenter}>{i18next.t('label.legal_docs')}</Text>
            </TouchableOpacity>
            <Text>&nbsp;&nbsp;•&nbsp;&nbsp;</Text>
            <TouchableOpacity onPress={onPressSupport}>
              <Text style={styles.textAlignCenter}>{i18next.t('label.support')}</Text>
            </TouchableOpacity>
            <Text>&nbsp;&nbsp;•&nbsp;&nbsp;</Text>
            <TouchableOpacity onPress={onPressActivityLogs}>
              <Text style={styles.textAlignCenter}>{i18next.t('label.activity_logs')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default memo(ProfileModal, (prevProps, nextProps) => {
  if (prevProps.isProfileModalVisible === nextProps.isProfileModalVisible) {
    return true; // props are equal
  }
  return false; // props are not equal -> update the component
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subContainer: {
    width: '90%',
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 10,
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
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
  profileSection1: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingTop: 15,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 50,
    height: 50,
    marginLeft: 10,
    marginRight: 4,
    borderRadius: 50,
  },
  avatarIcon: { marginLeft: 10, marginRight: 14 },
  nameAndEmailContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    paddingLeft: 13,
  },
  textAlignCenter: {
    color: Colors.TEXT_COLOR,
    fontSize: Typography.FONT_SIZE_10,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    padding: 10,
  },
  horizontalBar: {
    borderWidth: 0.5,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    marginHorizontal: -20,
    marginTop: 20,
    marginBottom: 10,
  },
  userEmail: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  userName: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    textTransform: 'capitalize',
  },
  horizontalBarAction: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginHorizontal: 50,
  },
});
