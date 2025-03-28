import { Pressable, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import HamburgerIcon from 'assets/images/svg/HamburgerIcon.svg'
import FilterMapIcon from 'assets/images/svg/FilterMapIcon.svg'
import HomeMapIcon from 'assets/images/svg/HomeMapIcon.svg'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import useProjectManagement from 'src/hooks/realm/useProjectManagement'
import { getAllProjects, getServerIntervention, getUserSpecies } from 'src/api/api.fetch'
import { resetProjectState, updateProjectError, updateProjectState } from 'src/store/slice/projectStateSlice'
import { convertInventoryToIntervention, getExtendedPageParam } from 'src/utils/helpers/interventionHelper/legacyInventoryIntervention'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { logoutAppUser, updateLastServerIntervention, updateNewIntervention, updateServerIntervention, updateUserLogin, updateUserSpeciesadded, updateUserToken } from 'src/store/slice/appStateSlice'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import useAuthentication from 'src/hooks/useAuthentication'
import SyncIntervention from '../intervention/SyncIntervention'
import { Colors } from 'src/utils/constants'
import { SCALE_24 } from 'src/utils/constants/spacing'
import SpeciesSync from '../common/SpeciesSync'
import { resetUserDetails } from 'src/store/slice/userStateSlice'
import NetInfo from "@react-native-community/netinfo";

interface Props {
  toggleFilterModal: () => void
  toggleProjectModal: () => void
}

const HomeHeader = (props: Props) => {
  const { addAllProjects } = useProjectManagement()
  const { addUserSpecies } = useManageScientificSpecies()
  const { logoutUser } = useAuthentication()
  const { toggleFilterModal, toggleProjectModal } = props
  const { addNewIntervention } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const { lastServerInterventionpage, serverInterventionAdded, userSpecies, isLoggedIn, expiringAt, refreshToken } = useSelector((state: RootState) => state.appState)
  const { refreshUserToken } = useAuthentication()
  const { addNewLog } = useLogManagement()
  const { projectAdded } = useSelector(
    (state: RootState) => state.projectState,
  )
  const { isSyncing } = useSelector(
    (state: RootState) => state.syncState,
  )
  const dispatch = useDispatch()

  const openHomeDrawer = () => {
    navigation.navigate('HomeSideDrawer')
  }

  useEffect(() => {
    if (userType === 'tpo' && !projectAdded) {
      handleProjects()
    }
  }, [userType, projectAdded, expiringAt])


  useEffect(() => {
    if (!userSpecies && isLoggedIn) {
      setTimeout(() => {
        syncUserSpecies()
      }, 3000);
    }
  }, [isLoggedIn, expiringAt])

  const syncUserSpecies = async () => {
    try {
      const { response, success } = await getUserSpecies()
      if (success && response.length > 0) {
        const result = await addUserSpecies(response)
        if (result) {
          dispatch(updateUserSpeciesadded(true))
        }
      }
    } catch (error) {
      console.log("error", error)
    }
  }

  useEffect(() => {
    const isExpired = hasTimestampExpiredOrCloseToExpiry(expiringAt);
    if (expiringAt && isExpired) {
      refreshUser()
    }
  }, [expiringAt])



  const handleLogout = async () => {
    try {
      await logoutUser()
      dispatch(resetProjectState())
      dispatch(updateUserLogin(false))
      dispatch(resetUserDetails())
      dispatch(logoutAppUser())
      dispatch(updateNewIntervention())
    } catch (error) {
      console.log("Error occurred while logout")
    }
  }



  const refreshUser = async () => {
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      return;
    }
    try {
      const credentials = await refreshUserToken(refreshToken)
      if (credentials) {
        dispatch(
          updateUserToken({
            idToken: credentials.idToken,
            accessToken: credentials.accessToken,
            expiringAt: credentials.expiresAt,
            refreshToken: credentials.refreshToken
          })
        )
      }
      if (!credentials && isLoggedIn) {
        handleLogout()
      }
    } catch (error) {
      handleLogout()
      console.log("error", error)
    }
  }

  function hasTimestampExpiredOrCloseToExpiry(timestamp) {
    // Convert timestamp to milliseconds
    timestamp *= 1000;

    // Get the current time in milliseconds since the Unix epoch
    const currentTime = Date.now();

    // Calculate the time 5 hours (in milliseconds)
    const fiveHoursInMilliseconds = 5 * 60 * 60 * 1000;

    // Check if the provided timestamp is within 5 hours of expiring or has already expired
    return (timestamp - currentTime) <= fiveHoursInMilliseconds;
  }

  useEffect(() => {
    if (userType && !serverInterventionAdded && !isSyncing) {
      addServerIntervention()
    }
  }, [userType, lastServerInterventionpage, expiringAt])

  //Remove this Intervention from Staging DB.
  const deleteThis = ["ivn_IkUNHz5Cn2vf7iy0FOcmIBHN", "ivn_fVSURzjYpGU0ozFD60dPrbJF", "ivn_8HnYd9gTXBt108EUALRiEhnp"]

  const checkInternetConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected;
  }


  const addServerIntervention = async () => {
    try {
      const { response, success } = await getServerIntervention(lastServerInterventionpage)
      if (success && response?.items) {
        for (let index = 0; index < response.count; index++) {
          if (response.items[index] && deleteThis.includes(response.items[index].id)) {
            continue;
          }
          const element = convertInventoryToIntervention(response.items[index]);
          await addNewIntervention(element)
        }
        if (!response._links.next || response._links.next === response._links.self) {
          dispatch(updateServerIntervention(true))
          return;
        }
        const nextPage = getExtendedPageParam(response._links.next)
        dispatch(updateLastServerIntervention(nextPage))
        addNewLog({
          logType: 'DATA_SYNC',
          message: "Intervention fetched successfully",
          logLevel: 'info',
          statusCode: '000',
        })
      } else {
        addNewLog({
          logType: 'DATA_SYNC',
          message: "Intervention fetched (Response error)",
          logLevel: 'error',
          statusCode: '000',
        })
      }
    } catch (err) {
      console.log("Error occurred", err)
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error while fetching intervention",
        logLevel: 'error',
        statusCode: '000',
      })
    }
  }


  const handleProjects = async () => {
    const { response, success } = await getAllProjects()
    if (success && response) {
      const result = await addAllProjects(response)
      if (result) {
        dispatch(updateProjectState(true))
        addNewLog({
          logType: 'PROJECTS',
          message: "Project Fetched",
          logLevel: 'info',
          statusCode: '000',
        })
      } else {
        dispatch(updateProjectError(true))
        addNewLog({
          logType: 'PROJECTS',
          message: "Error while syncing project",
          logLevel: 'error',
          statusCode: '000',
        })
      }
    } else {
      addNewLog({
        logType: 'PROJECTS',
        message: "Project fetching failed (response error)",
        logLevel: 'error',
        statusCode: '400',
      })
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={[styles.iconWrapper, styles.hamburger]} onPress={openHomeDrawer}>
        <HamburgerIcon onPress={openHomeDrawer} width={SCALE_24} height={SCALE_24} />
      </Pressable>
      <SpeciesSync />
      <SyncIntervention isLoggedIn={isLoggedIn} />
      <View style={styles.sectionWrapper} />
      {userType && userType === 'tpo' ? (
        <Pressable style={[styles.iconWrapper, styles.commonIcon]} onPress={toggleProjectModal}>
          <HomeMapIcon
            onPress={toggleProjectModal}
            width={SCALE_24} height={SCALE_24}
          />
        </Pressable>
      ) : null}
      <Pressable style={[styles.iconWrapper, styles.commonIcon]} onPress={toggleFilterModal}>
        <FilterMapIcon
          onPress={toggleFilterModal}
          width={SCALE_24} height={SCALE_24}
        />
      </Pressable>
    </View>
  )
}

export default HomeHeader

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 50,
    width: '100%',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    top: 80,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.NEW_PRIMARY,
  },
  sectionWrapper: {
    flex: 1,
  },
  hamburger: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginRight: 10
  },
  commonIcon: {
    borderRadius: 10,
    marginRight: 15
  }
})
