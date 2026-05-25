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
}

const NavItem = ({
  icon: Icon,
  label,
  id,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  id: string
  active: boolean
  onClick: (id: string) => void
}) => (
  <button
    onClick={() => onClick(id)}
    title={label}
    className={cn(
      'w-full flex items-center py-2 lg:py-1.5 transition-colors',
      'justify-center lg:justify-start px-0 lg:px-2.5 lg:gap-2.5',
      active
        ? 'text-green-800 font-medium rounded-xl [background-color:#e6f1ec]'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-md'
    )}
  >
    <Icon size={15} className={cn('flex-shrink-0', active ? 'text-green-700' : 'text-gray-400')} />
    <span className="hidden lg:inline text-sm">{label}</span>
  </button>
)

const SectionLabel = ({ label, showSeparator = false }: { label: string; showSeparator?: boolean }) => (
  <>
    {showSeparator && <div className="lg:hidden h-px bg-gray-100 mx-1 my-1.5" />}
    <p className="hidden lg:block px-2.5 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none">
      {label}
    </p>
  </>
)

export default function DashboardSidebar({ createNewProject, openProfileSetting, updateRoute }: SidebarProps) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set())
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
    <div className="w-14 lg:w-[230px] flex-shrink-0 h-full flex flex-col border-r border-gray-100 bg-white overflow-hidden">
      {/* Branding */}
      <div className="px-2 lg:px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-center lg:justify-start lg:gap-2.5">
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0">
            <img src="/icon.png" alt="TreeMapper" className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-gray-900 leading-tight">TreeMapper</div>
            <div className="text-[10px] text-gray-400 leading-tight">Restoration Console</div>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-1.5 lg:px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          {/* Tablet: compact initial button */}
          <button
            onClick={() => setProjectDropdownOpen(v => !v)}
            className="lg:hidden w-full flex justify-center p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
            title={selectedProject?.name || 'Select Project'}
          >
            <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-green-800 leading-none">
                {selectedProject?.name?.[0]?.toUpperCase() || 'P'}
              </span>
            </div>
          </button>

          {/* Desktop: full selector */}
          <button
            onClick={() => setProjectDropdownOpen(v => !v)}
            className="hidden lg:block w-full text-left px-2.5 py-2 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 truncate leading-tight">
                  {selectedProject?.name || 'Select Project'}
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5 leading-tight">
                  {selectedWorkspce?.name || ''}
                </div>
              </div>
              <ChevronDown
                size={13}
                className={cn('text-gray-400 flex-shrink-0 transition-transform duration-200', projectDropdownOpen && 'rotate-180')}
              />
            </div>
          </button>

          {projectDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
              {/* Tablet: anchors to the right of sidebar; Desktop: drops below button */}
              <div className="absolute left-full ml-2 top-0 lg:top-auto lg:left-0 lg:right-0 lg:ml-0 lg:mt-1 z-50 w-56 lg:w-auto bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
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
      <div className="flex-1 overflow-y-auto px-1 lg:px-2 py-1 scrollbar-hide">
        <SectionLabel label="Planning" />
        <NavItem icon={LayoutDashboard} label="Overview" id="" active={activeRoute === ''} onClick={updateRoute} />
        <NavItem icon={MapPin} label="Sites" id="sites" active={activeRoute === 'sites'} onClick={updateRoute} />
        <NavItem icon={Leaf} label="Species" id="species" active={activeRoute === 'species'} onClick={updateRoute} />
        {!isContributor && (
          <NavItem icon={Users} label="Team" id="team" active={activeRoute === 'team'} onClick={updateRoute} />
        )}

        <SectionLabel label="Field Data" showSeparator />
        <NavItem icon={Activity} label="Interventions" id="intervention" active={activeRoute === 'intervention'} onClick={updateRoute} />
        <NavItem icon={Upload} label="Bulk Upload" id="bulkupload" active={activeRoute === 'bulkupload'} onClick={updateRoute} />
        {!isContributor && (
          <NavItem icon={CheckSquare} label="Approvals" id="approvals" active={activeRoute === 'approvals'} onClick={updateRoute} />
        )}
        {!isContributor && (
          <NavItem icon={FileText} label="Forms" id="forms" active={activeRoute === 'forms'} onClick={updateRoute} />
        )}

        <SectionLabel label="Analyse" showSeparator />
        <NavItem icon={BarChart2} label="Data Explorer" id="dataexplore" active={activeRoute === 'dataexplore'} onClick={updateRoute} />
        <NavItem icon={Trophy} label="Leaderboard" id="leaderboard" active={activeRoute === 'leaderboard'} onClick={updateRoute} />
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-100 px-2 lg:px-3 py-2.5 flex-shrink-0">
        {/* Tablet: avatar only */}
        <div className="flex lg:hidden justify-center">
          <button
            onClick={openProfileSetting}
            className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-600 transition-colors"
            title={userName}
          >
            <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
          </button>
        </div>
        {/* Desktop: full row */}
        <div className="hidden lg:flex items-center justify-between gap-2">
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
      </div>
    </div>
  )
}
