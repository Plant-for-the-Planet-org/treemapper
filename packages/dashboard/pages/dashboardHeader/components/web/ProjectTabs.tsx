import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import NotificationBell from './NotificationIcon';
import ProfileAvatar from './ProfileAvatar';
import LabelTabs from './LabelTabs';
import useMediaQuery from '../../../../utils/useMediaQuery/useMediaQuery.web';
import useProjectStore from '../../../../store/useProjectStore';
import { useUserStore } from '../../../../store/useUserStore';

import { createNewPersonalProject, getMyProjects } from '../../../../api/api.fetch'
import { sortProjects } from '../../../../utils/commonHelper';
import { ProjectWithUserRoleI } from '../../../../types/app.interface';

interface Props {
  createNewProject: () => void;
  openProfileSetting: () => void;
  updateRoute: (newRoute: string) => void;
  token: string
}

const ProjectDropdown = ({
  createNewProject,
  openProfileSetting,
  updateRoute,
  token
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLargeScreen = useMediaQuery('(min-width: 768px)');
  const { projects, selectProject, selectedProject, addProjects, updatePrjError } = useProjectStore((state) => state);
  const { user } = useUserStore((state) => state);

  useEffect(() => {
    if (user) {
      fetchUserProjects()
    }
  }, [user])

  function createProjectTitle(name) {
    // Capitalize the first letter and make the rest lowercase
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return `${formattedName}'s personal project`;
  }


  const fetchUserProjects = async () => {
    const response = await getMyProjects(token)
    if (response && response.statusCode == 200) {
      if (response.data) {
        const sortedResponse = sortProjects(response.data);
        addProjects(sortedResponse)
        if (sortedResponse.length > 0) {
          selectProject(sortedResponse[0]);
        } else {
          const payLoad = {
            "projectName": createProjectTitle(user?.displayName || user?.authName),
            "projectType": 'personal',
            "description": "This is your personal project, you can add species to it. You can invite other users to this project.",
          };
          const resp = await createNewPersonalProject(token, payLoad)
          if (resp && resp.statusCode === 201) {
            const newProject = {
              ...resp.data,
              userRole: 'owner',
            } as ProjectWithUserRoleI;
            addProjects([newProject]);
            selectProject(newProject);
          } else {
            updatePrjError(resp?.message || 'Failed to create personal project');
          }
        }
      }
      return
    }
    updatePrjError(response?.message || 'Failed to fetch projects');
  }



  const rolePriority = {
    'owner': 1,
    'admin': 2,
    'contributor': 3,
    'viewer': 4,
    'member': 5
  };




  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProjectSelect = (projectId: ProjectWithUserRoleI) => {
    setIsOpen(false);
    selectProject(projectId)
  };

  return (
    <div className="flex flex-col w-full shadow-sm border-b border-gray-100">
      {/* Top row with project dropdown and notification/profile */}
      <div className="flex items-center justify-between w-full px-4 py-2">
        {/* Project Dropdown */}
        <div className="relative w-64 max-w-[60%] flex-shrink-0" style={{ backgroundColor: "#fff" }}>
          {/* Dropdown Button */}
          <button
            onClick={toggleDropdown}
            style={{ backgroundColor: "#fff" }}
            className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-md p-2 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium truncate">
              {selectedProject ?
                selectedProject.projectName || 'Projects' :
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
                      key={project.uid}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full text-left p-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${project.uid === selectedProject?.uid ? 'bg-gray-100 font-medium' : ''
                        }`}
                    >
                      {project.projectName}
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