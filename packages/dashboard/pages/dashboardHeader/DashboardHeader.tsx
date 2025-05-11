import React, { useEffect } from 'react';
import DashboardHeaderUI from './components';
import { useRouter } from 'solito/navigation'
import { getUserDetails } from '../../api/api.fetch';

interface DashboardHeaderProps {
  token: string;
}

function DashboardHeader({ token }: DashboardHeaderProps) {
  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    console.log('Fetching user details...', token)
    const response = await getUserDetails(token)
    console.log('Fetching user response...', response)
  }

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