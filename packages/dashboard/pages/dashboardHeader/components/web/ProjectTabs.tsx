import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Folder, Crown, Shield, Users, Eye, User } from 'lucide-react';
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
  const { projects, selectProject, selectedProject, addProjects, updatePrjError, updateProjectLoading } = useProjectStore((state) => state);
  const { user } = useUserStore((state) => state);

  useEffect(() => {
    if (user) {
      fetchUserProjects()
    }
  }, [user])

  function createProjectTitle(name: string) {
    // Capitalize the first letter and make the rest lowercase
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return `${formattedName}'s personal project`;
  }

  const fetchUserProjects = async () => {
    updateProjectLoading(true)
    const response = await getMyProjects(token)
    if (response && response.statusCode == 200) {
      if (response.data) {
        const sortedResponse = sortProjects(response.data);
        addProjects(sortedResponse)
        if (sortedResponse.length > 0) {
          selectProject(sortedResponse[0]);
        } else {
          const payLoad = {
            "projectName": createProjectTitle(user?.displayName),
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 text-yellow-600" />;
      case 'admin': return <Shield className="w-3 h-3 text-blue-600" />;
      case 'contributor': return <Users className="w-3 h-3 text-green-600" />;
      case 'viewer': return <Eye className="w-3 h-3 text-gray-600" />;
      default: return <User className="w-3 h-3 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'admin': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'contributor': return 'bg-green-50 text-green-700 border-green-200';
      case 'viewer': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProjectSelect = (projectId: ProjectWithUserRoleI) => {
    setIsOpen(false);
    selectProject(projectId)
  };

  return (
    <div className="flex flex-col w-full bg-white shadow-sm border-b border-gray-200">
      {/* Top row with project dropdown and notification/profile */}
      <div className="flex items-center w-full px-3 py-2">
        {/* Enhanced Project Dropdown */}
        <div className="relative min-w-1 flex-1 max-w-sm" style={{ marginRight: 20 }} >
          {/* Dropdown Button */}
          <button
            onClick={toggleDropdown}
            className="flex items-center justify-between w-full bg-white border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1 hover:bg-gray-50 transition-all duration-200 shadow-sm group"
          >
            {selectedProject && <div className="flex items-center  min-w-0 flex-1">
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-semibold text-gray-900 truncate text-sm">
                  {selectedProject?.projectName || 'Select Project'}
                </span>
                {selectedProject && (
                  <div className="flex items-center gap-1">
                    {getRoleIcon(selectedProject.userRole)}
                    <span className="text-xs text-gray-500 capitalize">
                      {selectedProject.userRole}
                    </span>
                  </div>
                )}
              </div>
            </div>}
            {!selectedProject && <div className="flex items-center  min-w-0 flex-1 py-2">
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-semibold text-gray-900 truncate text-sm">
                  Select Project
                </span>
              </div>
            </div>}
            <div className="flex-shrink-0 ml-2">
              {isOpen ?
                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" /> :
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              }
            </div>
          </button>

          {/* Enhanced Dropdown Content */}
          {isOpen && (
            <div className="absolute mt-2 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              {/* Create New Project Button */}
              <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => {
                    createNewProject();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg font-medium bg-green-700 hover:bg-green-600 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Create New Project</span>
                  </div>
                </button>
              </div>

              {/* Project List */}
              <div className="max-h-72 overflow-y-auto">
                {projects.length > 0 ? (
                  <div className="p-2">
                    {projects.map((project, index) => (
                      <button
                        key={project.uid}
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 mb-1 group ${project.uid === selectedProject?.uid
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${project.uid === selectedProject?.uid
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-gray-500 group-hover:to-gray-600'
                              }`}>
                              <Folder className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-medium truncate text-sm ${project.uid === selectedProject?.uid ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                {project.projectName}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                {getRoleIcon(project.userRole)}
                                <span className="text-xs text-gray-500 capitalize">
                                  {project.userRole}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Role Badge */}

                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Folder className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No projects available</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Tabs for Large Screen */}
        {isLargeScreen && (
          <div>
            <div>
              <LabelTabs updateRoute={updateRoute} />
            </div>
          </div>
        )}

        {/* Enhanced Right-side components */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative">
              <NotificationBell />
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <ProfileAvatar
              openProfileSetting={openProfileSetting}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Tabs */}
      {!isLargeScreen && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded-xl p-1 border border-gray-200">
            <LabelTabs updateRoute={updateRoute} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;