import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import React from 'react';
import NotificationBell from './NotificationIcon';
import ProfileAvatar from './ProfileAvatar';
import LabelTabs from './LabelTabs';
import useMediaQuery from './useMediaQuery';
import useProjectStore from '../../../../store/useProjectStore';

interface Props {
  createNewProject: () => void;
  openProfileSetting: () => void;
  updateRoute: (newRoute: string) => void;
}

const ProjectDropdown = ({
  createNewProject,
  openProfileSetting,
  updateRoute
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLargeScreen = useMediaQuery('(min-width: 768px)');

  const projects = useProjectStore((state) => state.projects);
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectProject = useProjectStore((state) => state.selectProject);


  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProjectSelect = (projectId: string) => {
    setIsOpen(false);
    selectProject(projectId)
  };

  return (
    <div className="flex flex-col w-full shadow-sm border-b border-gray-100">
      {/* Top row with project dropdown and notification/profile */}
      <div className="flex items-center justify-between w-full px-4 py-2">
        {/* Project Dropdown */}
        <div className="relative w-64 max-w-[60%] flex-shrink-0" style={{ backgroundColor: "#f5f5f5" }}>
          {/* Dropdown Button */}
          <button
            onClick={toggleDropdown}
            style={{ backgroundColor: "#f5f5f5" }}
            className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium truncate">
              {selectedProject ?
                projects.find(p => p.id === selectedProject)?.name || 'Projects' :
                'Projects'}
            </span>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute mt-1 w-full z-10 bg-white border border-gray-100 rounded-md shadow-lg">
              {/* Create New Project Button */}
              <div className="p-2 border-b border-gray-200">
                <button
                  onClick={() => {
                    createNewProject();
                    setIsOpen(false);
                  }}
                  style={{ backgroundColor: "#E1EDE8", color: "#262626" }}
                  className="w-full flex items-center justify-between p-2 rounded-md font-medium">
                  <span>Create New Project</span>
                  <Plus size={20} />
                </button>
              </div>
              {/* Project List */}
              <div className="max-h-60 overflow-y-auto">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={`w-full text-left p-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${project.id === selectedProject ? 'bg-gray-100 font-medium' : ''
                        }`}
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
        {isLargeScreen && <div className="w-full overflow-x-auto px-4 py-2">
          <LabelTabs updateRoute={updateRoute} />
        </div>}
        {/* Right-side components */}
        <div className="flex items-center space-x-4 sm:space-x-6 flex-shrink-0">
          <NotificationBell
          />
          <ProfileAvatar imageUrl='https://avatar.iran.liara.run/public' openProfileSetting={openProfileSetting} />
        </div>
      </div>

      {!isLargeScreen && <div className="w-full overflow-x-auto px-4 py-2">
        <LabelTabs updateRoute={function (newRoute: string): void {
          throw new Error('Function not implemented.');
        }} />
      </div>}
    </div>
  );
};

export default ProjectDropdown;