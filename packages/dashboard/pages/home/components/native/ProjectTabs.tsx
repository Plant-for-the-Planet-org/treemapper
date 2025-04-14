import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Animated,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo - if not, import your preferred icon library

const ProjectDropdown = ({ projects = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleDropdown = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const dropdownHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, projects.length ? Math.min(projects.length * 50 + 60, 250) : 100],
  });

  return (
    <View style={styles.container}>
      {/* Dropdown Button */}
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownButtonText}>Projects</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#333" 
        />
      </TouchableOpacity>

      {/* Dropdown Content */}
      <Animated.View style={[styles.dropdownContent, { height: dropdownHeight }]}>
        {isOpen && (
          <View style={styles.dropdownContainer}>
            {/* Create New Project Button */}
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>Create New Project</Text>
              <Ionicons name="add" size={18} color="#2196F3" />
            </TouchableOpacity>

            {/* Project List */}
            <ScrollView style={styles.projectList}>
              {projects.length > 0 ? (
                projects.map((project, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.projectItem,
                      index === projects.length - 1 && styles.lastProjectItem
                    ]}
                  >
                    <Text style={styles.projectItemText}>{project.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyProject}>
                  <Text style={styles.emptyProjectText}>No projects to display</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    marginVertical: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dropdownContent: {
    overflow: 'hidden',
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dropdownContainer: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  createButtonText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  projectList: {
    maxHeight: 190,
  },
  projectItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lastProjectItem: {
    borderBottomWidth: 0,
  },
  projectItemText: {
    fontSize: 15,
  },
  emptyProject: {
    padding: 15,
    alignItems: 'center',
  },
  emptyProjectText: {
    color: '#757575',
    fontSize: 14,
  },
});

export default ProjectDropdown;