import React from 'react';
import ProjectTabs from './web/ProjectTabs';
import {ProjectsI} from '../../../types/app.interface'

interface HomeUIProps {
  projects: ProjectsI[];
  activeProject: string;
  onSelectProject: (id: string) => void;
}

export function HomeUI({ projects, activeProject, onSelectProject }: HomeUIProps) {
  // Web-specific UI rendering only, no logic
  return (
    <div className="home-container">
      <ProjectTabs 
        projects={projects} 
        activeProject={activeProject}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}

export default HomeUI;