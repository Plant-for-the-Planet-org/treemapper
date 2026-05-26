'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, RefreshCw, AlertCircle, MapPin, Calendar } from 'lucide-react'
import { getUserProjectSites } from '@shared-core/fetchApi/api.fetch'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'planting':
      return 'default'
    case 'monitoring':
      return 'secondary'
    default:
      return 'outline'
  }
}

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const SelectProjectSite = ({ onBack, accessToken, handleFinalSelection }) => {
  const activeProject = useProjectStore((state) => state.selectedProject)
  const [sites, setSites] = useState([])
  const [selectedProject] = useState<any>(activeProject || null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [loadingSites, setLoadingSites] = useState(false)
  const [sitesError, setSitesError] = useState('')

  const fetchSites = async (projectId: string) => {
    try {
      setLoadingSites(true)
      setSitesError('')
      const response = await getUserProjectSites(accessToken || '', projectId)
      if (response && response.statusCode === 200) {
        setSites(response.data)
      } else {
        throw ''
      }
    } catch {
      setSitesError('Failed to load sites. Please try again.')
    } finally {
      setLoadingSites(false)
    }
  }

  useEffect(() => {
    if (selectedProject) fetchSites(selectedProject.uid)
  }, [selectedProject])

  const CardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
  )

  return (
    <div className="w-full relative">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Select project and site</h2>
        {selectedProject && (
          <Button
            onClick={() =>
              handleFinalSelection(
                {
                  projectName: selectedProject.projectName,
                  siteName: selectedSite ? selectedSite.name : 'No site selected',
                  projectId: selectedProject.uid,
                  siteId: selectedSite ? selectedSite.uid : null,
                },
                1,
              )
            }
          >
            Continue
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        )}
      </div>

      {/* Active project banner */}
      {activeProject && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle size={16} className="text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Uploading to project</p>
              <p className="text-sm font-semibold text-foreground truncate">{activeProject.name}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            To upload to a different project, switch projects in the sidebar.
          </p>
        </div>
      )}

      {/* Sites */}
      {selectedProject && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Choose a site <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </h3>
            {sitesError && (
              <Button variant="ghost" size="sm" onClick={() => fetchSites(selectedProject.uid)}>
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>

          {loadingSites ? (
            <CardSkeleton />
          ) : sitesError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <AlertCircle size={24} className="text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-3">{sitesError}</p>
              <Button variant="destructive" size="sm" onClick={() => fetchSites(selectedProject.uid)}>
                Try again
              </Button>
            </div>
          ) : sites.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
              <MapPin size={24} className="text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-700 dark:text-amber-300">No sites found for this project</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400 mt-1">You can proceed without selecting a site</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sites.map((site) => {
                const isSelected = selectedSite?.uid === site.uid
                return (
                  <Card
                    key={site.uid}
                    onClick={() => setSelectedSite(site)}
                    className={cn(
                      'cursor-pointer transition-all gap-0 py-0',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-border/80',
                    )}
                  >
                    <div className="p-4 flex flex-col gap-2.5 h-full">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{site.name}</h4>
                        {isSelected && <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />}
                      </div>

                      <Badge variant={statusVariant(site.status)} className="self-start capitalize">
                        {site.status}
                      </Badge>

                      {site.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{site.description}</p>
                      )}

                      <div className="flex items-center gap-1 pt-2 border-t border-border text-xs text-muted-foreground">
                        <Calendar size={12} />
                        Created {formatDate(site.createdAt)}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SelectProjectSite
