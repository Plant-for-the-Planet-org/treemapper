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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-grow w-full md:w-auto">
          <ProjectTabs 
            projects={projects} 
            activeProject={activeProject}
            onSelectProject={onSelectProject}
            createNewProject={createNewProject}
            notificationCount={6}
          />
        </div>
      </div>
      
      {/* Main content area below the header */}
      <div className="mt-4">
        {/* Your main content goes here */}
      </div>
    </div>
  );
}

export default HomeUI;