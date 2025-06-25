import React from 'react';
import InterventionsUI from './components'; // This imports the platform-specific UI
import { useRouter } from 'solito/navigation'




function InterventionHome() {
  const { push } = useRouter()
  const newIntervention = () => {
    push(`/dashboard/new-intervention`)
  }
    const bulkUpload = () => {
    push(`/dashboard/bulkupload`)
  }

  return (
    <InterventionsUI newIntervention={newIntervention} bulkUpload={bulkUpload}/>
  );
}

export default InterventionHome;