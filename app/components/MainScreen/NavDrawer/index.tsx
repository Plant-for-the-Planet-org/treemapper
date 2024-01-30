import i18next from 'i18next';
import { useState } from 'react';
import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from 'moti/skeleton/react-native-linear-gradient';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

import {
  ArrowBack,
  LogoutSign,
  ProjectDoc,
  SpeciesLeaf,
  OfflineMapIcon,
  single_tree_png,
  PieAdditionalData,
} from '../../../assets';
import { PrimaryButton } from '../../Common';
import { version } from '../../../../package.json';
import { scaleSize } from '../../../styles/mixins';
import { APIConfig } from '../../../actions/Config';
import openWebView from '../../../utils/openWebView';
import { UserContext } from '../../../reducers/user';
import { Colors, Spacing, Typography } from '../../../styles';
import { InventoryContext } from '../../../reducers/inventory';
import { auth0Login, auth0Logout } from '../../../actions/user';
import { isPlantForThePlanetEmail } from '../../../utils';
import { ENVS } from '../../../../environment';

const { protocol } = APIConfig;

const getIcon = screenName => {
  switch (screenName) {
    case 'ManageSpecies':
      return <SpeciesLeaf />;
    case 'Logout':
      return <LogoutSign />;
    case 'AdditionalData':
      return <PieAdditionalData />;
    case 'ManageProjects':
      return <ProjectDoc />;
    case 'DownloadMap':
      return <OfflineMapIcon />;
    case 'Logs':
      return <OfflineMapIcon />;
    case 'Environment':
      return (
        <View style={styles.iconCon}>
          <MaterialIcons name={'settings'} size={16} color={Colors.WHITE} />
        </View>
      );
    default:
      return undefined;
  }
};

const getLabel = screenName => {
  switch (screenName) {
    case 'ManageSpecies':
      return i18next.t('label.manage_species');
    case 'Logout':
      return i18next.t('label.logout');
    case 'AdditionalData':
      return i18next.t('label.additional_data');
    case 'ManageProjects':
      return i18next.t('label.manage_projects');
    case 'DownloadMap':
      return i18next.t('label.manage_offline');
    case 'Logs':
      return i18next.t('label.activity_logs');
    case 'Environment':
      return i18next.t('label.environment');
    default:
      return undefined;
  }
};

const state = {
  routeNames: ['ManageSpecies', 'ManageProjects', 'AdditionalData', 'DownloadMap', 'Logs'],
};

