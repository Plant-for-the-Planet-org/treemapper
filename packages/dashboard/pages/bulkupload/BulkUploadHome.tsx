import React from 'react';
import InterventionsUI from './components'; // This imports the platform-specific UI
import { useRouter } from 'solito/navigation'




function BulkUploadHome() {
  const { back } = useRouter()

  const goback = () => {
    back()
  }
  return (
    <InterventionsUI goback={goback} />
  );
}

export default BulkUploadHome;