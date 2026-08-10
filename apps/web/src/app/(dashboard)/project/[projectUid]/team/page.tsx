'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
    Search, Download, Eye, ChevronUp, ChevronDown, Plus, Upload, X,
    Users, UserCheck, Mail, TreePine,
} from 'lucide-react'
import InviteUserModal from './component/InviteUserModal'
import UserDetailsModal from './component/UserDetailsModal'
import { toast } from 'react-toastify'
import { useToken } from '@/context/useTokenContext'
import {
    getTeamMemebers,
    getProjectAnalytics,
    getProjectTeamActivity,
    expireInvite,
} from '@shared-core/fetchApi/api.fetch'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useUserStore } from '@shared-core/store/useUserStore'
import avatar from 'animal-avatar-generator'
import BulkInvitationModal from './component/BulkInviteModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTopBarActions } from '@/component/header/TopBarActions'
import { formatNumber } from '@shared-core/utils/numberFormatingHelper'
import { parseISO, formatDistanceToNowStrict, differenceInDays } from 'date-fns'

function capitalize(str: string) {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function transformMembers(members: any[], treesByUid: Record<string, number>) {
    return members.map(member => ({
        uid: member.user.uid,
        name: member.user.name || member.user.authName,
        username: member.user.name || member.user.authName,
        email: member.user.email,
        role: capitalize(member.role),
        joinedDate: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        status: member.user.isActive ? 'Active' : 'Inactive',
        invitedBy: null,
        type: 'member',
        avatar: member.user.image,
        extraPermissions: member.extraPermissions || [],
        siteAccess: member.siteAccess || 'all_sites',
        restrictedSites: member.restrictedSites || [],
        trees: treesByUid[member.user.uid] ?? 0,
    }))
}

function transformInvitations(invitations: any[]) {
    return invitations.map((invite) => ({
        uid: invite.uid,
        name: invite.email.split('@')[0],
        username: invite.email.split('@')[0],
        email: invite.email,
        role: capitalize(invite.role),
        joinedDate: invite.createdAt,
        status: capitalize(invite.status),
        invitedBy: invite.invitedBy?.displayName || invite.invitedBy?.name || 'Unknown',
        type: 'invitation',
        token: invite.token,
        siteAccess: null,
        restrictedSites: [],
    }))
}

const customImageGenerator = (id: string, size = 36) => {
    const svg = avatar(id, { size })
    return (
        <div
            className="rounded-full overflow-hidden flex-shrink-0"
            style={{ height: size, width: size }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}

const MemberAvatar = ({ user, size = 36 }: { user: any; size?: number }) =>
    user.avatar
        ? <img className="rounded-full flex-shrink-0 object-cover" style={{ height: size, width: size }} src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
        : customImageGenerator(user.uid, size)

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
        case 'Active': return 'default'
        case 'Suspended': return 'destructive'
        default: return 'secondary'
    }
}

const roleVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
        case 'Owner': return 'default'
        case 'Admin': return 'secondary'
        default: return 'outline'
    }
}

// Build a short human sentence for a team-activity audit entry.
const describeActivity = (a: any): { actor: string; text: string } => {
    const actor = a.userDisplayName || a.userEmail?.split('@')[0] || 'Someone'
    const nv = a.newValues || {}
    const role = nv.projectRole ? capitalize(nv.projectRole) : null
    switch (`${a.entityType}:${a.action}`) {
        case 'project_invite:invite':
            return { actor, text: `invited ${nv.email || 'a new member'}${role ? ` as ${role}` : ''}` }
        case 'project_invite:accept_invite':
        case 'project_member:accept_invite':
        case 'project_member:create':
            return { actor, text: `joined the project${role ? ` as ${role}` : ''}` }
        case 'project_member:role_change':
            return { actor, text: role ? `was set to ${role}` : 'had their role changed' }
        case 'project_member:permission_change':
            return { actor, text: 'had their permissions updated' }
        case 'project_member:soft_delete':
        case 'project_member:delete':
            return { actor, text: 'was removed from the project' }
        case 'project_invite:decline_invite':
            return { actor, text: 'declined an invitation' }
        case 'bulk_invite:invite':
        case 'bulk_invite:create':
            return { actor, text: 'created an invite link' }
        default:
            return { actor, text: `${String(a.action).replace(/_/g, ' ')} ${String(a.entityType).replace(/_/g, ' ')}` }
    }
}

