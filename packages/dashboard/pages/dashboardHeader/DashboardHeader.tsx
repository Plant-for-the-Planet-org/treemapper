import DashboardHeaderUI from './components';
import { useRouter } from 'solito/navigation'

interface DashboardHeaderProps {
  token: string;
}

function DashboardHeader({ token }: DashboardHeaderProps) {

  const { push } = useRouter()
  
  const createNewProject = () => {
    push(`/dashboard/project`)

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
      token={token}
    />
  );
}

export default DashboardHeader;