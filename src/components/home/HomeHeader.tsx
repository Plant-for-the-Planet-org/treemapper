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
import useProjectMangement from 'src/hooks/realm/useProjectMangement'
import { getAllProjects, getServerIntervention, getUserSpecies } from 'src/api/api.fetch'
import { updateProjectError, updateProjectState } from 'src/store/slice/projectStateSlice'
import { convertInevtoryToIntervention, getExtendedPageParam } from 'src/utils/helpers/interventionHelper/legacyInventorytoIntervention'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { updateLastServerIntervetion, updateServerIntervetion, updateUserSpeciesadded, updateUserToken } from 'src/store/slice/appStateSlice'
import useManageScientificSpecies from 'src/hooks/realm/useManageScientificSpecies'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import useAuthentication from 'src/hooks/useAuthentication'
import SyncIntervention from '../intervention/SyncIntervention'
import { Colors } from 'src/utils/constants'

interface Props {
  toogleFilterModal: () => void
  toogleProjectModal: () => void
}

const HomeHeader = (props: Props) => {
  const { addAllProjects } = useProjectMangement()
  const { addUserSpecies } = useManageScientificSpecies()
  const { toogleFilterModal, toogleProjectModal } = props
  const { addNewIntervention } = useInterventionManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const userType = useSelector((state: RootState) => state.userState.type)
  const { lastServerInterventionpage, serverInterventionAdded, userSpecies, isLogedIn, expiringAt, refreshToken } = useSelector((state: RootState) => state.appState)
  const { refreshUserToken } = useAuthentication()
  const { addNewLog } = useLogManagement()
  const { projectAdded } = useSelector(
    (state: RootState) => state.projectState,
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
    if (!userSpecies && isLogedIn) {
      setTimeout(() => {
        syncUserSpecies()
      }, 3000);
    }
  }, [isLogedIn, expiringAt])

  const syncUserSpecies = async () => {
    try {
      const result = await getUserSpecies()
      if (result && result.length > 0) {
        const resposne = await addUserSpecies(result)
        if (resposne) {
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


  const refreshUser = async () => {
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
    } catch (error) {
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
    if (userType && !serverInterventionAdded) {
      addServerIntervention()
    }
  }, [userType, lastServerInterventionpage, expiringAt])

  const addServerIntervention = async () => {
    try {
      const result = await getServerIntervention(lastServerInterventionpage)
      const interventions = []
      if (result && result.items) {
        if (!result._links.next || result._links.next === result._links.self) {
          dispatch(updateServerIntervetion(true))
          return;
        }
        for (let index = 0; index < result.count; index++) {
          if (result.items[index] && result.items[index].id === 'loc_8HnYd9gTXBt108EUALRiEhnp') {
            continue;
          }
          const element = convertInevtoryToIntervention(result.items[index]);
          interventions.push(element)
          await addNewIntervention(element)
        }
        const nextPage = getExtendedPageParam(result._links.next)
        dispatch(updateLastServerIntervetion(nextPage))
        addNewLog({
          logType: 'DATA_SYNC',
          message: "Intervention Fetched successfully",
          logLevel: 'info',
          statusCode: '000',
        })
      } else {
        addNewLog({
          logType: 'DATA_SYNC',
          message: "Intrevntion Fetched(Response error)",
          logLevel: 'error',
          statusCode: '000',
        })
      }
    } catch (err) {
      console.log("Error Occured", err)
      addNewLog({
        logType: 'DATA_SYNC',
        message: "Error while fetching intervention",
        logLevel: 'error',
        statusCode: '000',
      })
    }
  }


  const handleProjects = async () => {
    const response = await getAllProjects()
    if (response) {
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
        message: "Project Fetching failed(response error)",
        logLevel: 'error',
        statusCode: '400',
      })
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={[styles.iconWrapper, styles.hamburger]} onPress={openHomeDrawer}>
        <HamburgerIcon onPress={openHomeDrawer} width={22} height={22} />
      </Pressable>
      <SyncIntervention isLogedIn={isLogedIn} />
      <View style={styles.sectionWrapper} />
      {userType && userType === 'tpo' ? (
        <>
          <Pressable style={[styles.iconWrapper, styles.commonIcon]} onPress={toogleProjectModal}>
            <HomeMapIcon
              onPress={toogleProjectModal}
              width={22} height={22}
            />
          </Pressable>
          <Pressable style={[styles.iconWrapper, styles.commonIcon]} onPress={toogleFilterModal}>
            <FilterMapIcon
              onPress={toogleFilterModal}
              width={22} height={22}
            />
          </Pressable>
        </>
      ) : null}
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
    width: 45,
    height: 45,
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
    marginRight: 10
  }
})
