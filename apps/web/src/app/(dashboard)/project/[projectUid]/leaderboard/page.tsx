'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Trophy, Medal, Award, Users, Calendar, ChevronDown, Crown, Loader2, TreeDeciduous, AlertCircle } from 'lucide-react'
import { getProjectAnalytics } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const timeFilters = [
  { id: 'all-time', label: 'All time' },
  { id: 'this-year', label: 'This year' },
  { id: 'this-month', label: 'This month' },
]

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown size={16} className="text-amber-500" />
    case 2:
      return <Medal size={16} className="text-muted-foreground" />
    case 3:
      return <Award size={16} className="text-amber-700" />
    default:
      return <span className="text-sm font-semibold text-muted-foreground">#{position}</span>
  }
}

const LeaderboardSkeleton = () => (
  <div className="divide-y divide-border">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    ))}
  </div>
)

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-6">
    <TreeDeciduous size={32} className="text-muted-foreground/60 mb-3" />
    <h3 className="text-sm font-semibold text-foreground mb-1">No champions yet</h3>
    <p className="text-sm text-muted-foreground text-center max-w-sm">
      Start planting trees and interventions to appear on the leaderboard.
    </p>
  </div>
)

export default function ForestLeaderboard() {
  const [selectedFilter, setSelectedFilter] = useState('all-time')
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const selectedProject = useProjectStore(state => state.selectedProject)
  const { accessToken } = useToken()

  const fetchLeaderboard = useCallback(async (page = 1, _timeFilter = 'all-time', append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
        setLeaderboardData([])
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const response = await getProjectAnalytics(accessToken || '', selectedProject?.uid)
      const data = response.data

      if (append && page > 1) {
        setLeaderboardData(prev => [...prev, ...data.items])
      } else {
        setLeaderboardData(data.items)
      }

      setTotalCount(data.totalCount)
      setHasMore(data.currentPage < data.totalPages)
      setCurrentPage(data.currentPage)
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedProject, accessToken])

  useEffect(() => {
    if (selectedProject) fetchLeaderboard(1, selectedFilter, false)
  }, [selectedProject, selectedFilter, fetchLeaderboard])

  const loadMore = () => {
    if (hasMore && !loadingMore) fetchLeaderboard(currentPage + 1, selectedFilter, true)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, currentPage])

  return (
    <div className="w-full mx-auto p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Forest champions</h1>
        </div>
        <p className="text-sm text-muted-foreground">Leading contributors for the project.</p>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Showing {leaderboardData.length} of {totalCount.toLocaleString()} champions
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex gap-1 p-1 bg-muted/40 border border-border rounded-lg w-fit">
        {timeFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setSelectedFilter(filter.id); setCurrentPage(1); setHasMore(true) }}
            disabled={loading}
          >
            <Calendar size={14} className="mr-1.5" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle />
          <AlertTitle>Error loading leaderboard</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchLeaderboard(1, selectedFilter, false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Leaderboard */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Rankings</h2>
        </div>

        {loading && <LeaderboardSkeleton />}
        {!loading && leaderboardData.length === 0 && !error && <EmptyState />}

        {!loading && leaderboardData.length > 0 && (
          <div className="divide-y divide-border">
            {leaderboardData.map((user, index) => {
              const position = index + 1 + (currentPage - 1) * 20
              const isOpen = !!openRows[user.uid]
              return (
                <Collapsible
                  key={user.uid}
                  open={isOpen}
                  onOpenChange={(open) => setOpenRows(prev => ({ ...prev, [user.uid]: open }))}
                >
                  <div className="p-5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-8 flex justify-center">
                          {getRankIcon(position)}
                        </div>

                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.displayName}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Users size={14} className="text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{user.displayName}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Member since {user.joinDate
                              ? new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">{user.totalTrees.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">trees</p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <div className="mt-3 ml-11 grid grid-cols-3 gap-4 p-3 bg-muted/40 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Trees planted</p>
                          <p className="text-sm font-semibold text-foreground">{user.totalTrees.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Interventions</p>
                          <p className="text-sm font-semibold text-foreground">{user.totalInterventions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Species count</p>
                          <p className="text-sm font-semibold text-foreground">{user.totalSpecies.toLocaleString()}</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}

            {loadingMore && (
              <div className="p-5 flex justify-center items-center gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Loading more champions...</span>
              </div>
            )}

            {!hasMore && leaderboardData.length > 0 && (
              <div className="p-5 text-center">
                <p className="text-xs text-muted-foreground">
                  All {totalCount.toLocaleString()} champions shown.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
