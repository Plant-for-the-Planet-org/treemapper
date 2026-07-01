'use client'

import { ChevronRight, BarChart2, MoreVertical, Plus, Upload } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import useProjectStore from '@shared-core/store/useProjectStore'
import InterventionDateRangePicker from './InterventionDateRangePicker'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import { useRegisteredTopBarActions } from './TopBarActions'
import { cn } from '@/lib/utils'
import { subpageFromPath, projectHref } from '@/lib/projectRoutes'

const ROUTE_LABELS: Record<string, string> = {
  overview: 'Overview',
  sites: 'Sites',
  species: 'Species',
  team: 'Team',
  intervention: 'Interventions',
  bulkupload: 'Bulk Upload',
  approvals: 'Approvals',
  forms: 'Forms',
  dataexplore: 'Data Explorer',
  leaderboard: 'Leaderboard',
  settings: 'Settings',
  treematch: 'TreeMatch',
}

export default function DashboardTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const projectRole = useProjectStore(state => state.selectedProject?.userRole)
  const isAdminOrOwner = projectRole === 'admin' || projectRole === 'owner'
  const subpage = subpageFromPath(pathname)
  const isOverview = !subpage || subpage === 'overview'
  const isSites = subpage === 'sites'
  const isIntervention = subpage === 'intervention'
  const canBulkUpload = projectRole !== 'contributor'
  const registeredActions = useRegisteredTopBarActions()

  const goNewIntervention = () => router.push(selectedProject ? `/project/${selectedProject.uid}/new-intervention` : '/')
  const goBulkUpload = () => router.push(selectedProject ? `/project/${selectedProject.uid}/bulkupload` : '/')

  const dataExplorePath = selectedProject
    ? projectHref(selectedProject.uid, 'dataexplore')
    : '/dashboard/dataexplore'

  const pageLabel = isOverview ? 'Overview' : (subpage ? ROUTE_LABELS[subpage] ?? null : null)

  return (
    <div className="h-11 flex items-center justify-between px-3 border-b border-border/50 flex-shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {selectedProject && pageLabel && (
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="hidden sm:inline font-medium text-foreground/80 truncate max-w-[150px] md:max-w-[200px]">{selectedProject.name}</span>
            <ChevronRight size={14} className="hidden sm:inline text-muted-foreground/40 flex-shrink-0" />
            <span className="text-foreground/80 sm:text-muted-foreground font-medium sm:font-normal truncate">{pageLabel}</span>
          </div>
        )}
      </div>
      {isSites && isAdminOrOwner && (
        <Button
          size="sm"
          onClick={() => router.push(selectedProject ? `/project/${selectedProject.uid}/newsite` : '/')}
          className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Site</span>
        </Button>
      )}
      {isIntervention && (
        isMobile ? (
          <div className="flex items-center gap-2">
            <InterventionDateRangePicker />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canBulkUpload && (
                  <DropdownMenuItem onClick={goBulkUpload}>
                    <Upload size={14} />
                    Bulk Upload
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={goNewIntervention}>
                  <Plus size={14} />
                  New Intervention
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <InterventionDateRangePicker />
            {canBulkUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={goBulkUpload}
                className="h-8 gap-1.5 text-xs font-normal"
              >
                <Upload size={14} />
                Bulk Upload
              </Button>
            )}
            <Button
              size="sm"
              onClick={goNewIntervention}
              className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90"
            >
              <Plus size={14} />
              New Intervention
            </Button>
          </div>
        )
      )}
      {registeredActions.length > 0 && (
        isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {registeredActions.map((a, i) => {
                const Icon = a.icon
                return (
                  <DropdownMenuItem key={i} onClick={a.onClick}>
                    {Icon && <Icon size={14} />}
                    {a.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            {registeredActions.map((a, i) => {
              const Icon = a.icon
              const isPrimary = a.variant === 'primary' || (!a.variant && i === registeredActions.length - 1)
              return (
                <Button
                  key={i}
                  size="sm"
                  variant={isPrimary ? undefined : (a.variant === 'ghost' ? 'ghost' : 'outline')}
                  onClick={a.onClick}
                  className={cn(
                    'h-8 gap-1.5 text-xs',
                    isPrimary && 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {Icon && <Icon size={14} />}
                  <span className={a.hideLabelOnMobile ? 'hidden sm:inline' : ''}>{a.label}</span>
                </Button>
              )
            })}
          </div>
        )
      )}
      {isOverview && isAdminOrOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(dataExplorePath)}
          className="h-8 gap-1.5 text-xs font-normal text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <BarChart2 size={14} />
          <span className="hidden sm:inline">Data Explorer</span>
        </Button>
      )}
    </div>
  )
}
