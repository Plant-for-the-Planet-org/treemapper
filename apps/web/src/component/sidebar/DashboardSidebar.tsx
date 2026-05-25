'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, MapPin, Leaf, Users, Activity, Upload,
  CheckSquare, FileText, BarChart2, Trophy, Settings,
  ChevronDown, ChevronRight, Plus, Trees
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@shared-core/store/useUserStore'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { selectOrg } from '@shared-core/fetchApi/api.fetch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { ProjectWithUserRoleI } from '@shared-core/types/interface.app'

interface SidebarProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (route: string) => void
  collapsed: boolean
}

const NavItem = ({
  icon: Icon,
  label,
  id,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ElementType
  label: string
  id: string
  active: boolean
  onClick: (id: string) => void
  collapsed?: boolean
}) => (
  <button
    onClick={() => onClick(id)}
    title={label}
    className={cn(
      'w-full flex items-center py-1.5 transition-colors',
      collapsed ? 'justify-center px-0' : 'justify-start px-2.5 gap-2.5',
      active
        ? 'text-green-800 font-medium rounded-xl [background-color:#e6f1ec]'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md'
    )}
  >
    <Icon size={15} className={cn('flex-shrink-0', active ? 'text-green-700' : 'text-gray-400')} />
    {!collapsed && <span className="text-sm">{label}</span>}
  </button>
)

const SectionLabel = ({ label, showSeparator = false, collapsed = false }: { label: string; showSeparator?: boolean; collapsed?: boolean }) => (
  <>
    {showSeparator && collapsed && <div className="h-px bg-gray-100 mx-1 my-1.5" />}
    {!collapsed && <p className="px-2.5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">{label}</p>}
  </>
)

