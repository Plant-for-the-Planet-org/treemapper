import InterventionsUI from './components/web/Home'; // This imports the platform-specific UI




function BulkUploadHome({ goback }) {

  return (
    <InterventionsUI goback={goback} />
  );
}

export default BulkUploadHome;