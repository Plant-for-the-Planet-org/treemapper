import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {close, logo} from '../../assets';
import {Colors, Typography} from '_styles';
import {SvgXml} from 'react-native-svg';
import {PrimaryButton} from '../Common';
import {getUserInformation} from '../../Actions';

const ProfileModal = ({
  onPressCloseProfileModal,
  isProfileModalVisible,
  onPressLogout,
}) => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    getUserInformation().then((userInfo) => {
      setUserInfo(userInfo);
    });
  }, []);

  const onPressSupport = () => {
    Linking.openURL('mailto:support@plant-for-the-planet.org');
  };
  const onPressPolicy = () => {
    Linking.openURL(
      'https://www.trilliontreecampaign.org/data-protection-policy',
    );
  };

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
            <View style={styles.profileSection}>
              <SvgXml xml={logo} style={styles.avatar} />
              <View style={styles.nameAndEmailContainer}>
                <Text
                  style={
                    styles.userName
                  }>{`${userInfo.firstName} ${userInfo.lastName}`}</Text>
                <Text style={styles.userEmail}>{userInfo.email}</Text>
              </View>
            </View>
            <View style={styles.bottomBtnsContainer}>
              <PrimaryButton
                btnText={'Edit Profile'}
                halfWidth
                theme={'white'}
                style={styles.primaryBtnContainer}
                textStyle={styles.primaryBtnText}
              />
              <PrimaryButton
                onPress={onPressLogout}
                btnText={'Logout'}
                theme={'white'}
                halfWidth
                style={styles.primaryBtnContainer}
                textStyle={styles.primaryBtnText}
              />
            </View>
            <View style={styles.horizontalBar} />
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
              <Text onPress={onPressPolicy} style={styles.textAlignCenter}>
                Privacy Policy
              </Text>
              <Text>•</Text>
              <Text onPress={onPressSupport} style={styles.textAlignCenter}>
                Support
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
    marginVertical: 20,
    alignItems: 'center',
  },
  avatar: {
    marginHorizontal: 20,
  },
  nameAndEmailContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
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
    fontSize: Typography.FONT_SIZE_14,
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
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_30,
  },
  userEmail: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    lineHeight: Typography.LINE_HEIGHT_,
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ProfileModal;
