import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useContext } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

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
    default:
      return undefined;
  }
};

const CustomDrawer = props => {
  const { navigation, state } = props;
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);
  const { dispatch } = useContext(InventoryContext);
  const { state: loadingState, dispatch: loadingDispatch } = useContext(LoadingContext);

  const insects = useSafeAreaInsets();

  console.log('userState', userState);

  const handleLogout = async () => {
    const isLogout = await auth0Logout(userDispatch);
    // isLogout && setIsLoggedIn(false);
  };

  const onPressLogin = async () => {
    startLoading()(loadingDispatch);
    auth0Login(userDispatch, dispatch)
      .then(() => {
        stopLoading()(loadingDispatch);
      })
      .catch(err => {
        if (err?.response?.status === 303) {
          navigation.navigate('SignUp');
        }
        stopLoading()(loadingDispatch);
      });
  };

  let avatar =
    cdnUrl && userState?.image
      ? `${protocol}://${cdnUrl}/media/cache/profile/avatar/${userState?.image}`
      : '';

  return (
    <>
      <SafeAreaView style={{ flex: 1, paddingTop: insects.top }}>
        <View style={styles.container}>
          <View style={styles.profileContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.header}
              onPress={() => navigation.closeDrawer()}>
              <Ionicons name="arrow-back" size={24} color={Colors.BLACK} />
            </TouchableOpacity>
            <View style={styles.profile}>
              <View style={styles.profileInfo}>
                {avatar ? (
                  <Image resizeMode={'contain'} source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <Image resizeMode={'contain'} source={single_tree_png} style={styles.avatar} />
                )}
                {userState?.accessToken ? (
                  <View style={styles.profileInfoTextCon}>
                    <Text style={styles.username}>
                      {userState?.firstName + '' + userState?.lastName}
                    </Text>
                    <Text style={styles.email}>{userState?.email}</Text>
                  </View>
                ) : (
                  <View style={styles.profileInfoTextCon}>
                    <Text style={styles.username}>Guest User</Text>
                  </View>
                )}
              </View>
              {userState?.accessToken && (
                <TouchableOpacity activeOpacity={0.7} style={styles.pencil}>
                  <FontAwesome name="pencil" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.drawerItemContainer}>
            {state.routeNames.map(
              (name, index) =>
                !(name === 'BottomTab') && (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    style={styles.drawerItem}
                    onPress={event => {
                      props.navigation.navigate(name);
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
                ),
            )}
            {userState?.accessToken && (
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
            )}
          </View>
          {!userState?.accessToken && (
            <PrimaryButton
              onPress={onPressLogin}
              btnText={'Login / Signup'}
              style={styles.loginBtn}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E0E026',
  },
  profileContainer: {
    paddingHorizontal: Spacing.SCALE_16,
    backgroundColor: Colors.WHITE,
  },
  header: {
    width: Spacing.SCALE_30,
    height: 56,
    justifyContent: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfoTextCon: {
    marginLeft: 12,
  },
  username: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: 'black',
  },
  email: {
    marginTop: 4,
    color: '#4F4F4F',
    fontSize: Typography.FONT_SIZE_12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  pencil: {
    backgroundColor: Colors.PRIMARY + '20',
    padding: 10,
    borderRadius: 500,
  },
  drawerItemContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  drawerItem: {
    height: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerItemLabel: {
    fontSize: Typography.FONT_SIZE_14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    marginLeft: 12,
  },
  drawerItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtn: {
    bottom: 0,
    width: '90%',
    alignSelf: 'center',
    position: 'absolute',
  },
});