export default function DashboardSidebar({ createNewProject, openProfileSetting, updateRoute, collapsed }: SidebarProps) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set())
  const exp = !collapsed
  const pathname = usePathname()
  const { accessToken } = useToken()
  const User = useUserStore(state => state.user)
  const {
    projects, selectProject, selectedProject,
    selectedWorkspce, setDefaultWorkspce, workspace,
  } = useProjectStore(state => state)

  const projectRole = selectedProject?.userRole
  const isContributor = projectRole === 'contributor'

  const activeRoute = (() => {
    const exact: Record<string, string> = {
      '/dashboard/overview': '',
      '/dashboard/approvals': 'approvals',
      '/dashboard/sites': 'sites',
      '/dashboard/species': 'species',
      '/dashboard/team': 'team',
      '/dashboard/intervention': 'intervention',
      '/dashboard/settings': 'settings',
      '/dashboard/dataexplore': 'dataexplore',
      '/dashboard/leaderboard': 'leaderboard',
    }
    if (exact[pathname] !== undefined) return exact[pathname]
    const prefixes: [string, string][] = [
      ['/dashboard/forms', 'forms'],
      ['/dashboard/approvals', 'approvals'],
      ['/dashboard/sites', 'sites'],
      ['/dashboard/species', 'species'],
      ['/dashboard/intervention', 'intervention'],
      ['/dashboard/bulkupload', 'bulkupload'],
    ]
    for (const [prefix, val] of prefixes) {
      if (pathname.startsWith(prefix)) return val
    }
    return ''
  })()

  const groupedProjects = () => {
    const groups: Record<string, { workspace: any; projects: ProjectWithUserRoleI[] }> = {}
    projects.forEach(project => {
      const key = project.workspace.uid
      if (!groups[key]) groups[key] = { workspace: project.workspace, projects: [] }
      groups[key].projects.push(project)
    })
    Object.values(groups).forEach(g => {
      g.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
    return Object.values(groups).sort((a, b) => a.workspace.name.localeCompare(b.workspace.name))
  }

  const handleProjectSelect = async (project: ProjectWithUserRoleI) => {
    setProjectDropdownOpen(false)
    try {
      const workspaceChange = project.workspace['uid'] !== selectedWorkspce?.uid
      if (workspaceChange) {
        const res = await selectOrg(accessToken, {
          workspaceUid: project.workspace['uid'],
          projectUid: project.uid,
        })
        if (res.statusCode !== 200) { toast.error('Something went wrong'); return }
      }
      selectProject(project)
      const ws = workspace.find(el => el.uid === project.workspace['uid'])
      if (ws) setDefaultWorkspce(ws)
      window.location.reload()
    } catch {
      toast.error('Something went wrong')
    }
  }

  const toggleWorkspace = (uid: string) => {
    const next = new Set(collapsedWorkspaces)
    next.has(uid) ? next.delete(uid) : next.add(uid)
    setCollapsedWorkspaces(next)
  }

  const workspaceGroups = groupedProjects()

  const userName = (() => {
    if (!User) return ''
    const first = (User as any).firstName || ''
    const last = (User as any).lastName || ''
    if (first || last) return `${first} ${last}`.trim()
    return (User as any).name || ''
  })()

  const userInitials = userName
    ? userName.split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className={cn("flex-shrink-0 h-full flex flex-col border-r border-gray-100 bg-white overflow-hidden transition-all duration-200", exp ? "w-[230px]" : "w-14")}>
      {/* Branding */}
      <div className={cn("py-3.5 border-b border-gray-100 flex-shrink-0", exp ? "px-4" : "px-2")}>
        <div className={cn("flex items-center", exp ? "justify-start gap-2.5" : "justify-center")}>
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0">
            <img src="/icon.png" alt="TreeMapper" className="w-full h-full object-cover" />
          </div>
          {exp && (
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">TreeMapper</div>
              <div className="text-xs text-gray-400 leading-tight">by Plant-for-the-Planet</div>
            </div>
          )}
        </div>
      </div>

      {/* Project Selector */}
      <div className={cn("py-2.5 border-b border-gray-100 flex-shrink-0", exp ? "px-3" : "px-1.5")}>
        <div className="relative">
          {/* Collapsed: project initial */}
          {!exp && (
            <div className="w-full flex justify-center p-1.5">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-green-800 leading-none">
                  {selectedProject?.name?.[0]?.toUpperCase() || 'P'}
                </span>
              </div>
            </div>
          )}

          {/* Expanded: full selector */}
          {exp && <button
            onClick={() => setProjectDropdownOpen(v => !v)}
            className="w-full text-left px-2.5 py-2 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {selectedProject?.name || 'Select Project'}
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5 leading-tight">
                  {selectedWorkspce?.name || ''}
                </div>
              </div>
              <ChevronDown
                size={13}
                className={cn('text-gray-400 flex-shrink-0 transition-transform duration-200', projectDropdownOpen && 'rotate-180')}
              />
            </div>
          </button>}

          {projectDropdownOpen && exp && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
              <div className="absolute left-0 right-0 mt-1 z-50 w-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={() => { createNewProject(); setProjectDropdownOpen(false) }}
                    className="w-full justify-center [background-color:#e6f1ec] hover:[background-color:#d4e8dc] text-green-800 h-auto py-1.5 text-xs gap-1 font-medium"
                  >
                    <Plus size={12} />
                    Create New Project
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {workspaceGroups.map(group => (
                    <Collapsible
                      key={group.workspace.uid}
                      open={!collapsedWorkspaces.has(group.workspace.uid)}
                      onOpenChange={() => toggleWorkspace(group.workspace.uid)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between h-auto py-1.5 rounded-none hover:bg-gray-50 font-normal text-left px-3">
                          <span className="text-xs font-medium text-gray-700">{group.workspace.name}</span>
                          <ChevronRight className={cn('w-3 h-3 text-gray-400 transition-transform duration-200', !collapsedWorkspaces.has(group.workspace.uid) && 'rotate-90')} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-3 border-l border-gray-100 pl-2 py-0.5">
                          {group.projects.map(project => (
                            <Button
                              key={project.uid}
                              variant="ghost"
                              onClick={() => handleProjectSelect(project)}
                              className={cn(
                                'w-full justify-start h-auto py-1.5 rounded-sm text-left',
                                project.uid === selectedProject?.uid && '[background-color:#e6f1ec]'
                              )}
                            >
                              <span className={cn(
                                'text-xs truncate',
                                project.uid === selectedProject?.uid ? 'text-green-800 font-medium' : 'text-gray-700'
                              )}>
                                {project.name}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto py-1 scrollbar-hide", exp ? "px-2" : "px-1")}>
        <SectionLabel label="Planning" collapsed={collapsed} />
        <NavItem icon={LayoutDashboard} label="Overview" id="" active={activeRoute === ''} onClick={updateRoute} collapsed={collapsed} />
        <NavItem icon={MapPin} label="Sites" id="sites" active={activeRoute === 'sites'} onClick={updateRoute} collapsed={collapsed} />
        <NavItem icon={Leaf} label="Species" id="species" active={activeRoute === 'species'} onClick={updateRoute} collapsed={collapsed} />
        {!isContributor && (
          <NavItem icon={Users} label="Team" id="team" active={activeRoute === 'team'} onClick={updateRoute} collapsed={collapsed} />
        )}

        <SectionLabel label="Field Data" showSeparator collapsed={collapsed} />
        <NavItem icon={Activity} label="Interventions" id="intervention" active={activeRoute === 'intervention'} onClick={updateRoute} collapsed={collapsed} />
        <NavItem icon={Upload} label="Bulk Upload" id="bulkupload" active={activeRoute === 'bulkupload'} onClick={updateRoute} collapsed={collapsed} />
        {!isContributor && (
          <NavItem icon={CheckSquare} label="Approvals" id="approvals" active={activeRoute === 'approvals'} onClick={updateRoute} collapsed={collapsed} />
        )}
        {!isContributor && (
          <NavItem icon={FileText} label="Forms" id="forms" active={activeRoute === 'forms'} onClick={updateRoute} collapsed={collapsed} />
        )}

        <SectionLabel label="Analyse" showSeparator collapsed={collapsed} />
        <NavItem icon={BarChart2} label="Data Explorer" id="dataexplore" active={activeRoute === 'dataexplore'} onClick={updateRoute} collapsed={collapsed} />
        <NavItem icon={Trophy} label="Leaderboard" id="leaderboard" active={activeRoute === 'leaderboard'} onClick={updateRoute} collapsed={collapsed} />
      </div>

      {/* User Profile */}
      <div className={cn("border-t border-gray-100 py-2.5 flex-shrink-0", exp ? "px-3" : "px-2")}>
        {!exp && (
          <div className="flex justify-center">
            <button
              onClick={openProfileSetting}
              className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-600 transition-colors"
              title={userName}
            >
              <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
            </button>
          </div>
        )}
        {exp && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate leading-tight">{userName}</div>
                <div className="text-[10px] text-gray-400 capitalize truncate leading-tight">{projectRole}</div>
              </div>
            </div>
            <button
              onClick={openProfileSetting}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            >
              <Settings size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
