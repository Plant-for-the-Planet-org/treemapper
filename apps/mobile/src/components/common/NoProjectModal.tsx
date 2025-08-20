import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import useProjectManagement from 'src/hooks/realm/useProjectManagement';
import { getAllMobileProjects, getUserProjects } from 'src/api/api.fetch';
import { updateProjectState, updateProjectError, updateCurrentProject } from 'src/store/slice/projectStateSlice';
import useLogManagement from 'src/hooks/realm/useLogManagement';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from 'src/types/type/navigation.type';
import openWebView from 'src/utils/helpers/appHelper/openWebView';

const { width } = Dimensions.get('window');

const NoProjectModal = ({
  v3Approved,
  userType
}) => {

  const [loading, setLoading] = useState(false)
  const { currentProject, projectAdded } = useSelector(
    (state: RootState) => state.projectState,
  )
  const refetchProject = useSelector(
    (state: RootState) => state.appState.refetchProject,
  )
  const dispatch = useDispatch()
  const [shouldDisplayModal, setShouldDisplayModal] = useState(false)
  const { addAllProjects } = useProjectManagement()
  const { addNewLog } = useLogManagement()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    if (v3Approved || userType === 'tpo') {
      handleProjects()
    }
  }, [v3Approved, userType, refetchProject])


  const handleProjects = async () => {
    const { responseData, responseError } = await getUserProjects(v3Approved)
    if (!responseError) {
      if (responseData.length === 0) {
        setShouldDisplayModal(true)
        return;
      }
      const result = await addAllProjects(responseData)
      if (result) {
        if (responseData.length > 0) {
          dispatch(updateCurrentProject({
            name: responseData[0].properties.name,
            id: responseData[0].properties.uid
          }))
        }
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



  const onCreateProject = () => {
    setShouldDisplayModal(false)
    if (v3Approved) {
      navigation.navigate('CreateProject')
    } else {
      openWebView(
        `https://web.plant-for-the-planet.org/en/profile/projects/new-project`,
      )
    }
  }
  return (
    <Modal
      isVisible={currentProject.projectId === '' && projectAdded && shouldDisplayModal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.6}
      style={styles.modal}
      // Prevent dismissal since this can't be skipped
      onBackdropPress={() => { }}
      onSwipeComplete={() => { }}
    >
      <View style={styles.container}>
        {/* Handle bar - visual only, no functionality */}
        <View style={styles.handleBar} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="folder-open-outline" size={42} color="#007A49" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>No Project Found</Text>

        {/* Description */}
        <Text style={styles.description}>
          We couldn't find any projects associated with your account.
          Please create a new project to get started, or if you've been
          invited to join an existing project, click on the invitation
          link you received.
        </Text>

        {/* Create Project Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={onCreateProject}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="sync-outline" size={20} color="#FFFFFF" style={styles.loadingIcon} />
              <Text style={styles.createButtonText}>Creating Project...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="add-outline" size={22} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create New Project</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Additional help text */}
        <Text style={styles.helperText}>
          Need help? Contact support if you believe this is an error.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 380,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5EC',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 36,
    paddingHorizontal: 4,
  },
  createButton: {
    height: 56,
    backgroundColor: '#007A49',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007A49',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#A0C4B4',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingIcon: {
    // Simple rotation animation can be added here if needed
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NoProjectModal;