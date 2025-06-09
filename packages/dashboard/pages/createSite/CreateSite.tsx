import React, { useEffect } from 'react';
import CreateProjectUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';
import { useRouter } from 'solito/navigation'
import { useToken } from "../../context/TokenContext";
import {toast} from 'react-toastify'



function CreateProject() {
  const {accessToken} = useToken()
  const { back, replace } = useRouter()
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectedProjectselectProject = useProjectStore((state) => state.selectedProject);

  useEffect(() => {
    if(!selectedProjectselectProject){
      toast.warning("Please select a project before creating site")
      replace('/dashboard/sites')
    }
  }, [selectedProjectselectProject])
  

  const goBack = (newRoute: string) => {
    back()
  }
  return (
    <CreateProjectUI
      projects={projects}
      activeProject={selectedProject}
      token={accessToken}
      goBack={goBack}
    />
  );
}

export default CreateProject;