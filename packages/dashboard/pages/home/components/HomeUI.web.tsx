import React from 'react';
import ProjectTabs from './web/ProjectTabs';
import type { Project } from '../Home';

interface HomeUIProps {
  projects: Project[];
  activeProject: string | null;
  onSelectProject: (id: string) => void;
}

export function HomeUI({ projects, activeProject, onSelectProject }: HomeUIProps) {
  // Web-specific UI rendering only, no logic
  return (
    <div className="home-container">
      <h1>Projects Dashboard</h1>
      <ProjectTabs 
        projects={projects} 
        activeProject={activeProject}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}

export default HomeUI;