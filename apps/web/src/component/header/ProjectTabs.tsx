import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Folder, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationIcon';
import ProfileAvatar from './ProfileAvatar';
import LabelTabs from './LabelTabs';
import useMediaQuery from '@/hooks/useMediaQuery'
import useProjectStore from '@shared-core/store/useProjectStore';
import { useRouter, usePathname } from 'next/navigation';
import { ProjectWithUserRoleI } from '@shared-core/types/interface.app';
import { useUserStore } from '@shared-core/store/useUserStore';
import { selectOrg } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext'
import { toast } from 'react-toastify';
import { subpageFromPath, projectHref } from '@/lib/projectRoutes';

interface Props {
  createNewProject: () => void;
  openProfileSetting: () => void;
  updateRoute: (newRoute: string) => void;
  token: string
}

interface WorkspaceGroup {
  workspace: {
    uid: string;
    name: string;
    slug: string;
    type: 'Platform' | 'Private' | 'Development';
  };
  projects: ProjectWithUserRoleI[];
}

const ProjectDropdown = ({
  createNewProject,
  openProfileSetting,
  updateRoute,
  token
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set());
  const isLargeScreen = useMediaQuery('(min-width: 768px)');
  const { projects, selectProject, selectedProject, selectedWorkspce, setDefaultWorkspce, workspace } = useProjectStore((state) => state);
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken } = useToken()

  const User = useUserStore(state => state.user)

  // Group projects by workspace and sort
  const groupedProjects = () => {
    const groups: { [key: string]: WorkspaceGroup } = {};

    projects.forEach(project => {
      const workspaceKey = project.workspace.uid;
      if (!groups[workspaceKey]) {
        groups[workspaceKey] = {
          workspace: project.workspace,
          projects: []
        };
      }
      groups[workspaceKey].projects.push(project);
    });

    // Sort projects within each workspace by creation date (newest first)
    Object.values(groups).forEach(group => {
      group.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    // Sort workspaces alphabetically
    return Object.values(groups).sort((a, b) => a.workspace.name.localeCompare(b.workspace.name));
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleWorkspace = (workspaceUid: string) => {
    const newCollapsed = new Set(collapsedWorkspaces);
    if (newCollapsed.has(workspaceUid)) {
      newCollapsed.delete(workspaceUid);
    } else {
      newCollapsed.add(workspaceUid);
    }
    setCollapsedWorkspaces(newCollapsed);
  };

  const handleProjectSelect = async (project: ProjectWithUserRoleI) => {
    setIsOpen(false);
    try {
      const result = await selectProjectandWorkspace(project)
      if (result) {
        selectProject(project);
        const finalWorkspace = workspace.filter(el => el.uid === project.workspace['uid'])
        if (finalWorkspace.length > 0) {
          setDefaultWorkspce(finalWorkspace[0])
        }
        const subpage = subpageFromPath(pathname) ?? 'overview';
        router.push(projectHref(project.uid, subpage));
      }
    } catch (e) {
      toast.error("Something went wrong")
    }
  };

  const selectProjectandWorkspace = async (project: ProjectWithUserRoleI) => {
    const workspaceChange = project.workspace['uid'] !== selectedWorkspce?.uid
    if (workspaceChange) {
      const response = await selectOrg(accessToken, {
        workspaceUid: project.workspace['uid'],
        projectUid: project.uid
      })
      if (response.statusCode === 200) {
        return true
      } else {
        toast.error("Something went wrong")
        return false
      }
    } else {
      return true
    }
  }



  const workspaceGroups = groupedProjects();

  return (
    <div className="flex flex-col w-full bg-white border-b border-gray-100">
      {/* Top row with project dropdown and notification/profile */}
      <div className="flex items-center w-full px-4 py-2.5">
        {/* Project Dropdown */}
        <div className="relative min-w-1 flex-1 max-w-sm mr-2">
          {/* Dropdown Button */}
          <Button
            variant="ghost"
            onClick={toggleDropdown}
            className={cn(
              "w-full justify-between h-auto p-2.5 bg-gray-50/50 hover:bg-gray-100/80 border border-gray-200/60 rounded-md text-left font-normal transition-all duration-200",
              isOpen && "bg-gray-100/80"
            )}
          >
            {selectedProject ? (
              <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                <span className="font-medium text-gray-900 truncate text-sm w-full block">
                  {selectedProject.name}  <span className="text-xs text-gray-500 capitalize">
                    ({selectedProject.userRole})
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-medium text-gray-600 text-sm">
                  Select Project
                </span>
              </div>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-180"
            )} />
          </Button>
          {isOpen && <div className='h-[100vh] w-[100vw] z-50 absolute top-0' onClick={() => { setIsOpen(false) }} />}
          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute mt-1 w-full z-50 bg-white border border-gray-200/80 rounded-lg shadow-lg overflow-hidden">
              {/* Create New Project Button */}
              <div className="p-2 border-b border-gray-100/80">
                <Button
                  variant="ghost"
                  onClick={() => {
                    createNewProject();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center h-auto p-2.5 bg-[#007A49] hover:bg-[#006B3F] cursor-pointer align-center"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span style={{ color: "white" }}>Create New Project</span>
                </Button>
              </div>

              {/* Workspace and Project List */}
              <div className="max-h-80 overflow-y-auto py-1 mr-2 pb-2">
                {workspaceGroups.length > 0 ? (
                  <div className="space-y-1">
                    {workspaceGroups.map((group) => (
                      <Collapsible
                        key={group.workspace.uid}
                        open={!collapsedWorkspaces.has(group.workspace.uid)}
                        onOpenChange={() => toggleWorkspace(group.workspace.uid)}
                      >
                        {/* Workspace Header */}
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between h-auto py-2  rounded-sm hover:bg-gray-50/80 font-normal text-left",
                              selectedProject?.workspace.uid === group.workspace.uid && "bg-gray-100/60"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                selectedProject?.workspace.uid === group.workspace.uid ? "bg-gray-400" : "bg-gray-300"
                              )} />
                              <div className="flex flex-col items-start min-w-0 flex-1">
                                <span className="font-medium text-gray-800 text-sm truncate w-full">
                                  {group.workspace.name}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                  {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className={cn(
                              "w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0",
                              !collapsedWorkspaces.has(group.workspace.uid) && "rotate-90"
                            )} />
                          </Button>
                        </CollapsibleTrigger>

                        {/* Projects List */}
                        <CollapsibleContent className="space-y-0.5">
                          <div className="ml-6 space-y-0.5">
                            {group.projects.map((project) => (
                              <Button
                                key={project.uid}
                                variant="ghost"
                                onClick={() => handleProjectSelect(project)}
                                className={cn(
                                  "w-full justify-start h-auto mt-1 rounded-sm hover:bg-gray-50/80 font-normal text-left",
                                  project.uid === selectedProject?.uid && "bg-green-50/80 hover:bg-green-50"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                    project.uid === selectedProject?.uid ? "bg-green-700" : "bg-gray-300"
                                  )} />
                                  <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className={cn(
                                      "font-medium text-sm truncate w-full",
                                      project.uid === selectedProject?.uid ? "text-green-900" : "text-gray-800"
                                    )}>
                                      {project.name}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">
                                      {project.userRole}
                                    </span>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Folder className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm">No projects available</p>
                    <p className="text-gray-500 text-xs mt-1">Create your first project to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs for Large Screen */}
        {isLargeScreen && (
          <div>
            <LabelTabs updateRoute={updateRoute} />
          </div>
        )}

        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-3">
            <NotificationBell />
            {selectedWorkspce && selectedWorkspce.userRole !== 'member' && <button
              onClick={() => router.push(`/workspace/${selectedWorkspce.uid}`)}
              className="cursor-pointer relative p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            >
              <Building size={24} />
            </button>}
            <div className="h-6 w-px bg-gray-200"></div>
            <ProfileAvatar openProfileSetting={openProfileSetting} />
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      {!isLargeScreen && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50/80 rounded-lg p-1 border border-gray-200/60">
            <LabelTabs updateRoute={updateRoute} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDropdown;