import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Pressable
} from 'react-native';
// Import icons from your preferred icon library
// For example with react-native-vector-icons:
// import { ChevronDown, Plus, Check } from 'react-native-vector-icons/Feather';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProjectDropdown = ({
  projects = [],
  onSelectProject,
  onCreateProject,
  placeholder = "Select a project",
  emptyMessage = "No projects available",
  buttonText = "Add New Project",
  containerStyle = {},
  dropdownStyle = {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(
    projects.length > 0 ? projects[0] : null
  );
  
  // Animation for bottom sheet
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };
  
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    onSelectProject && onSelectProject(project.id);
    closeModal();
  };
  
  const handleCreateProject = () => {
    closeModal();
    onCreateProject && onCreateProject();
  };
  
  // Render dropdown trigger
  const renderTrigger = () => (
    <TouchableOpacity
      style={[styles.dropdownTrigger, dropdownStyle]}
      onPress={openModal}
      activeOpacity={0.7}
    >
      <Text style={styles.selectedText}>
        {selectedProject ? selectedProject.name : placeholder}
      </Text>
      {/* Replace with actual icon */}
      <Text style={styles.chevronIcon}>▼</Text>
    </TouchableOpacity>
  );
  
  // Render dropdown content
  const renderContent = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Animated.View 
            style={[
              styles.backdrop, 
              { opacity: backdropOpacity }
            ]} 
          />
        </Pressable>
        
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <Text style={styles.sheetTitle}>Select Project</Text>
          
          <ScrollView style={styles.contentContainer}>
            {projects.length > 0 ? (
              <View style={styles.projectsContainer}>
                <Text style={styles.sectionLabel}>Your Projects</Text>
                
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectItem,
                      selectedProject && selectedProject.id === project.id && 
                        styles.selectedItem
                    ]}
                    onPress={() => handleSelectProject(project)}
                  >
                    <Text style={styles.projectName}>{project.name}</Text>
                    {selectedProject && selectedProject.id === project.id && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProject}
          >
            <Text style={styles.addButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
  
  return (
    <View style={[styles.container, containerStyle]}>
      {renderTrigger()}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop:100
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
  },
  chevronIcon: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30, // Add extra padding for iOS home indicator
    // If using Android, consider using paddingBottom: 20 instead
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  contentContainer: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  projectsContainer: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: '#f0f0f0',
  },
  projectName: {
    fontSize: 16,
    color: '#333',
  },
  checkIcon: {
    fontSize: 18,
    color: '#007AFF', // iOS blue
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default ProjectDropdown;