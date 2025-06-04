import React from 'react';
import ProjectTabs from './web/ProjectTabs';


interface HomeUIProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (newRoute: string) => void;
  token: string
}

export function HomeUI({ createNewProject, openProfileSetting, updateRoute, token }: HomeUIProps) {
  return (
    <div className="flex-grow w-full md:w-auto sticky top-0 z-50" style={{ backgroundColor: "#fff", position:'relative' }}>
      <ProjectTabs
        createNewProject={createNewProject}
        openProfileSetting={openProfileSetting}
        updateRoute={updateRoute}
        token={token}
      />
    </div>
  );
}

export default HomeUI;