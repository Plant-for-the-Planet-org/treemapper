import React from 'react';
import ProjectTabs from './web/ProjectTabs';


interface HomeUIProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (newRoute: string) => void;
  token: string
}

export function HomeUI({ createNewProject, openProfileSetting, updateRoute, token }: HomeUIProps) {
  console.log("SDc",token)
  return (
    <div className="flex-grow w-full md:w-auto sticky top-0 z-10" style={{ backgroundColor: "#f5f5f5" }}>
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