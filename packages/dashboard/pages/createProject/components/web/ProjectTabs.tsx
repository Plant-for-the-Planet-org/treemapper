import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import React from 'react';
import { ProjectsI } from '../../../../types/app.interface';


interface Props {
  projects: ProjectsI[]
  activeProject: string
  onSelectProject: (i: string) => void
}

const ProjectDropdown = ({ projects }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-64">
      {/* Dropdown Button */}
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-md p-2 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium">Projects</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute mt-1 w-full z-10 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Create New Project Button */}
          <div className="p-2 border-b border-gray-200">
            <button className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-md transition-colors">
              <span>Create New Project</span>
              <Plus size={18} />
            </button>
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto">
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {project.name} 
                </button>
              ))
            ) : (
              <div className="p-3 text-gray-500 text-center">
                No projects to display
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;