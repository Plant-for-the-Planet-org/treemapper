import React from 'react';
import HomeUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';
import {useRouter} from 'solito/navigation'


function Home() {
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);  
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  const {push}= useRouter()
  const createNewProject=()=>{
    push('/createproject')
  }
  const openProfileSetting=()=>{
    push('/profile')
  }
  return (
    <HomeUI 
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
      createNewProject={createNewProject}
      openProfileSetting={openProfileSetting}
    />
  );
}

export default Home;