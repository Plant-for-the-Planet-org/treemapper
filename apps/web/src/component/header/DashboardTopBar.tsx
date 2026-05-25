'use client'

import { PanelLeft, ChevronRight, BarChart2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import useProjectStore from '@shared-core/store/useProjectStore'
import DateRangePicker from './DateRangePicker'
import { Button } from '@/components/ui/button'

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

interface Props {
  onToggle: () => void
}

export default function DashboardTopBar({ onToggle }: Props) {
  const pathname = usePathname()
  const router = useRouter()
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
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>
        {selectedProject && pageLabel && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium text-gray-700 truncate max-w-[200px]">{selectedProject.name}</span>
            <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-500">{pageLabel}</span>
          </div>
        )}
      </div>
      {isOverview && isAdminOrOwner && (
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
      )}
    </div>
  )
}
