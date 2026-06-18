import { Pressable, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import HamburgerIcon from 'assets/images/svg/HamburgerIcon.svg'
import FilterMapIcon from 'assets/images/svg/FilterMapIcon.svg'
import HomeMapIcon from 'assets/images/svg/HomeMapIcon.svg'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { getMobileInterventions, getUserSpecies } from 'src/api/api.fetch'
import { convertInventoryToIntervention, getExtendedPageParam } from 'src/utils/helpers/interventionHelper/legacyInventoryIntervention'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateNewIntervention, updateServerIntervention, updateUserSpeciesadded } from 'src/store/slice/appStateSlice'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { refreshSession } from 'src/api/sessionManager'
import useAppStartup from 'src/hooks/useAppStartup'
import useDeviceRegistration from 'src/hooks/useDeviceRegistration'
import SyncIntervention from '../intervention/SyncIntervention'
import { Colors } from 'src/utils/constants'
import { SCALE_24 } from 'src/utils/constants/spacing'
import SpeciesSync from '../common/SpeciesSync'
import NetInfo from "@react-native-community/netinfo";
import { getMobileUserDetails } from '../../api/api.fetch'
import { updateUserDetails } from '../../store/slice/userStateSlice'
import ProjectInviteModal from './DeepLinkModal'
import SyncMonitoringPlot from '../monitoringPlot/SyncMonitoringPlot'

interface Props {
  toggleFilterModal: () => void
  toggleProjectModal: () => void
}

