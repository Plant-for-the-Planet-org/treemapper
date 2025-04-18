import React from 'react';
import HomeUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';


function Home() {
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);  
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  return (
    <HomeUI 
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
    />
  );
}

export default Home;