const relativeTime = (date: string | null) => {
    if (!date) return null
    try { return formatDistanceToNowStrict(parseISO(date), { addSuffix: true }) } catch { return null }
}

const ROLE_TABS = ['all', 'owner', 'admin', 'contributor', 'observer'] as const

const TeamsDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isModalUserOpen, setIsModalUserOpen] = useState(false)
    const { accessToken } = useToken()
    const [bulkInviteModal, setBulkInviteModal] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [invitations, setInvitations] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [sortConfig, setSortConfig] = useState({ key: 'joinedDate', direction: 'desc' })

    const SelectedProject = useProjectStore((state) => state.selectedProject)
    const userRole = SelectedProject?.userRole
    const canManageTeam = ['owner', 'admin'].includes(userRole || '')
    const currentUser = useUserStore((state) => state.user)
    const isImpersonating = currentUser?.impersonated === true

    useTopBarActions([
        {
            label: 'Bulk Invite',
            onClick: () => {
                if (!canManageTeam) { toast.error('You do not have permission to invite users.'); return }
                setBulkInviteModal(true)
            },
            icon: Upload,
            variant: 'outline',
            hideLabelOnMobile: true,
        },
        {
            label: 'Invite User',
            onClick: () => {
                if (!canManageTeam) { toast.error('You do not have permission to invite users.'); return }
                setIsModalOpen(true)
            },
            icon: Plus,
            variant: 'primary',
            hideLabelOnMobile: true,
        },
    ], [canManageTeam])

    useEffect(() => {
        if (SelectedProject) fetchTeamMembers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [SelectedProject])

    const fetchTeamMembers = async () => {
        setLoading(true)
        try {
            // Members + invitations, the per-member tree counts (leaderboard) and the
            // activity feed are independent reads — fire them together.
            const [membersRes, leaderboardRes, activityRes] = await Promise.all([
                getTeamMemebers(accessToken || '', SelectedProject?.uid),
                getProjectAnalytics(accessToken || '', SelectedProject?.uid || '', 1000).catch(() => null),
                getProjectTeamActivity(accessToken || '', SelectedProject?.uid || '', 20).catch(() => null),
            ])

            const treesByUid: Record<string, number> = {}
            const items = leaderboardRes?.data?.items || leaderboardRes?.items || []
            items.forEach((it: any) => { if (it?.uid) treesByUid[it.uid] = Number(it.totalTrees) || 0 })

            if (membersRes && membersRes.statusCode === 200) {
                setMembers(transformMembers(membersRes.data.members || [], treesByUid))
                setInvitations(transformInvitations(membersRes.data.invitations || []))
            }

            const acts = activityRes?.data?.data || activityRes?.data || []
            setActivities(Array.isArray(acts) ? acts : [])
        } finally {
            setLoading(false)
        }
    }

    const requestSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }))
    }

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = { all: members.length }
        members.forEach(m => {
            const r = m.role.toLowerCase()
            counts[r] = (counts[r] || 0) + 1
        })
        return counts
    }, [members])

    const sortedMembers = useMemo(() => {
        const filtered = members.filter(u => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter
            return matchesSearch && matchesRole
        })
        return [...filtered].sort((a, b) => {
            const av = a[sortConfig.key] ?? ''
            const bv = b[sortConfig.key] ?? ''
            if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1
            if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [members, searchTerm, roleFilter, sortConfig])

    // Stats
    const activeThisWeek = useMemo(
        () => members.filter(m => m.lastActiveAt && differenceInDays(new Date(), parseISO(m.lastActiveAt)) <= 7).length,
        [members]
    )
    const totalTrees = useMemo(() => members.reduce((sum, m) => sum + (m.trees || 0), 0), [members])
    const treesPerMember = useMemo(() => {
        const denom = activeThisWeek || members.length
        return denom ? Math.round(totalTrees / denom) : 0
    }, [totalTrees, activeThisWeek, members.length])

    const formatSiteAccess = (siteAccess: string | null, restrictedSites: string[]) => {
        switch (siteAccess) {
            case 'all_sites': return 'All'
            case 'deny_all': return 'None'
            case 'read_only': return 'Read only'
            case 'limited_access': return `${restrictedSites?.length ?? 0}`
            default: return '—'
        }
    }

    const downloadJsonAsCsv = (jsonData: any[], filename: string) => {
        if (!jsonData || !jsonData.length) return
        const finalList = jsonData.map(({ uid, ...rest }) => rest)
        const headers = Object.keys(finalList[0])
        const csvRows = [
            headers.join(','),
            ...finalList.map(item =>
                headers.map(h => {
                    const v = item[h] === null || item[h] === undefined ? '' : item[h]
                    const s = String(v).replace(/"/g, '""').replace(/\n/g, ' ')
                    return /[,"\n]/.test(s) ? `"${s}"` : s
                }).join(',')
            ),
        ]
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
    }

    const handleCancelInvite = async (invite: any) => {
        if (!canManageTeam) { toast.error('You do not have permission to manage invitations.'); return }
        try {
            const response = await expireInvite(accessToken || '', { token: invite.token }, SelectedProject?.uid || '')
            if (response && response.statusCode === 200) {
                toast.success('Invitation cancelled')
                setInvitations(prev => prev.filter(i => i.uid !== invite.uid))
            } else {
                toast.error(response?.message || 'Could not cancel invitation')
            }
        } catch {
            toast.error('Could not cancel invitation')
        }
    }

    const SortIcon = ({ col }: { col: string }) => {
        if (sortConfig.key !== col) return null
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    }

    const stats = [
        { title: 'Total members', value: members.length, icon: Users },
        { title: 'Active this week', value: activeThisWeek, icon: UserCheck },
        { title: 'Pending invitations', value: invitations.length, icon: Mail },
        { title: 'Trees per active member', value: formatNumber(treesPerMember).toUpperCase(), icon: TreePine },
    ]

    return (
        <div className="flex flex-col h-full overflow-auto">
            {/* Heading */}
            <div className="px-4 md:px-6 pt-5 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Team</h1>
                    <Badge variant="secondary">{members.length} members</Badge>
                    {invitations.length > 0 && (
                        <Badge variant="outline">{invitations.length} pending</Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage roles, invitations and field activity{SelectedProject?.name ? ` for ${SelectedProject.name}` : ''}.
                </p>
            </div>

            {/* Stat cards */}
            <div className="px-4 md:px-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <Card key={s.title} className="py-0">
                        <CardContent className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-xs font-medium text-muted-foreground leading-tight">{s.title}</h3>
                                <div className="bg-primary/10 p-1.5 rounded-lg flex-shrink-0">
                                    <s.icon size={15} className="text-primary" />
                                </div>
                            </div>
                            {loading
                                ? <Skeleton className="h-7 w-14 mt-2" />
                                : <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{s.value}</p>
                            }
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Body: table + sidebar */}
            <div className="px-4 md:px-6 py-4 grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Left: members */}
                <div className="xl:col-span-2 min-w-0">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search name or email"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-auto">
                            <TabsList>
                                {ROLE_TABS.map(r => (
                                    <TabsTrigger key={r} value={r} className="capitalize">
                                        {r === 'all' ? 'All' : capitalize(r)}
                                        {roleCounts[r] ? <span className="ml-1 text-muted-foreground">{roleCounts[r]}</span> : null}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                {sortedMembers.length} of {members.length}
                            </span>
                            {members.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadJsonAsCsv(members, 'team-members')}
                                    className="text-muted-foreground"
                                >
                                    <Download size={14} className="mr-1.5" />
                                    Export
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                        </div>
                    ) : sortedMembers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm border border-border rounded-lg">
                            No members found.
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-2">
                                {sortedMembers.map((user) => (
                                    <button
                                        key={user.uid}
                                        onClick={() => { setSelectedUser(user); setIsModalUserOpen(true) }}
                                        className="w-full text-left bg-background border border-border rounded-lg p-3 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <MemberAvatar user={user} size={40} />
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                    </div>
                                                    <Badge variant={statusVariant(user.status)} className="flex-shrink-0">{user.status}</Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-1">
                                                    <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                                                    <span>{formatNumber(user.trees).toUpperCase()} trees</span>
                                                    {relativeTime(user.lastActiveAt) && <span>{relativeTime(user.lastActiveAt)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableHead>Member</TableHead>
                                            <TableHead>
                                                <button onClick={() => requestSort('role')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                    Role <SortIcon col="role" />
                                                </button>
                                            </TableHead>
                                            <TableHead className="text-right">
                                                <button onClick={() => requestSort('trees')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                                                    Trees <SortIcon col="trees" />
                                                </button>
                                            </TableHead>
                                            <TableHead className="text-center">Sites</TableHead>
                                            <TableHead>
                                                <button onClick={() => requestSort('lastActiveAt')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                    Last active <SortIcon col="lastActiveAt" />
                                                </button>
                                            </TableHead>
                                            <TableHead>
                                                <button onClick={() => requestSort('status')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                    Status <SortIcon col="status" />
                                                </button>
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedMembers.map((user) => (
                                            <TableRow
                                                key={user.uid}
                                                className="cursor-pointer"
                                                onClick={() => { setSelectedUser(user); setIsModalUserOpen(true) }}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar user={user} size={36} />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                                                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant={roleVariant(user.role)}>{user.role}</Badge></TableCell>
                                                <TableCell className="text-right text-sm font-medium text-foreground">{formatNumber(user.trees).toUpperCase()}</TableCell>
                                                <TableCell className="text-center text-sm text-muted-foreground">{formatSiteAccess(user.siteAccess, user.restrictedSites)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{relativeTime(user.lastActiveAt) || '—'}</TableCell>
                                                <TableCell><Badge variant={statusVariant(user.status)}>{user.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsModalUserOpen(true) }}
                                                        className="h-8 w-8"
                                                    >
                                                        <Eye size={14} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </div>

                {/* Right: sidebar */}
                <div className="space-y-4 min-w-0">
                    {/* Pending invitations */}
                    <Card className="py-0">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
                                <Badge variant="outline">{invitations.length}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">Awaiting response</p>
                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                                </div>
                            ) : invitations.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">No pending invitations.</p>
                            ) : (
                                <div className="space-y-2">
                                    {invitations.map((inv) => (
                                        <div key={inv.uid} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                                            {customImageGenerator(inv.email, 32)}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-medium text-foreground truncate">{inv.email}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Badge variant={roleVariant(inv.role)} className="h-4 px-1.5 text-[10px]">{inv.role}</Badge>
                                                    <span className="text-[10px] text-muted-foreground">{relativeTime(inv.joinedDate) || 'sent'}</span>
                                                </div>
                                            </div>
                                            {canManageTeam && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCancelInvite(inv)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                                                    title="Cancel invitation"
                                                >
                                                    <X size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team activity */}
                    <Card className="py-0">
                        <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-foreground">Team activity</h3>
                            <p className="text-xs text-muted-foreground mb-3">Joins, role changes and invitations</p>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full rounded" />)}
                                </div>
                            ) : activities.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">No recent activity.</p>
                            ) : (
                                <div className="space-y-3">
                                    {activities.map((a, idx) => {
                                        const { actor, text } = describeActivity(a)
                                        return (
                                            <div key={a.uid || idx} className="flex gap-2.5">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-foreground leading-snug">
                                                        <span className="font-medium">{actor}</span> {text}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(a.occurredAt)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <BulkInvitationModal isOpen={bulkInviteModal} onClose={() => setBulkInviteModal(false)} />
            <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} token={accessToken} handleRefresh={fetchTeamMembers} />
            <UserDetailsModal
                isOpen={isModalUserOpen}
                onClose={() => setIsModalUserOpen(false)}
                user={selectedUser}
                handleRefresh={fetchTeamMembers}
                isImpersonating={isImpersonating}
            />
        </div>
    )
}

export default TeamsDashboard
