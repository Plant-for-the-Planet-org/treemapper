import React from 'react';
import ProjectTabs from './web/ProjectTabs';
import { ProjectsI } from '../../../types/app.interface'


interface HomeUIProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (newRoute: string) => void;
}

export function HomeUI({ createNewProject, openProfileSetting, updateRoute }: HomeUIProps) {
  return (
    <div className="flex-grow w-full md:w-auto sticky top-0 z-10" style={{ backgroundColor: "#f5f5f5" }}>
      <ProjectTabs
        createNewProject={createNewProject}
        openProfileSetting={openProfileSetting}
        updateRoute={updateRoute}
      />
    </div>
  );
}

export default HomeUI;