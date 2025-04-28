import React from 'react';
import HomeUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';
import { useRouter } from 'solito/navigation'
import { useState, useEffect } from 'react';
import * as APIClient from '../../api/api.fetch'


function Home() {


  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  const { push } = useRouter()
  const createNewProject = () => {
    push('/createproject')
  }
  const openProfileSetting = () => {
    push('/profile')
  }

  const updateRoute = (newRoute:string) => {
    push(`dashboard/${newRoute}`)
  }

  return (
    <HomeUI
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
      createNewProject={createNewProject}
      openProfileSetting={openProfileSetting}
      updateRoute={updateRoute}
    />
  );
}

export default Home;