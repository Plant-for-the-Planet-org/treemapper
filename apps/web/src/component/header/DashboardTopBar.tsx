'use client'

import { ChevronRight, BarChart2, MoreVertical, CalendarIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import useProjectStore from '@shared-core/store/useProjectStore'
import DateRangePicker from './DateRangePicker'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/overview': 'Overview',
  '/dashboard/sites': 'Sites',
  '/dashboard/species': 'Species',
  '/dashboard/team': 'Team',
  '/dashboard/intervention': 'Interventions',
  '/dashboard/bulkupload': 'Bulk Upload',
  '/dashboard/approvals': 'Approvals',
  '/dashboard/forms': 'Forms',
  '/dashboard/dataexplore': 'Data Explorer',
  '/dashboard/leaderboard': 'Leaderboard',
  '/dashboard/settings': 'Settings',
}

export default function DashboardTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const projectRole = useProjectStore(state => state.selectedProject?.userRole)
  const isAdminOrOwner = projectRole === 'admin' || projectRole === 'owner'
  const isOverview = pathname === '/dashboard/overview' || pathname === '/dashboard'

  const pageLabel = (() => {
    // exact match first
    if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
    for (const [prefix, label] of Object.entries(ROUTE_LABELS)) {
      if (pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')) {
        return label
      }
    }
    return null
  })()

  return (
    <div className="h-11 flex items-center justify-between px-3 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        {selectedProject && pageLabel && (
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="hidden sm:inline font-medium text-gray-700 truncate max-w-[150px] md:max-w-[200px]">{selectedProject.name}</span>
            <ChevronRight size={13} className="hidden sm:inline text-gray-300 flex-shrink-0" />
            <span className="text-gray-700 sm:text-gray-500 font-medium sm:font-normal truncate">{pageLabel}</span>
          </div>
        )}
      </div>
      {isOverview && isAdminOrOwner && (
        isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <CalendarIcon size={14} />
                <span>All Time</span>
                <span className="ml-auto text-[10px] text-gray-400">Soon</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/dataexplore')}>
                <BarChart2 size={14} />
                Data Explorer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/dataexplore')}
              className="h-8 gap-1.5 text-xs font-normal text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <BarChart2 size={13} />
              Data Explorer
            </Button>
          </div>
        )
      )}
    </div>
  )
}
