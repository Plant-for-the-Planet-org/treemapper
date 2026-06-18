'use client'

import { useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatCardsContainer from './StatCardsContainer'
import RecentAdditionsComponent from './RecentAdditionsComponent'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useToken } from '@/context/useTokenContext'
import ProjectMap from './GlobalMap'

const Overview = () => {
    const [panelOpen, setPanelOpen] = useState(false)
    const [activityCount, setActivityCount] = useState(0)
    const selectedProjectUid = useProjectStore(state => state.selectedProject?.uid)
    const selectedProject = useProjectStore(state => state.selectedProject)
    const projectRole = useProjectStore(state => state.selectedProject?.userRole)
    const router = useRouter()
    const { accessToken } = useToken()

    const isAdminOrOwner = projectRole === 'admin' || projectRole === 'owner'

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Stats — visible to all project members */}
            <div className="flex-shrink-0">
                <StatCardsContainer setTotalTrees={() => {}} />
            </div>

            {/* Map + (admin/owner-only) live-activity panel — side by side.
                Horizontal padding matches the stat cards (px-4). The gap is only
                applied when the live-activity panel is open, so when it's closed
                the map wrapper spans the full row and the left/right columns
                (calc(25% - 9px)) line up exactly with the stat-card grid. */}
            <div className={cn('flex-1 flex overflow-hidden px-4 pb-4 pt-1', panelOpen && 'gap-3')}>
                {/* Map */}
                <div className="flex-1 overflow-hidden">
                    {selectedProjectUid ? (
                        <ProjectMap
                            projectId={selectedProjectUid}
                            token={accessToken}
                            mapTopRight={isAdminOrOwner && !panelOpen ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPanelOpen(true)}
                                    className="rounded-full bg-background/95 shadow-md"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Live activity
                                    <ChevronLeft size={12} className="text-muted-foreground" />
                                </Button>
                            ) : undefined}
                        />
                    ) : null}
                </div>

                {/* Recent interventions / live-activity — admin & owner only */}
                {isAdminOrOwner && (
                    <div
                        className={cn(
                            'flex-shrink-0 transition-[width] duration-300 overflow-hidden',
                            panelOpen ? 'w-[220px] lg:w-[280px]' : 'w-0'
                        )}
                    >
                        <div className="w-[220px] lg:w-[280px] h-full flex flex-col rounded-2xl bg-card text-card-foreground border border-border">
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-xs font-semibold text-foreground">Recent interventions</span>
                                    {activityCount > 0 && (
                                        <Badge variant="secondary">{activityCount}</Badge>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setPanelOpen(false)}
                                    className="text-muted-foreground"
                                >
                                    <X size={13} />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-hidden">
                                <RecentAdditionsComponent onTotalChange={setActivityCount} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Overview
