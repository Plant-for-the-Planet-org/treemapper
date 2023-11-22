import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useContext } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

import {
  LogoutSign,
  ProjectDoc,
  SpeciesLeaf,
  OfflineMapIcon,
  single_tree_png,
  PieAdditionalData,
} from '../../../assets';
import PrimaryButton from '../PrimaryButton';
import { APIConfig } from '../../../actions/Config';
import { Colors, Spacing, Typography } from '../../../styles';
import { UserContext } from '../../../reducers/user';
import { LoadingContext } from '../../../reducers/loader';
import { InventoryContext } from '../../../reducers/inventory';
import { auth0Login, auth0Logout } from '../../../actions/user';
import { startLoading, stopLoading } from '../../../actions/loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleSize } from '../../../styles/mixins';
import { Skeleton } from 'moti/skeleton/react-native-linear-gradient';
import { useState } from 'react';
import i18next from 'i18next';
import openWebView from '../../../utils/openWebView';
import { version } from '../../../../package.json';

const { protocol, cdnUrl, webAppUrl } = APIConfig;

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
    case 'ActivityLogs':
      return <OfflineMapIcon />;
    default:
      return undefined;
  }
};

const getLabel = screenName => {
  switch (screenName) {
    case 'ManageSpecies':
      return 'Manage Species';
    case 'Logout':
      return 'Logout';
    case 'AdditionalData':
      return 'Additional Data';
    case 'ManageProjects':
      return 'Manage Projects';
    case 'DownloadMap':
      return 'Offline Maps';
    case 'ActivityLogs':
      return 'Activity Logs';
    default:
      return undefined;
  }
};

const CustomDrawer = props => {
  const { navigation, state } = props;
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const { dispatch } = useContext(InventoryContext);
  const [loading, setLoading] = useState(false);

  const insects = useSafeAreaInsets();

  const handleLogout = async () => {
    const isLogout = await auth0Logout(userDispatch);
  };

  const onPressImprint = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/imprint`);
  };
  const onPressPolicy = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/privacy`);
  };
  const onPressTerms = () => {
    openWebView(`https://pp.eco/legal/${i18next.language}/terms`);
  };

  const onPressEdit = () => {
    openWebView(`${protocol}://${webAppUrl}/login`);
  };

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
        <View style={[styles.container, { backgroundColor: 'white', paddingTop: insects.top }]}>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.header}
              onPress={() => navigation.closeDrawer()}>
              <Ionicons name="arrow-back" size={24} color={Colors.BLACK} />
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
                      <Text style={styles.username}>
                        {userState?.firstName} {userState?.lastName}
                      </Text>
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
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            paddingBottom: insects.bottom,
          }}>
          {!userState?.accessToken && (
            <PrimaryButton
              onPress={onPressLogin}
              btnText={'Login / Signup'}
              style={styles.loginBtn}
            />
          )}
          <View key="version" style={{ paddingBottom: 10 }}>
            <View>
              <Text style={styles.itemText}>{version}</Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              paddingBottom: 10,
            }}>
            <TouchableOpacity key="privacy_policy" style={styles.touchable} onPress={onPressPolicy}>
              <View>
                <Text style={styles.itemText}>{i18next.t('label.privacy_policy')}</Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                height: 3,
                width: 3,
                borderRadius: 100,
                backgroundColor: 'black',
              }}
            />

            <TouchableOpacity key="imprint" style={styles.touchable} onPress={onPressImprint}>
              <View>
                <Text style={styles.itemText}>{i18next.t('label.imprint')}</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 3, width: 3, borderRadius: 100, backgroundColor: 'black' }} />

            <TouchableOpacity
              key="terms_of_service"
              style={styles.touchable}
              onPress={onPressTerms}>
              <View>
                <Text style={styles.itemText}>{i18next.t('label.terms_of_service')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Skeleton.Group>
    </>
  );
};

export default CustomDrawer;

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
  defaultSpacing: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  touchable: {},
  itemText: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    fontSize: Typography.FONT_SIZE_18,
    lineHeight: Typography.LINE_HEIGHT_24,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
});
