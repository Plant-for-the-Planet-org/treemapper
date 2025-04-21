import React from 'react';
import ProfileSettingUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';


function ProfileSetting() {
  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);  
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  return (
    <ProfileSettingUI 
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
    />
  );
}

export default ProfileSetting;