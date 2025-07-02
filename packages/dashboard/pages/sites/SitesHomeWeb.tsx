import SiteHomeUI from './components/web/SiteManagementPage'; // This imports the platform-specific UI
function SiteHome({handleCreateNewSite}) {
  return (
    <SiteHomeUI handleCreateNewSite={handleCreateNewSite}/>
  );
}

export default SiteHome;