const HomeHeader = (props: Props) => {
  // Self-triggers: registers the device once after login and on every foreground.
  useDeviceRegistration()
  const { toggleFilterModal, toggleProjectModal } = props
  useAppStartup()
  const { addNewIntervention, interventionExists } = useInterventionManagement()
  const isCheckingNewInterventions = useRef(false)
  const isBackfilling = useRef(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const [tokenValid, setTokenValid] = useState<boolean>(false)
  const { serverInterventionAdded, isLoggedIn, expiringAt } = useSelector((state: RootState) => state.appState)
  const { addNewLog } = useLogManagement()

  const { isSyncing } = useSelector(
    (state: RootState) => state.syncState,
  )
  const dispatch = useDispatch()

  const openHomeDrawer = () => {
    navigation.navigate('HomeSideDrawer')
  }


  useEffect(() => {
    const isExpired = hasTimestampExpiredOrCloseToExpiry(expiringAt);
    if (expiringAt && isExpired) {
      refreshUser()
      setTokenValid(false)
    } else {
      setTokenValid(true)
    }
  }, [isLoggedIn, expiringAt])

  useEffect(() => {
    if (!tokenValid) {
      return;
    }

    if (userType !== '' && !serverInterventionAdded && !isSyncing && isLoggedIn) {
      addMobileServerIntervention()
    }
  }, [userType, serverInterventionAdded, isSyncing, expiringAt, isLoggedIn, tokenValid])

  useEffect(() => {
    if (isLoggedIn) {
      syncUserDetails()
    }
  }, [isLoggedIn])

  // Once the initial backfill is done, re-check the server for newly created
  // interventions every time the Home screen regains focus. This keeps the
  // mobile app in sync with interventions added on web without needing a
  // logout/login.
  useFocusEffect(
    useCallback(() => {
      if (
        tokenValid &&
        isLoggedIn &&
        serverInterventionAdded &&
        userType !== '' &&
        !isSyncing
      ) {
        checkForNewInterventions()
      }
    }, [tokenValid, isLoggedIn, serverInterventionAdded, userType, isSyncing])
  )



  const syncUserDetails = async () => {
    try {
      const { response } = await getMobileUserDetails()
      if (response && response.data) {
        dispatch(updateUserDetails({ ...response.data, image: response.data.image }))
      }
    } catch (error) {
      console.error("error", error)
    }
  }

  const deleteThis = ["ivn_IkUNHz5Cn2vf7iy0FOcmIBHN", "ivn_fVSURzjYpGU0ozFD60dPrbJF", "ivn_8HnYd9gTXBt108EUALRiEhnp"]


  const refreshUser = async () => {
    const isConnected = await checkInternetConnectivity();
    if (!isConnected) {
      return;
    }
    // refreshSession renews via the SDK's stored refresh token, writes the
    // fresh tokens to Redux, and forces logout itself if the refresh fails.
    // minTtl matches the 5-hour proactive window in
    // hasTimestampExpiredOrCloseToExpiry below.
    await refreshSession({ minTtl: 5 * 60 * 60 })
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



  const checkInternetConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected;
  }


  // Initial backfill: pull EVERY intervention from the server in one pass by
  // walking the pages until we hit a partial or empty page. We only mark the
  // backfill complete (serverInterventionAdded) when the whole scan finishes
  // cleanly; if a page errors mid-way we leave it incomplete so it retries on a
  // later trigger instead of stopping short and stranding interventions.
  const addMobileServerIntervention = async () => {
    if (isBackfilling.current) {
      return
    }
    const isConnected = await checkInternetConnectivity()
    if (!isConnected) {
      return
    }
    isBackfilling.current = true
    try {
      const pageSize = 6
      let page = 1
      let addedCount = 0
      let completed = false
      while (true) {
        const { response, success } = await getMobileInterventions(page.toString())
        if (!success) {
          // Server/network error mid-scan: stop without marking complete so the
          // backfill runs again later and finishes the remaining pages.
          break
        }
        const items = response?.data?.items
        if (!items || items.length === 0) {
          completed = true
          break
        }
        for (let index = 0; index < items.length; index++) {
          const element = convertInventoryToIntervention(items[index])
          // Conversion returns null/undefined when a server record fails to map
          // (bad geometry, malformed sample tree, etc). Skip it instead of
          // passing it on, otherwise it throws downstream and the record is lost
          // silently. Log it so we can spot bad records.
          if (!element) {
            addNewLog({
              logType: 'DATA_SYNC',
              message: `Skipped intervention that failed to convert: ${items[index]?.id || 'unknown id'}`,
              logLevel: 'warn',
              statusCode: '000',
            })
            continue
          }
          await addNewIntervention(element)
          addedCount += 1
        }
        // A partial page means there are no more pages, so the scan is done.
        if (items.length < pageSize) {
          completed = true
          break
        }
        page += 1
      }
      if (completed) {
        dispatch(updateServerIntervention(true))
        if (addedCount > 0) {
          dispatch(updateNewIntervention())
        }
        addNewLog({
          logType: 'DATA_SYNC',
          message: `Initial backfill complete: ${addedCount} intervention(s) fetched`,
          logLevel: 'info',
          statusCode: '000',
        })
      }
    } catch (err) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error while fetching intervention",
        logLevel: 'error',
        statusCode: '000',
      })
    } finally {
      isBackfilling.current = false
    }
  }

  // Scans the server starting from the newest interventions (page 1) and adds
  // any that the device does not already have. The server returns interventions
  // sorted by creation date (newest first), so newly created interventions
  // always appear at the top. As soon as we hit an intervention we already
  // store, everything below it is older and already synced, so we stop.
  const checkForNewInterventions = async () => {
    if (isCheckingNewInterventions.current) {
      return
    }
    const isConnected = await checkInternetConnectivity()
    if (!isConnected) {
      return
    }
    isCheckingNewInterventions.current = true
    try {
      const pageSize = 6
      let page = 1
      let addedCount = 0
      let keepScanning = true
      while (keepScanning) {
        const { response, success } = await getMobileInterventions(page.toString())
        const items = response?.data?.items
        if (!success || !items || items.length === 0) {
          break
        }
        let reachedKnown = false
        for (let index = 0; index < items.length; index++) {
          const raw = items[index]
          if (interventionExists(raw.id)) {
            // Caught up with what the device already has.
            reachedKnown = true
            break
          }
          const element = convertInventoryToIntervention(raw)
          if (element) {
            await addNewIntervention(element)
            addedCount += 1
          }
        }
        // Stop when we reach an already-stored intervention or a partial page
        // (no more pages). Otherwise the whole page was new, so keep scanning.
        if (reachedKnown || items.length < pageSize) {
          keepScanning = false
        } else {
          page += 1
        }
      }
      if (addedCount > 0) {
        // Bump the timestamp so intervention lists/headers re-read from Realm.
        dispatch(updateNewIntervention())
        addNewLog({
          logType: 'DATA_SYNC',
          message: `Fetched ${addedCount} new intervention(s) from server`,
          logLevel: 'info',
          statusCode: '000',
        })
      }
    } catch (err) {
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error while checking for new interventions",
        logLevel: 'error',
        statusCode: '000',
      })
    } finally {
      isCheckingNewInterventions.current = false
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={[styles.iconWrapper, styles.hamburger]} onPress={openHomeDrawer}>
        <HamburgerIcon onPress={openHomeDrawer} width={SCALE_24} height={SCALE_24} />
      </Pressable>
      <View style={{ alignItems: 'flex-start', gap: 5 }}>
        <SpeciesSync />
        <SyncIntervention isLoggedIn={isLoggedIn} tokenValid={tokenValid} />
        <SyncMonitoringPlot isLoggedIn={isLoggedIn} tokenValid={tokenValid} />
      </View>
      <ProjectInviteModal />
      <View style={styles.sectionWrapper} />
      {userType && <Pressable style={[styles.iconWrapper, styles.commonIcon]} onPress={toggleProjectModal}>
        <HomeMapIcon
          onPress={toggleProjectModal}
          width={SCALE_24} height={SCALE_24}
        />
      </Pressable>}
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
