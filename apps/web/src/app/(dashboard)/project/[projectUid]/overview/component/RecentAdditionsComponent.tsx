import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Trees, Search, MapPin, Leaf, UserRound, Activity } from 'lucide-react'
import { useToken } from '@/context/useTokenContext'
import useProject from '@shared-core/store/useProjectStore'
import { getDashboardRecentAddition } from '@shared-core/fetchApi/api.fetch'
import usePolling from '@/hooks/usePolling'

const activityMeta: Record<string, { Icon: React.ElementType; bg: string; color: string }> = {
  intervention: { Icon: Trees,      bg: 'bg-[#e6f1ec]',    color: '#007A49' },
  site:         { Icon: MapPin,     bg: 'bg-blue-50',      color: '#3b82f6' },
  species:      { Icon: Leaf,       bg: 'bg-emerald-50',   color: '#10b981' },
  member:       { Icon: UserRound,  bg: 'bg-purple-50',    color: '#8b5cf6' },
}

const ActivityIcon = ({ activity }: { activity: any }) => {
  const { activityType, user } = activity
  if (activityType === 'member' && user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name || 'member'}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  const meta = activityMeta[activityType] ?? { Icon: Activity, bg: 'bg-gray-100', color: '#9ca3af' }
  const { Icon, bg, color } = meta
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon size={13} color={color} />
    </div>
  )
}

const getActivityValue = (activity: any): string => {
  switch (activity.activityType) {
    case 'intervention':
      return activity.details?.treeCount ? `${activity.details.treeCount.toLocaleString()} trees` : ''
    case 'site':
      return activity.details?.areaInHa ? `${activity.details.areaInHa} ha` : ''
    case 'species':
      return activity.details?.speciesName || ''
    default:
      return ''
  }
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds} sec ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

interface RecentAdditionsProps {
  onTotalChange?: (total: number) => void
}

const RecentAdditionsComponent = ({ onTotalChange }: RecentAdditionsProps) => {
  const [activities, setActivities] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { accessToken } = useToken()
  const selectedProject = useProject(state => state.selectedProject)

  // `silent` skips the spinner + error swap so background polls refresh the
  // list in place. A failed poll keeps the current data on screen.
  const fetchActivities = async (page = 1, limit = 10, silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const response = await getDashboardRecentAddition(accessToken || '', selectedProject?.uid || '', page, limit)
      if (response && response.statusCode !== 200) throw new Error('Failed to fetch activities')
      if (response.data) {
        setActivities(response.data.activities)
        const total = response.data.pagination.total
        setPagination({
          page: parseInt(response.data.pagination.page),
          limit: parseInt(response.data.pagination.limit),
          total,
          hasMore: response.data.pagination.hasMore,
        })
        onTotalChange?.(total)
      } else {
        throw new Error(response.message || 'Failed to fetch activities')
      }
    } catch (err: any) {
      if (!silent) setError(err.message)
      else console.warn('Silent recent-activity refresh failed:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProject?.uid) fetchActivities()
  }, [selectedProject])

  // Auto-refresh the current page every 30s so new field activity appears
  // without a manual refresh. Silent: no spinner, page + search preserved.
  usePolling(
    () => fetchActivities(pagination.page, pagination.limit, true),
    30_000,
    !!selectedProject?.uid,
  )

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit)
    if (newPage >= 1 && newPage <= totalPages) fetchActivities(newPage, pagination.limit)
  }

  const filteredActivities = activities.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.description?.toLowerCase().includes(q) ||
      a.user?.name?.toLowerCase().includes(q) ||
      a.activityType?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-xs font-medium text-gray-800 mb-1">Error loading activities</p>
            <p className="text-[10px] text-gray-500 mb-3">{error}</p>
            <button
              onClick={() => fetchActivities()}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search */}
      <div className="px-3 pt-2 pb-1.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50">
          <Search size={11} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search interventions, sites..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 text-[11px] bg-transparent outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
          />
          {pagination.total > 0 && (
            <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">{pagination.total}</span>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <Trees className="w-7 h-7 mx-auto mb-2 text-gray-200" />
              <p className="text-xs font-medium text-gray-500">
                {searchQuery ? 'No results found' : 'No activities yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {filteredActivities.map(activity => (
              <div
                key={activity.id}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ActivityIcon activity={activity} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-900 truncate leading-none">
                      {activity.description || activity.activityType}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                      {formatTimeAgo(activity.timeOfActivity)} · by {activity.user?.name}
                    </div>
                  </div>
                </div>
                {getActivityValue(activity) && (
                  <div className="text-[10px] font-medium text-gray-500 flex-shrink-0 ml-2 text-right">
                    {getActivityValue(activity)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0 flex items-center justify-between bg-white">
          <span className="text-[10px] text-gray-500">
            {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-0.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={11} />
            </button>
            <span className="text-[10px] text-gray-600 px-1">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore || loading}
              className="p-0.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentAdditionsComponent
