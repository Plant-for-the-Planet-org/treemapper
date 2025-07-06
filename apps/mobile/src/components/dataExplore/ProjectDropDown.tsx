import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Types
interface ProjectsI {
  id: string;
  name: string;
}

interface Props {
  projects: ProjectsI[];
  activeProject: string;
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  placeholder?: string;
}

const ProjectDropdown: React.FC<Props> = ({
  projects=[],
  activeProject,
  onSelectProject,
  onCreateNewProject,
  placeholder = "Select Project",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const selectedProject = projects.find(p => p.id === activeProject);

  const toggleModal = () => {
    setIsVisible(!isVisible);
  };

  const handleSelectProject = (projectId: string) => {
    onSelectProject(projectId);
    setIsVisible(false);
  };

  const handleCreateNewProject = () => {
    onCreateNewProject();
    setIsVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dropdown Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={toggleModal}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          <View style={styles.triggerTextContainer}>
            <Text style={styles.triggerValue} numberOfLines={1}>
              {selectedProject ? selectedProject.name : placeholder}
            </Text>
          </View>
          <View style={styles.triggerIcon}>
            <Ionicons name="chevron-down" size={20} color="#007A49" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Full Screen Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#007A49" />
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Project</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            {/* Create New Project Card */}
            <TouchableOpacity
              style={styles.createProjectCard}
              onPress={handleCreateNewProject}
              activeOpacity={0.8}
            >
              <View style={styles.createProjectIcon}>
                <Ionicons name="add" size={24} color="#007A49" />
              </View>
              <View style={styles.createProjectText}>
                <Text style={styles.createProjectTitle}>Create New Project</Text>
                <Text style={styles.createProjectSubtitle}>
                  Start a new project from scratch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007A49" />
            </TouchableOpacity>

            {/* Projects List */}
            <View style={styles.projectsSection}>
              <Text style={styles.sectionTitle}>Your Projects</Text>
              
              <ScrollView
                style={styles.projectsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.projectsListContent}
              >
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectCard,
                        activeProject === project.id && styles.activeProjectCard,
                        index === projects.length - 1 && styles.lastProjectCard
                      ]}
                      onPress={() => handleSelectProject(project.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.projectCardContent}>
                        <View style={[
                          styles.projectIndicator,
                          activeProject === project.id && styles.activeProjectIndicator
                        ]} />
                        <View style={styles.projectInfo}>
                          <Text style={[
                            styles.projectName,
                            activeProject === project.id && styles.activeProjectName
                          ]}>
                            {project.name}
                          </Text>
                          {activeProject === project.id && (
                            <Text style={styles.currentProjectLabel}>Current Project</Text>
                          )}
                        </View>
                        {activeProject === project.id && (
                          <View style={styles.checkmarkContainer}>
                            <Ionicons name="checkmark-circle" size={24} color="#007A49" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <Ionicons name="folder-outline" size={48} color="#ccc" />
                    </View>
                    <Text style={styles.emptyStateTitle}>No Projects Yet</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Create your first project to get started
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '60%',
    marginVertical: 8,
  },
  
  // Trigger Button Styles
  triggerButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 12,
    color: '#007A49',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  triggerValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  triggerIcon: {
    marginLeft: 12,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#007A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Create Project Card
  createProjectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    shadowColor: '#007A49',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createProjectIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E8F5E8',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createProjectText: {
    flex: 1,
  },
  createProjectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007A49',
    marginBottom: 4,
  },
  createProjectSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Projects Section
  projectsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectsList: {
    flex: 1,
  },
  projectsListContent: {
    paddingBottom: 20,
  },

  // Project Cards
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeProjectCard: {
    borderColor: '#007A49',
    backgroundColor: '#F8FDF8',
  },
  lastProjectCard: {
    marginBottom: 0,
  },
  projectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  projectIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    marginRight: 16,
  },
  activeProjectIndicator: {
    backgroundColor: '#007A49',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activeProjectName: {
    color: '#007A49',
  },
  currentProjectLabel: {
    fontSize: 12,
    color: '#007A49',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});

export default ProjectDropdown;