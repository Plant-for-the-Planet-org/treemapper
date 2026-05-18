import ProjectTabs from './ProjectTabs';


interface HomeUIProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (newRoute: string) => void;
  token: string
  isLoading: boolean
}

export function DashboardHeaderWeb({ createNewProject, openProfileSetting, updateRoute, token, isLoading }: HomeUIProps) {
  if(isLoading){
    return null
  }
  return (
    <div className="flex-grow w-full md:w-auto sticky top-0" style={{ backgroundColor: "#fff", position:'sticky', zIndex:60 }}>
      <ProjectTabs
        createNewProject={createNewProject}
        openProfileSetting={openProfileSetting}
        updateRoute={updateRoute}
        token={token}
      />
    </div>
  );
}

export default DashboardHeaderWeb;