import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { close, logo } from '../../assets';
import { Colors, Typography } from '_styles';
import { SvgXml } from 'react-native-svg';
import { PrimaryButton } from '../Common';
import { getUserInformation } from '../../Actions';
import i18next from 'i18next';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Iconics from 'react-native-vector-icons/SimpleLineIcons';

const ProfileModal = ({
  isUserLogin,
  onPressCloseProfileModal,
  isProfileModalVisible,
  onPressLogout,
}) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (isUserLogin) {
      getUserInformation().then((userInfo) => {
        setUserInfo(userInfo);
      });
    }
  }, [isUserLogin]);

  const onPressSupport = () => {
    Linking.openURL('mailto:support@plant-for-the-planet.org');
  };
  const onPressPolicy = () => {
    Linking.openURL('https://www.trilliontreecampaign.org/data-protection-policy');
  };
  const onPressEdit = () => {
    Linking.openURL('https://www.trilliontreecampaign.org/edit-profile');
  };
  let avatar;
  if (userInfo) {
    avatar = userInfo.avatar
      ? userInfo.avatar
      : 'https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png';
  }

  return (
    <Modal visible={isProfileModalVisible} transparent>
      <View style={styles.container}>
        {userInfo && (
          <View style={styles.subContainer}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={onPressCloseProfileModal}
                accessible={true}
                accessibilityLabel="Profile Modal"
                testID="profile_modal">
                <Image source={close} />
              </TouchableOpacity>
              <SvgXml xml={logo} />
              <View />
            </View>
            <View style={styles.profileSection1}>
              <Image
                style={{ width: 50, height: 50, marginHorizontal: 10, }}
                source={{ uri: 'https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png' }}
              />
              {/* <Image source={{ uri: avatar }} style={styles.avatar} /> */}
              <View style={styles.nameAndEmailContainer}>
                <Text style={styles.userEmail}>{`${userInfo.firstName} ${userInfo.lastName}`}</Text>
                <Text style={styles.userName}>{userInfo.email}</Text>
              </View>
            </View>
            <View style={styles.profileSection}>
              <Icon 
                name="user-edit"
                size={25}
                color={Colors.TEXT_COLOR}
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.nameAndEmailContainer}
                onPress={onPressEdit}
              >
                <Text style={styles.userName}>{i18next.t('label.edit_profile')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              <Icon 
                name="leaf"
                size={25}
                color={Colors.TEXT_COLOR}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.nameAndEmailContainer}
              >
                <Text style={styles.userName}>{i18next.t('label.manage_species')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              <Icon 
                name="cloud-download-alt"
                size={25}
                color={Colors.TEXT_COLOR}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.nameAndEmailContainer}
              >
                <Text style={styles.userName}>{i18next.t('label.back_up')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              <Icon 
                name="map-marked-alt"
                size={25}
                color={Colors.TEXT_COLOR}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.nameAndEmailContainer}
              >
                <Text style={styles.userName}>{i18next.t('label.manage_offline')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              <Iconics
                name="logout"
                size={25}
                color={Colors.TEXT_COLOR}
                style={styles.avatar}
              />
              <TouchableOpacity
                onPress={onPressLogout}
                style={styles.nameAndEmailContainer}
              >
                <Text style={styles.userName}>{i18next.t('label.logout')}</Text>
              </TouchableOpacity>
            </View>
            {/* <View style={styles.bottomBtnsContainer}>
              <PrimaryButton
                btnText={i18next.t('label.edit_profile')}
                halfWidth
                theme={'white'}
                style={styles.primaryBtnContainer}
                textStyle={styles.primaryBtnText}
              />
              <PrimaryButton
                onPress={onPressLogout}
                btnText={i18next.t('label.logout')}
                theme={'white'}
                halfWidth
                style={styles.primaryBtnContainer}
                textStyle={styles.primaryBtnText}
              />
            </View> */}
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
    paddingLeft: 13
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
    color: Colors.TEXT_COLOR
  },
  userEmail: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_,
    fontWeight: Typography.FONT_WEIGHT_BOLD,
    textTransform: 'capitalize'
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    paddingLeft: 20
  }
});

export default ProfileModal;
