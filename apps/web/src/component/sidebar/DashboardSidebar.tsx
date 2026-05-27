'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, MapPin, Leaf, Users, Activity, Upload,
  CheckSquare, FileText, BarChart2, Trophy, Settings, Building,
  ChevronDown, ChevronRight, Plus, Sun, Moon, Monitor,
  UserCog, SlidersHorizontal, UserCheck, LogOut
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useUserStore } from '@shared-core/store/useUserStore'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import { selectOrg, exitImpersonationWork } from '@shared-core/fetchApi/api.fetch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import NotificationBell from '@/component/header/NotificationIcon'
import ImpersonateDialog from '@/component/header/ImpersonateDialog'
import { toast } from 'react-toastify'
import { ProjectWithUserRoleI } from '@shared-core/types/interface.app'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar,
} from '@/components/ui/sidebar'
import { subpageFromPath } from '@/lib/projectRoutes'

interface SidebarProps {
  createNewProject: () => void
  openProfileSetting: () => void
  updateRoute: (route: string) => void
}

export default function DashboardSidebar({ createNewProject, openProfileSetting, updateRoute }: SidebarProps) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set())
  const [impersonateOpen, setImpersonateOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const themeOrder = ['light', 'dark', 'system'] as const
  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme as typeof themeOrder[number])
    setTheme(themeOrder[(idx + 1) % themeOrder.length])
  }
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto'
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar()
  const collapsed = !isMobile && state === 'collapsed'

  const [isTablet, setIsTablet] = useState(false)
  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNavClick = (id: string) => {
    updateRoute(id)
    if (isMobile) setOpenMobile(false)
    else if (isTablet) setOpen(false)
  }
  const pathname = usePathname()
  const { accessToken } = useToken()
  const User = useUserStore(state => state.user)
  const {
    projects, selectProject, selectedProject,
    selectedWorkspce, setDefaultWorkspce, workspace,
  } = useProjectStore(state => state)

  const projectRole = selectedProject?.userRole
  const isContributor = projectRole === 'contributor'
  const isAdminOrOwner = projectRole === 'admin' || projectRole === 'owner'
  const workspaceRole = (selectedWorkspce as { userRole?: string } | null)?.userRole
  const isWorkspaceManager = !!workspaceRole && workspaceRole !== 'member'

  const activeRoute = (() => {
    const subpage = subpageFromPath(pathname)
    // The overview item uses '' as its id.
    if (!subpage || subpage === 'overview') return ''
    return subpage
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

  const canImpersonate = User?.type === 'superadmin'
  const isImpersonating = !!(User as { impersonated?: boolean } | null)?.impersonated

  const handleExitImpersonation = async () => {
    try {
      const resp = await exitImpersonationWork(accessToken || '')
      if (resp.statusCode !== 200 && resp.statusCode !== 201) throw new Error()
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast.error('Could not exit impersonation. Please try again.')
    }
  }

  const settingsMenu = (
    <DropdownMenuContent align="end" side="top" className="w-48">
      <DropdownMenuItem onClick={openProfileSetting}>
        <UserCog size={14} className="mr-2" />
        Edit profile
      </DropdownMenuItem>
      {canImpersonate && (
        <DropdownMenuItem onClick={() => updateRoute('workspace')}>
          <UserCheck size={14} className="mr-2" />
          Impersonate user
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {isImpersonating && (
        <DropdownMenuItem
          onClick={handleExitImpersonation}
          className="text-orange-600 focus:text-orange-600"
        >
          <UserCheck size={14} className="mr-2" />
          Exit impersonation
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        onClick={() => { window.location.href = '/api/auth/logout' }}
        className="text-destructive focus:text-destructive"
      >
        <LogOut size={14} className="mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

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
        ...(isAdminOrOwner ? [{ icon: BarChart2, label: 'Data Explorer', id: 'dataexplore' }] : []),
        { icon: Trophy, label: 'Leaderboard', id: 'leaderboard' },
      ],
    },
    ...((isAdminOrOwner || isWorkspaceManager || canImpersonate)
      ? [{
        label: 'Admin',
        items: [
          ...(isAdminOrOwner ? [{ icon: SlidersHorizontal, label: 'Project settings', id: 'settings' }] : []),
          ...(isWorkspaceManager ? [{ icon: Building, label: 'Workspace', id: 'workspace' }] : []),
          ...((canImpersonate || isWorkspaceManager) ? [{ icon: UserCheck, label: 'Impersonate', id: 'impersonate' }] : []),
        ],
      }]
      : []),
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
              <div className="absolute left-0 right-0 mt-1 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-border">
                  <Button
                    variant="ghost"
                    onClick={() => { createNewProject(); setProjectDropdownOpen(false) }}
                    className="w-full justify-center bg-[#e6f1ec] hover:bg-[#d4e8dc] dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 h-auto py-1.5 text-xs gap-1 font-medium"
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
                        <Button variant="ghost" className="w-full justify-between h-auto py-1.5 rounded-none hover:bg-accent font-normal text-left px-3">
                          <span className="text-xs font-medium text-foreground">{group.workspace.name}</span>
                          <ChevronRight className={cn('w-3 h-3 text-muted-foreground transition-transform duration-200', !collapsedWorkspaces.has(group.workspace.uid) && 'rotate-90')} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-3 border-l border-border pl-2 py-0.5">
                          {group.projects.map(project => (
                            <Button
                              key={project.uid}
                              variant="ghost"
                              onClick={() => handleProjectSelect(project)}
                              className={cn(
                                'w-full justify-start h-auto py-1.5 rounded-sm text-left hover:bg-accent',
                                project.uid === selectedProject?.uid && 'bg-[#e6f1ec] dark:bg-green-900/30'
                              )}
                            >
                              <span className={cn(
                                'text-xs truncate',
                                project.uid === selectedProject?.uid
                                  ? 'text-green-800 dark:text-green-300 font-medium'
                                  : 'text-foreground'
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
                    onClick={() => item.id === 'impersonate' ? setImpersonateOpen(true) : handleNavClick(item.id)}
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
          <div className="flex flex-col items-center gap-1">
            <NotificationBell variant="sidebar" />
            <button
              onClick={cycleTheme}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              title={`Theme: ${themeLabel}`}
            >
              <ThemeIcon size={14} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-600 transition-colors"
                  title={userName}
                >
                  <span className="text-[10px] font-bold text-white leading-none">{userInitials}</span>
                </button>
              </DropdownMenuTrigger>
              {settingsMenu}
            </DropdownMenu>
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
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <NotificationBell variant="sidebar" />
              <button
                onClick={cycleTheme}
                className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                title={`Theme: ${themeLabel}`}
              >
                <ThemeIcon size={14} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
                    <Settings size={14} />
                  </button>
                </DropdownMenuTrigger>
                {settingsMenu}
              </DropdownMenu>
            </div>
          </div>
        )}
      </SidebarFooter>

      <ImpersonateDialog open={impersonateOpen} onOpenChange={setImpersonateOpen} />
    </Sidebar>
  )
}
