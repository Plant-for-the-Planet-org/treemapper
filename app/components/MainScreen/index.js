import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, Modal, Alert } from 'react-native';
import { PrimaryButton, LargeButton, Header, MainScreenHeader, Loader, Sync } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import ProfileModal from '../ProfileModal';
import { getInventoryByStatus } from '../../repositories/inventory';
import { auth0Login, isLogin, auth0Logout, LoginDetails } from '../../repositories/user';
import { map_texture, main_screen_banner } from '../../assets';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import { SvgXml } from 'react-native-svg';
import i18next from '../../languages/languages';
import { useFocusEffect } from '@react-navigation/native';
import jwtDecode from 'jwt-decode';
// import species_zip from '../../assets';
import { zip, unzip, unzipAssets, subscribe } from 'react-native-zip-archive';
import { MainBundlePath, DocumentDirectoryPath } from 'react-native-fs';
import { InventoryContext } from '../../reducers/inventory';
import { updateCount } from '../../actions/inventory';
import { LoadingContext } from '../../reducers/loader';
import { startLoading, stopLoading } from '../../actions/loader';

const MainScreen = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // * FOR VIDEO MODAL
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [numberOfInventory, setNumberOfInventory] = useState(0);
  const [isUserLogin, setIsUserLogin] = useState(false);
  const { state, dispatch } = useContext(InventoryContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    checkIsLogin();
    unzipSpecies();
    getInventoryByStatus('all').then((data) => {
      let count = 0;
      for (const inventory of data) {
        if (inventory.status === 'pending' || inventory.status === 'uploading') {
          count++;
        }
      }
      updateCount({ type: 'pending', count })(dispatch);
      setNumberOfInventory(Object.values(data).length);
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      checkIsLogin();
    }, []),
  );

  let rightIcon = <Icon size={40} name={'play-circle'} color={Colors.GRAY_LIGHTEST} />;

  const onPressLargeButtons = (screenName) => navigation.navigate(screenName);

  const onPressLearn = () => setIsModalVisible(!isModalVisible);

  const onPressCloseProfileModal = () => setIsProfileModalVisible(!isProfileModalVisible);

  const onPressLogin = async () => {
    if (isUserLogin) {
      setIsProfileModalVisible(true);
    } else {
      startLoading()(loadingDispatch);
      auth0Login(navigation)
        .then((data) => {
          setIsUserLogin(data);
          stopLoading()(loadingDispatch);
        })
        .catch((err) => {
          console.error('err login', err);
          if (err.error !== 'a0.session.user_cancelled') {
            Alert.alert(
              'Verify your Email',
              'Please verify your email before logging in.',
              [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
              { cancelable: false },
            );
          }
          stopLoading()(loadingDispatch);
        });
    }
  };

  const checkIsLogin = () => {
    isLogin()
      .then((data) => {
        setIsUserLogin(data);
        userImage();
      })
      .catch((err) => {
        onPressCloseProfileModal();
        setIsUserLogin(false);
      });
  };

  const onPressLogout = () => {
    onPressCloseProfileModal();
    auth0Logout().then(() => {
      checkIsLogin();
    });
  };

  const userImage = () => {
    LoginDetails().then((User) => {
      let detail = Object.values(User);
      if (detail && detail.length > 0) {
        let decode = jwtDecode(detail[0].idToken);
        setUserPhoto(decode.picture);
      }
    });
  };

  const unzipSpecies = () => {
    // require the module
    // var RNFS = require('react-native-fs');
    // const targetPath = `${DocumentDirectoryPath}/scientific_species.json` ;
    // RNFS.readFile(targetPath,'utf8')
    // .then((contents) => {
    //   // log the file contents
    //   console.log(typeof contents, 'JSON Data',);
    //   // var myJSON = JSON.stringify(contents);
    //   let objs = JSON.parse(contents);
    //   // console.log(objs, 'JSON DATA', typeof objs);
    //   importJSON({objs});
    // })
    // .catch((err) => {
    //   console.log(err.message, err.code, 'JSON DATA ERROR');
    // });
    // get a list of files and directories in the main bundle
    // RNFS.readDir(RNFS.DocumentDirectoryPath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
    //   .then((result) => {
    //     console.log('GOT RESULT', result);
    //     // stat the first file
    //     return Promise.all([RNFS.stat(result[0].path), result[0].path]);
    //   })
    //   .then((statResult) => {
    //     if (statResult[0].isFile()) {
    //       // if we have a file, read it
    //       return RNFS.readFile(statResult[1], 'utf8');
    //     }
    //     return 'no file';
    //   })
    //   .then((contents) => {
    //     // log the file contents
    //     // console.log(contents);
    //   })
    //   .catch((err) => {
    //     console.log(err.message, err.code);
    //   });
    // require the module
    // var RNFS = require('react-native-fs');
    // const filePath = RNFS.ExternalDirectoryPath   + '/scientific_species.zip';
    // const destPath = RNFS.DocumentDirectoryPath + '/specie.zip';
    // RNFS.moveFile(filePath,destPath)
    //   .then((success) => {
    //     console.log('FILE Copied!');
    //   })
    //   .catch((err) => {
    //     console.log(err.message);
    //   });
    // const sourcePath = `${DocumentDirectoryPath}/specie.zip`
    // const targetPath = DocumentDirectoryPath
    // const charset = 'UTF-8'
    // // charset possible values: UTF-8, GBK, US-ASCII and so on. If none was passed, default value is UTF-8
    // unzip(sourcePath, targetPath, charset)
    // .then((path) => {
    //   console.log(`unzip completed at ${path}`)
    // })
    // .catch((error) => {
    //   console.error(error)
    // })
  };

  const renderVideoModal = () => {
    return (
      <Modal visible={isModalVisible} animationType={'slide'}>
        <View style={styles.modalContainer}>
          <Ionicons
            name={'md-close'}
            size={30}
            color={Colors.WHITE}
            onPress={onPressLearn}
            style={styles.closeIcon}
          />
          {isModalVisible && (
            <Video
              repeat={true}
              resizeMode={'contain'}
              posterResizeMode={'stretch'}
              source={require('./learn.mp4')}
              style={styles.videoPLayer}
            />
          )}
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaViewCont}>
      {loadingState.isLoading ? (
        <Loader isLoaderShow={true} />
      ) : (
        <View style={styles.container}>
          <ScrollView style={styles.safeAreaViewCont} showsVerticalScrollIndicator={false}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Sync
                uploadCount={state.uploadCount}
                pendingCount={state.pendingCount}
                isUploading={state.isUploading}
                isUserLogin={isUserLogin}
              />
              <MainScreenHeader
                onPressLogin={onPressLogin}
                isUserLogin={isUserLogin}
                testID={'btn_login'}
                accessibilityLabel={'Login/Sign Up'}
                photo={userPhoto}
              />
            </View>
            <View style={styles.bannerImgContainer}>
              <SvgXml xml={main_screen_banner} />
            </View>
            <Header
              headingText={i18next.t('label.tree_mapper')}
              hideBackIcon
              textAlignStyle={{ textAlign: 'center' }}
            />
            <ImageBackground id={'inventorybtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={() => onPressLargeButtons('TreeInventory')}
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.tree_inventory')}
                active={false}
                subHeading={i18next.t('label.tree_inventory_sub_header')}
                notification={numberOfInventory > 0 && numberOfInventory}
                testID="page_tree_inventory"
                accessibilityLabel="Tree Inventory"
              />
            </ImageBackground>
            <ImageBackground id={'downloadmapbtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={() => onPressLargeButtons('DownloadMap')}
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.download_maps')}
                active={false}
                subHeading={i18next.t('label.download_maps_sub_header')}
                testID="page_map"
                accessibilityLabel="Download Map"
              />
            </ImageBackground>
            <ImageBackground id={'learnbtn'} source={map_texture} style={styles.bgImage}>
              <LargeButton
                onPress={onPressLearn}
                rightIcon={rightIcon}
                style={styles.customStyleLargeBtn}
                heading={i18next.t('label.learn')}
                active={false}
                subHeading={i18next.t('label.learn_sub_header')}
                accessibilityLabel="Learn"
                testID="page_learn"
              />
            </ImageBackground>
          </ScrollView>
          <PrimaryButton
            onPress={() => onPressLargeButtons('RegisterTree')}
            btnText={i18next.t('label.register_tree')}
            testID={'btn_register_trees'}
            accessibilityLabel={'Register Tree'}
          />
        </View>
      )}
      {renderVideoModal()}
      <ProfileModal
        isUserLogin={isUserLogin}
        isProfileModalVisible={isProfileModalVisible}
        onPressCloseProfileModal={onPressCloseProfileModal}
        onPressLogout={onPressLogout}
      />
    </SafeAreaView>
  );
};
export default MainScreen;

const styles = StyleSheet.create({
  safeAreaViewCont: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
    backgroundColor: Colors.WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.BLACK,
    padding: 30,
  },
  addSpecies: {
    color: Colors.ALERT,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    textAlign: 'center',
  },
  customStyleLargeBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginVertical: 0,
    borderWidth: 0.1,
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '150%',
    overflow: 'hidden',
    marginVertical: 10,
    borderRadius: 5,
  },
  bannerImgContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  bannerImage: {
    alignSelf: 'center',
  },
  videoPLayer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  closeIcon: {
    zIndex: 100,
  },
});
