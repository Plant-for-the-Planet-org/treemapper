import React, { useState, useEffect } from 'react';
import HomeUI from './components'; // This imports the platform-specific UI

export interface Project {
  name: string;
  id: string;
}

interface HomeProps {
  initialProjects: Project[];
}

function Home({ initialProjects }: HomeProps) {
  // Shared logic and state management here
  const [projects, setProjects] = useState(initialProjects);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  
  // Example of shared business logic
  const handleSelectProject = (id: string) => {
    setActiveProject(id);
    // Other logic...
  };
  
  // Pass state and handlers to the UI component
  return (
    <HomeUI 
      projects={projects}
      activeProject={activeProject}
      onSelectProject={handleSelectProject}
    />
  );
}

export default Home;