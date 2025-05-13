import React from 'react';
import CreateProjectUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';
import { useRouter } from 'solito/navigation'


interface Props {
  token: string
}


function CreateProject({ token }: Props) {
  const { back } = useRouter()
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  const goBack = (newRoute: string) => {
    back()
  }
  return (
    <CreateProjectUI
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
      token={token}
      goBack={goBack}
    />
  );
}

export default CreateProject;