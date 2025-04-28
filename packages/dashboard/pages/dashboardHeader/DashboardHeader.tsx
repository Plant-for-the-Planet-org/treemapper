import React from 'react';
import DashboardHeaderUI from './components';
import { useRouter } from 'solito/navigation'


function DashboardHeader() {

  const { push } = useRouter()
  const createNewProject = () => {
    push(`/dashboard/project}`)

  }
  const openProfileSetting = () => {
    push(`/dashboard/profile`)
  }

  const updateRoute = (newRoute: string) => {
    push(`/dashboard/${newRoute}`)
  }

  return (
    <DashboardHeaderUI
      createNewProject={createNewProject}
      openProfileSetting={openProfileSetting}
      updateRoute={updateRoute}
    />
  );
}

export default DashboardHeader;