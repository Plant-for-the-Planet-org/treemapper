import React from 'react';
import HomeUI from './components'; // This imports the platform-specific UI
import useProjectStore from '../../store/useProjectStore';
import { useRouter } from 'solito/navigation'
import { useState, useEffect } from 'react';
import * as APIClient from '../../api/api.fetch'


function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch data
    const fetchData = async () => {
      try {
        // Replace with your API endpoint
        const response = await APIClient.healthCheck();

        console.log('Response:', response);
      } catch (error) {
        // Handle any errors
        setError(error.message);
        console.error('Error fetching data:', error);
      } finally {
        // Set loading to false regardless of outcome
        setLoading(false);
      }
    };

    // Call the fetch function
    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);
  const handleSelectProject = (id: string) => {
    selectProject(id)
  };
  const { push } = useRouter()
  const createNewProject = () => {
    push('/createproject')
  }
  const openProfileSetting = () => {
    push('/profile')
  }
  return (
    <HomeUI
      projects={projects}
      activeProject={selectedProject}
      onSelectProject={handleSelectProject}
      createNewProject={createNewProject}
      openProfileSetting={openProfileSetting}
    />
  );
}

export default Home;