const NavDrawer = props => {
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const { dispatch } = useContext(InventoryContext);
  const { currentEnv } = useSelector(state => state.envSlice);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const insects = useSafeAreaInsets();

  const cdnUrl = ENVS[currentEnv].CDN_URL;
  const webAppUrl = ENVS[currentEnv].WEB_APP_URL;

  const handleLogout = async () => {
    const isLogout = await auth0Logout(userDispatch);
  };

  const onPressImprint = () => openWebView(`https://pp.eco/legal/${i18next.language}/imprint`);
  const onPressPolicy = () => openWebView(`https://pp.eco/legal/${i18next.language}/privacy`);
  const onPressTerms = () => openWebView(`https://pp.eco/legal/${i18next.language}/terms`);
  const onPressEdit = () => openWebView(`${protocol}://${webAppUrl}/login`);

  const onPressLogin = async () => {
    setLoading(true);
    auth0Login(userDispatch, dispatch)
      .then(() => {
        setLoading(false);
      })
      .catch(err => {
        if (err?.response?.status === 303) {
          navigation.navigate('SignUp');
        }
        setLoading(false);
      });
  };

  let avatar =
    cdnUrl && userState?.image
      ? `${protocol}://${cdnUrl}/media/cache/profile/avatar/${userState?.image}`
      : '';

  return (
    <>
      <Skeleton.Group show={loading}>
        <View
          style={[styles.container, { backgroundColor: Colors.WHITE, paddingTop: insects.top }]}>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.header}
              onPress={() => navigation.navigate('BottomTab')}>
              <ArrowBack />
            </TouchableOpacity>
            <View style={styles.profile}>
              <View style={styles.profileInfo}>
                <Skeleton colorMode="light" radius={10}>
                  {avatar ? (
                    <Image resizeMode={'contain'} source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <Image resizeMode={'contain'} source={single_tree_png} style={styles.avatar} />
                  )}
                </Skeleton>
                {userState?.accessToken ? (
                  <View style={styles.profileInfoTextCon}>
                    <Skeleton colorMode="light" radius={2}>
                      <Text style={styles.username}>{userState?.displayName}</Text>
                      <Text style={styles.email}>{userState?.email}</Text>
                    </Skeleton>
                  </View>
                ) : (
                  <View style={styles.profileInfoTextCon}>
                    <Skeleton colorMode="light" radius={2}>
                      <Text style={styles.username}>Guest User</Text>
                    </Skeleton>
                  </View>
                )}
              </View>
              {userState?.accessToken && (
                <TouchableOpacity onPress={onPressEdit} activeOpacity={0.7} style={styles.pencil}>
                  <FontAwesome name="pencil" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.drawerItemContainer}>
            {state.routeNames.map(
              (name, index) =>
                !(name === 'BottomTab') && (
                  <View key={index} style={{ paddingTop: scaleSize(12) }}>
                    <Skeleton colorMode="light">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[styles.drawerItem, { opacity: name == 'DownloadMap' ? 0.6 : 1 }]}
                        disabled={name == 'DownloadMap' || false}
                        onPress={event => {
                          navigation.navigate(name);
                        }}>
                        <View style={styles.drawerItemInfo}>
                          {getIcon(name)}
                          <Text style={styles.drawerItemLabel}>{getLabel(name)}</Text>
                        </View>
                        <Ionicons
                          name={'chevron-forward-outline'}
                          size={20}
                          color={Colors.TEXT_COLOR}
                        />
                      </TouchableOpacity>
                    </Skeleton>
                  </View>
                ),
            )}
            {isPlantForThePlanetEmail(userState?.email) && (
              <View style={{ paddingTop: scaleSize(12) }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.drawerItem}
                  onPress={() => navigation.navigate('Environment')}>
                  <View style={styles.drawerItemInfo}>
                    {getIcon('Environment')}
                    <Text style={styles.drawerItemLabel}>{getLabel('Environment')}</Text>
                  </View>
                  <Ionicons name={'chevron-forward-outline'} size={20} color={Colors.TEXT_COLOR} />
                </TouchableOpacity>
              </View>
            )}
            {userState?.accessToken && (
              <View style={{ paddingTop: scaleSize(12) }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.drawerItem}
                  onPress={handleLogout}>
                  <View style={styles.drawerItemInfo}>
                    {getIcon('Logout')}
                    <Text style={styles.drawerItemLabel}>{getLabel('Logout')}</Text>
                  </View>
                  <Ionicons name={'chevron-forward-outline'} size={20} color={Colors.TEXT_COLOR} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.versionContainer, { paddingBottom: insects.bottom }]}>
          {!userState?.accessToken && (
            <PrimaryButton
              onPress={onPressLogin}
              btnText={'Login / Signup'}
              style={styles.loginBtn}
            />
          )}
          <View key="version" style={styles.version}>
            <Text style={styles.itemText}>{version}</Text>
          </View>
          <View style={styles.termsContainer}>
            <TouchableOpacity key="privacy_policy" onPress={onPressPolicy}>
              <Text style={styles.itemText}>{i18next.t('label.privacy_policy')}</Text>
            </TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity key="imprint" onPress={onPressImprint}>
              <Text style={styles.itemText}>{i18next.t('label.imprint')}</Text>
            </TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity key="terms_of_service" onPress={onPressTerms}>
              <Text style={styles.itemText}>{i18next.t('label.terms_of_service')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Skeleton.Group>
    </>
  );
};

export default NavDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    paddingHorizontal: Spacing.SCALE_16,
    backgroundColor: Colors.WHITE,
  },
  header: {
    width: Spacing.SCALE_30,
    height: Spacing.SCALE_56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.SCALE_16,
    marginBottom: Spacing.SCALE_24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfoTextCon: {
    marginLeft: Spacing.SCALE_12,
  },
  username: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: 'black',
  },
  email: {
    marginTop: Spacing.SCALE_4,
    color: '#4F4F4F',
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  avatar: {
    width: Spacing.SCALE_50,
    height: Spacing.SCALE_50,
    borderRadius: 10,
  },
  pencil: {
    backgroundColor: Colors.PRIMARY + '20',
    padding: scaleSize(10),
    borderRadius: 500,
  },
  drawerItemContainer: {
    flex: 1,
    marginTop: scaleSize(24),
    paddingHorizontal: scaleSize(16),
    backgroundColor: '#E0E0E026',
  },
  drawerItem: {
    padding: scaleSize(12),
    borderRadius: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerItemLabel: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: scaleSize(12),
  },
  drawerItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtn: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
  },
  itemText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_16,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 100,
    backgroundColor: Colors.TEXT_COLOR,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 15,
    alignSelf: 'center',
  },
  version: { paddingBottom: 10 },
  iconCon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY_DARK,
    borderRadius: 100,
    width: 24,
    height: 24,
  },
});
