import React from 'react';

import TreeManagement from './components/web/TreeManagement'



function InterventionHome({ newIntervention, bulkUpload }) {


  return (
    <TreeManagement newIntervention={newIntervention} bulkUpload={bulkUpload} />);
}

export default InterventionHome;