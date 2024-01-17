import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';

import { ENV_TYPE } from '../../../environment';
import HeaderV2 from '../Common/Header/HeaderV2';
import { Colors, Typography } from '../../styles';
import { IS_ANDROID, scaleSize } from '../../styles/mixins';
import { InventoryContext } from '../../reducers/inventory';
import { SET_APP_ENVIRONMENT } from '../../redux/slices/envSlice';
import { checkLoginAndSync } from '../../utils/checkLoginAndSync';
import { UserContext } from '../../reducers/user';
import { useNetInfo } from '@react-native-community/netinfo';
import { clearAllUploadedInventory } from '../../repositories/inventory';
import { deleteAllProjects } from '../../repositories/projects';
import { resetAllSpecies } from '../../repositories/species';
import { modifyUserDetails } from '../../repositories/user';
import { setFetchGivenMonthsInventoryFlag } from '../../actions/inventory';

const { width, height } = Dimensions.get('screen');

const Environment = () => {
  const { currentEnv } = useSelector(state => state.envSlice);
  const dispatch = useDispatch();
  const insects = useSafeAreaInsets();

  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  const { state, dispatch: inventoryDispatch } = useContext(InventoryContext);
  const { state: userState, dispatch: userDispatch } = useContext(UserContext);

  const handleChangeEnv = async type => {
    if (state.isUploading) {
      Alert.alert('Inventory upload is in progress');
    } else {
      deleteAllProjects();
      await clearAllUploadedInventory();
      await resetAllSpecies();
      dispatch(SET_APP_ENVIRONMENT(type));
      checkLoginAndSync({
        sync: false,
        inventoryState: state,
        dispatch: inventoryDispatch,
        userDispatch: userDispatch,
        connected: netInfo.isConnected,
        internet: netInfo.isInternetReachable,
      });
      setFetchGivenMonthsInventoryFlag(7)(dispatch);
      modifyUserDetails({
        isFirstFetched: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderV2
        headingText="Environment"
        containerStyle={{
          paddingHorizontal: 25,
          paddingTop: IS_ANDROID ? insects.top + 20 : insects.top,
        }}
      />
      <View style={styles.btnCon}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={state.isUploading}
          onPress={() => handleChangeEnv(ENV_TYPE.STAGING)}>
          <View
            style={[
              styles.btn,
              currentEnv === ENV_TYPE.STAGING && {
                backgroundColor: Colors.PRIMARY + '20',
              },
            ]}>
            <View style={styles.iconCon}>
              <FontAwesome5Icon name={'code'} size={30} color={Colors.PRIMARY} />
            </View>
            <Text style={styles.drawerItemLabel}>Development</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={state.isUploading}
          onPress={() => handleChangeEnv(ENV_TYPE.PROD)}>
          <View
            style={[
              styles.btn,
              currentEnv === ENV_TYPE.PROD && { backgroundColor: Colors.PRIMARY + '20' },
            ]}>
            <View style={styles.iconCon}>
              <FontAwesome5Icon name={'laptop-code'} size={30} color={Colors.PRIMARY} />
            </View>
            <Text style={styles.drawerItemLabel}>Production</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Environment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  btnCon: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  btn: {
    borderRadius: 8,
    borderWidth: 2,
    width: width / 2.5,
    height: width / 2.5,
    marginVertical: height / 30,
    borderColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY + '40',
    borderRadius: 100,
    width: 70,
    height: 70,
  },
  drawerItemLabel: {
    fontSize: Typography.FONT_SIZE_16,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    marginTop: scaleSize(12),
    color: Colors.PRIMARY,
  },
});
