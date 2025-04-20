import React from 'react';
import ProjectTabs from './web/ProjectTabs';
import {ProjectsI} from '../../../types/app.interface'

interface HomeUIProps {
  projects: ProjectsI[];
  activeProject: string;
  onSelectProject: (id: string) => void;
  createNewProject:()=>void
}

export function HomeUI({ projects, activeProject, onSelectProject, createNewProject }: HomeUIProps) {
  // Web-specific UI rendering only, no logic
  return (
    <div className="w-full h-full">
      <ProjectTabs 
        projects={projects} 
        activeProject={activeProject}
        onSelectProject={onSelectProject}
        createNewProject={createNewProject}
      />
    </div>
  );
}

export default HomeUI;