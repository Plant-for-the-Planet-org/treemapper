'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, BarChart2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-semibold text-gray-900">{selectedProject?.name || 'Project'}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="text-gray-500">Overview</span>
                </div>
                {isAdminOrOwner && (
                    <button
                        onClick={() => router.push('/dashboard/dataexplore')}
                        className="flex items-center gap-1.5 bg-[#007A49] hover:bg-[#006040] text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    >
                        <BarChart2 size={13} />
                        Data Explorer
                    </button>
                )}
            </div>

            {isAdminOrOwner ? (
                <>
                    {/* Stats */}
                    <div className="flex-shrink-0">
                        <StatCardsContainer setTotalTrees={() => {}} />
                    </div>

                    {/* Map + panel — side by side */}
                    <div className="flex-1 flex overflow-hidden p-3 gap-3">
                        {/* Map */}
                        <div className="flex-1 relative overflow-hidden" style={{ clipPath: 'inset(0 round 12px)' }}>
                            {selectedProjectUid
                                ? <ProjectMap projectId={selectedProjectUid} token={accessToken} />
                                : null
                            }
                            {!panelOpen && (
                                <button
                                    onClick={() => setPanelOpen(true)}
                                    className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 border border-gray-200 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#007A49] animate-pulse" />
                                    Live activity
                                    <ChevronLeft size={12} className="text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Recent interventions panel */}
                        <div
                            className={cn(
                                'flex-shrink-0 transition-[width] duration-300 overflow-hidden',
                                panelOpen ? 'w-[220px] lg:w-[280px]' : 'w-0'
                            )}
                        >
                            <div className="w-[220px] lg:w-[280px] h-full flex flex-col rounded-2xl bg-white" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)' }}>
                                {/* Panel header */}
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#007A49] animate-pulse" />
                                        <span className="text-xs font-semibold text-gray-800">Recent interventions</span>
                                        {activityCount > 0 && (
                                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                {activityCount}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-hidden">
                                    <RecentAdditionsComponent onTotalChange={setActivityCount} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Contributor view */
                <div className="flex-1 overflow-hidden">
                    {selectedProjectUid
                        ? <ProjectMap projectId={selectedProjectUid} token={accessToken} />
                        : null
                    }
                </div>
            )}
        </div>
    )
}

export default Overview
