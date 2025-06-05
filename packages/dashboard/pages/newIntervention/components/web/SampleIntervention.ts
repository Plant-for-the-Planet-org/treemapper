const sampleInterventions = [
  {
    id: 'INT-019',
    type: 'single-tree-registration',
    date: '2025-07-15',
    location: { lat: 19.124, lng: 74.753 },
    details: 'Registered single teak tree near central trail',
    status: 'Completed',
    performedBy: 'Liam Patel'
  },
  {
    id: 'INT-020',
    type: 'single-tree-registration',
    date: '2025-07-18',
    location: { lat: 19.126, lng: 74.755 },
    details: 'Registered single mango tree in west grove',
    status: 'Completed',
    performedBy: 'Noah Mehta'
  },
  { 
    id: 'INT-009', 
    type: 'grass-suppression', 
    date: '2025-05-25', 
    location: { lat: 19.117, lng: 74.746 }, 
    details: 'Mulching to suppress aggressive grasses', 
    status: 'In Progress',
    performedBy: 'Robert Martinez'
  },
  { 
    id: 'INT-010', 
    type: 'firebreaks', 
    date: '2025-06-01', 
    location: { lat: 19.107, lng: 74.752 }, 
    details: 'Creation of 3m wide firebreak along western boundary', 
    status: 'Completed',
    performedBy: 'Emily Anderson'
  },
  { 
    id: 'INT-011', 
    type: 'assisting-seed-rain', 
    date: '2025-06-05', 
    location: { lat: 19.110, lng: 74.740 }, 
    details: 'Installation of perches for bird-mediated dispersal', 
    status: 'Completed',
    performedBy: 'Thomas White'
  },

  {
    id: 'INT-022',
    type: 'multi-tree-registration',
    date: '2025-07-22',
    location: { lat: 19.130, lng: 74.758 },
    details: 'Registered 10 jackfruit trees along eastern boundary',
    status: 'Completed',
    performedBy: 'Mason Reddy'
  },
  {
    id: 'INT-023',
    type: 'multi-tree-registration',
    date: '2025-07-25',
    location: { lat: 19.132, lng: 74.760 },
    details: 'Registered 6 tamarind trees near community area',
    status: 'Completed',
    performedBy: 'Ella Desai'
  },
  {
    id: 'INT-024',
    type: 'multi-tree-registration',
    date: '2025-07-28',
    location: { lat: 19.134, lng: 74.762 },
    details: 'Cluster registration of 12 native acacia trees',
    status: 'Ongoing',
    performedBy: 'Lucas Fernandes'
  },
  { 
    id: 'INT-001', 
    type: 'single-tree-registration', 
    date: '2025-01-15', 
    location: { lat: 19.111, lng: 74.747 }, 
    details: 'Registered neem tree in north sector', 
    status: 'Completed',
    performedBy: 'John Doe'
  },
  { 
    id: 'INT-002', 
    type: 'multi-tree-registration', 
    date: '2025-02-20', 
    location: { lat: 19.115, lng: 74.750 }, 
    details: 'Registered cluster of 5 banyan trees', 
    status: 'Completed',
    performedBy: 'Jane Smith'
  },
  { 
    id: 'INT-003', 
    type: 'removal-invasive-species', 
    date: '2025-03-10', 
    location: { lat: 19.105, lng: 74.738 }, 
    details: 'Removed lantana camara infestation', 
    status: 'Completed',
    performedBy: 'Michael Johnson'
  },
  { 
    id: 'INT-004', 
    type: 'fire-suppression', 
    date: '2025-04-05', 
    location: { lat: 19.120, lng: 74.742 }, 
    details: 'Emergency fire control in eastern sector', 
    status: 'Completed',
    performedBy: 'Sarah Williams'
  },
  { 
    id: 'INT-005', 
    type: 'fire-patrol', 
    date: '2025-05-01', 
    location: { lat: 19.118, lng: 74.735 }, 
    details: 'Regular fire patrol around perimeter', 
    status: 'Completed',
    performedBy: 'David Brown'
  },
  { 
    id: 'INT-006', 
    type: 'fencing', 
    date: '2025-05-10', 
    location: { lat: 19.114, lng: 74.744 }, 
    details: 'Installation of protective fencing', 
    status: 'In Progress',
    performedBy: 'Emma Davis'
  },
  { 
    id: 'INT-007', 
    type: 'marking-regenerant', 
    date: '2025-05-15', 
    location: { lat: 19.109, lng: 74.751 }, 
    details: 'Identifying and marking natural regeneration areas', 
    status: 'Completed',
    performedBy: 'James Wilson'
  },
  { 
    id: 'INT-008', 
    type: 'liberating-regenerant', 
    date: '2025-05-20', 
    location: { lat: 19.121, lng: 74.739 }, 
    details: 'Clearing competing vegetation around regenerants', 
    status: 'Completed',
    performedBy: 'Olivia Taylor'
  },
  { 
    id: 'INT-009', 
    type: 'grass-suppression', 
    date: '2025-05-25', 
    location: { lat: 19.117, lng: 74.746 }, 
    details: 'Mulching to suppress aggressive grasses', 
    status: 'In Progress',
    performedBy: 'Robert Martinez'
  },
  { 
    id: 'INT-010', 
    type: 'firebreaks', 
    date: '2025-06-01', 
    location: { lat: 19.107, lng: 74.752 }, 
    details: 'Creation of 3m wide firebreak along western boundary', 
    status: 'Completed',
    performedBy: 'Emily Anderson'
  },
  { 
    id: 'INT-011', 
    type: 'assisting-seed-rain', 
    date: '2025-06-05', 
    location: { lat: 19.110, lng: 74.740 }, 
    details: 'Installation of perches for bird-mediated dispersal', 
    status: 'Completed',
    performedBy: 'Thomas White'
  },
    {
    id: 'INT-021',
    type: 'single-tree-registration',
    date: '2025-07-20',
    location: { lat: 19.128, lng: 74.756 },
    details: 'Registered single peepal tree near water body',
    status: 'In Progress',
    performedBy: 'Emma Khan'
  },
  { 
    id: 'INT-012', 
    type: 'soil-improvement', 
    date: '2025-06-10', 
    location: { lat: 19.119, lng: 74.741 }, 
    details: 'Addition of compost and topsoil to degraded areas', 
    status: 'In Progress',
    performedBy: 'Sophia Garcia'
  },
  { 
    id: 'INT-013', 
    type: 'stop-tree-harvesting', 
    date: '2025-06-15', 
    location: { lat: 19.106, lng: 74.748 }, 
    details: 'Community awareness campaign and monitoring', 
    status: 'Ongoing',
    performedBy: 'Daniel Martinez'
  },
  { 
    id: 'INT-014', 
    type: 'direct-seeding', 
    date: '2025-06-20', 
    location: { lat: 19.122, lng: 74.745 }, 
    details: 'Native seed broadcasting in cleared areas', 
    status: 'Completed',
    performedBy: 'Ava Robinson'
  },
  { 
    id: 'INT-015', 
    type: 'enrichment-planting', 
    date: '2025-06-25', 
    location: { lat: 19.116, lng: 74.736 }, 
    details: 'Addition of 25 keystone species seedlings', 
    status: 'Completed',
    performedBy: 'Ethan Thompson'
  },
  { 
    id: 'INT-016', 
    type: 'maintenance', 
    date: '2025-07-01', 
    location: { lat: 19.108, lng: 74.743 }, 
    details: 'Regular maintenance of previous interventions', 
    status: 'Ongoing',
    performedBy: 'Isabella Clark'
  },
  { 
    id: 'INT-017', 
    type: 'maintenance', 
    date: '2025-07-05', 
    location: { lat: 19.113, lng: 74.749 }, 
    details: 'Fence repair and weeding in sector B', 
    status: 'Completed',
    performedBy: 'William Rodriguez'
  },
  { 
    id: 'INT-018', 
    type: 'other-intervention', 
    date: '2025-07-10', 
    location: { lat: 19.112, lng: 74.737 }, 
    details: 'Drone survey of restoration progress', 
    status: 'Completed',
    performedBy: 'Mia Lewis'
  }
];

export default sampleInterventions;