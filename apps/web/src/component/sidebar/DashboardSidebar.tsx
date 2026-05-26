'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, MapPin, Leaf, Users, Activity, Upload,
  CheckSquare, FileText, BarChart2, Trophy, Settings,
  ChevronDown, ChevronRight, Plus
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
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar,
} from '@/components/ui/sidebar'

interface SidebarProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (route: string) => void
}

export default function DashboardSidebar({ createNewProject, openProfileSetting, updateRoute }: SidebarProps) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set())
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
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

  const navGroups = [
    {
      label: 'Planning',
      items: [
        { icon: LayoutDashboard, label: 'Overview', id: '' },
        { icon: MapPin, label: 'Sites', id: 'sites' },
        { icon: Leaf, label: 'Species', id: 'species' },
        ...(!isContributor ? [{ icon: Users, label: 'Team', id: 'team' }] : []),
      ],
    },
    {
      label: 'Field Data',
      items: [
        { icon: Activity, label: 'Interventions', id: 'intervention' },
        { icon: Upload, label: 'Bulk Upload', id: 'bulkupload' },
        ...(!isContributor ? [{ icon: CheckSquare, label: 'Approvals', id: 'approvals' }] : []),
        ...(!isContributor ? [{ icon: FileText, label: 'Forms', id: 'forms' }] : []),
      ],
    },
    {
      label: 'Analyse',
      items: [
        { icon: BarChart2, label: 'Data Explorer', id: 'dataexplore' },
        { icon: Trophy, label: 'Leaderboard', id: 'leaderboard' },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon">
      {/* Branding */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn('flex items-center py-1', collapsed ? 'justify-center' : 'gap-2.5')}>
          <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0">
            <img src="/icon.png" alt="TreeMapper" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-sidebar-foreground leading-tight">TreeMapper</div>
              <div className="text-xs text-sidebar-foreground/50 leading-tight">by Plant-for-the-Planet</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Project Selector */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="relative">
          {collapsed ? (
            <div className="flex justify-center py-1">
              <div className="px-1.5 h-6 rounded bg-green-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-green-800 leading-none tracking-wider">
                  {selectedProject?.name?.slice(0, 3).toUpperCase() || 'PRJ'}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setProjectDropdownOpen(v => !v)}
              className="w-full text-left px-2.5 py-2 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border transition-colors"
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                    {selectedProject?.name || 'Select Project'}
                  </div>
                  <div className="text-xs text-sidebar-foreground/50 truncate mt-0.5 leading-tight">
                    {selectedWorkspce?.name || ''}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={cn('text-sidebar-foreground/40 flex-shrink-0 transition-transform duration-200', projectDropdownOpen && 'rotate-180')}
                />
              </div>
            </button>
          )}

          {projectDropdownOpen && !collapsed && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProjectDropdownOpen(false)} />
              <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <Button
                    variant="ghost"
                    onClick={() => { createNewProject(); setProjectDropdownOpen(false) }}
                    className="w-full justify-center [background-color:#e6f1ec] hover:[background-color:#d4e8dc] text-green-800 h-auto py-1.5 text-xs gap-1 font-medium"
                  >
                    <Plus size={14} />
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
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => updateRoute(item.id)}
                    isActive={activeRoute === item.id}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User Profile */}
      <SidebarFooter className="border-t border-sidebar-border">
        {collapsed ? (
          <div className="flex justify-center">
            <button
              onClick={openProfileSetting}
              className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-600 transition-colors"
              title={userName}
            >
              <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground truncate leading-tight">{userName}</div>
                <div className="text-[10px] text-sidebar-foreground/50 capitalize truncate leading-tight">{projectRole}</div>
              </div>
            </div>
            <button
              onClick={openProfileSetting}
              className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground flex-shrink-0 transition-colors"
            >
              <Settings size={14} />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
