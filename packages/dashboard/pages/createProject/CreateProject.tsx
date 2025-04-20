import React from 'react';
import CreateProjectUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';


function CreateProject() {
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);  
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  return (
    <CreateProjectUI 
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
    />
  );
}

export default CreateProject;