import ProjectTabs from './ProjectTabs';


interface HomeUIProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (newRoute: string) => void;
  token: string
}

export function DashboardHeaderWeb({ createNewProject, openProfileSetting, updateRoute, token }: HomeUIProps) {
  return (
    <div className="flex-grow w-full md:w-auto sticky top-0 z-50" style={{ backgroundColor: "#fff", position:'relative', zIndex:1 }}>
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