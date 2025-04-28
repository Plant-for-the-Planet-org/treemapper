import React from 'react';
import { View, Text } from 'react-native';
import ProjectTabs from './native/ProjectTabs';
import { ProjectsI } from '../../../types/app.interface';

interface HomeUIProps {
  projects: ProjectsI[];
  activeProject: string;
  onSelectProject: (id: string) => void;
}

export function HomeUI({ projects, activeProject, onSelectProject }: HomeUIProps) {
  // Native-specific UI rendering only, no logic
  return (
    <View style={{paddingTop:100}}>
      <ProjectTabs 
        projects={projects} 
        activeProject={activeProject}
        onSelectProject={onSelectProject}
      />
    </View>
  );
}

export default HomeUI;