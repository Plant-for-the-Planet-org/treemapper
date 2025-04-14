import React from 'react';
import { View, Text } from 'react-native';
import ProjectTabs from './native/ProjectTabs';
import type { Project } from '../Home';

interface HomeUIProps {
  projects: Project[];
  activeProject: string | null;
  onSelectProject: (id: string) => void;
}

export function HomeUI({ projects, activeProject, onSelectProject }: HomeUIProps) {
  // Native-specific UI rendering only, no logic
  return (
    <View>
      <Text>Projects Dashboard</Text>
      <ProjectTabs 
        projects={projects} 
        activeProject={activeProject}
        onSelectProject={onSelectProject}
      />
    </View>
  );
}

export default HomeUI;