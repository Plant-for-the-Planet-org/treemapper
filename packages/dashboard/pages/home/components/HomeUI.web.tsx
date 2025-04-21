import React from 'react';
import ProjectTabs from './web/ProjectTabs';
import { ProjectsI } from '../../../types/app.interface'
import useHomeStore from '../../../store/useHomeStore';
import Overview from './web/Overview';
import Teams from './web/Teams';
import TeamsDashboard from './web/TeamDashboard';
import SpeciesManagementPage from './web/SpeciesDashboard';
import ProjectSettings from './web/ProjectSetting';


interface HomeUIProps {
  projects: ProjectsI[];
  activeProject: string;
  onSelectProject: (id: string) => void;
  createNewProject: () => void
}

export function HomeUI({ projects, activeProject, onSelectProject, createNewProject }: HomeUIProps) {
  // Web-specific UI rendering only, no logic
  const parentTab = useHomeStore((state) => state.parentTab);

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
      <div>
        {parentTab === 'overview' && <Overview />}
        {parentTab === 'team' && <TeamsDashboard />}
        {parentTab === 'species' && <SpeciesManagementPage />}
        {parentTab === 'settings' && <ProjectSettings />}

        
      </div>
    </div>
  );
}

export default HomeUI;