'use client'

import React, { useEffect, useState } from 'react'
import { Search, Download, Eye, ChevronUp, ChevronDown, Plus, Upload } from 'lucide-react'
import InviteUserModal from './component/InviteUserModal'
import UserDetailsModal from './component/UserDetailsModal'
import { toast } from 'react-toastify'
import { useToken } from '@/context/useTokenContext'
import { getTeamMemebers } from '@shared-core/fetchApi/api.fetch'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useUserStore } from '@shared-core/store/useUserStore'
import avatar from 'animal-avatar-generator'
import BulkInvitationModal from './component/BulkInviteModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useTopBarActions } from '@/component/header/TopBarActions'
import { parseISO } from 'date-fns'
import { format } from 'date-fns'


function transformData(data) {
    const members = data.members.map(member => ({
        uid: member.user.uid,
        name: member.user.name || member.user.authName,
        username: member.user.name || member.user.authName,
        email: member.user.email,
        role: capitalize(member.role),
        joinedDate: member.joinedAt,
        status: member.user.isActive ? 'Active' : 'Inactive',
        invitedBy: null,
        type: 'member',
        avatar: member.user.image,
        extraPermissions: member.extraPermissions || [],
        siteAccess: member.siteAccess || 'all_sites',
        restrictedSites: member.restrictedSites || [],
    }))

    const invitations = data.invitations.map((invite) => ({
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

    return [...members, ...invitations]
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const customImageGenerator = (id) => {
    const svg = avatar(id, { size: 40 })
    return (
        <div
            className="h-10 w-10 rounded-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}

const statusVariant = (status): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
        case 'Active': return 'default'
        case 'Suspended': return 'destructive'
        default: return 'secondary'
    }
}

const TeamsDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [isModalUserOpen, setIsModalUserOpen] = useState(false)
    const { accessToken } = useToken()
    const [bulkInviteModal, setBulkInviteModal] = useState(false)
    const [users, setUsers] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
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
    }, [SelectedProject])

    const fetchTeamMembers = async () => {
        setLoading(true)
        try {
            const response = await getTeamMemebers(accessToken || '', SelectedProject?.uid)
            if (response && response.statusCode === 200) {
                setUsers(transformData(response.data))
            }
        } finally {
            setLoading(false)
        }
    }

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }))
    }

    const getSortedAndFilteredUsers = () => {
        const filtered = users.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return [...filtered].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        try { return format(parseISO(dateString), 'MMM d, yyyy') } catch { return 'N/A' }
    }

    const formatSiteAccess = (siteAccess: string | null, restrictedSites: string[]) => {
        switch (siteAccess) {
            case 'all_sites': return 'All sites'
            case 'deny_all': return 'No access'
            case 'read_only': return 'Read only'
            case 'limited_access': return `${restrictedSites?.length ?? 0} sites`
            default: return '—'
        }
    }

    const downloadJsonAsCsv = (jsonData, filename) => {
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

    const sortedUsers = getSortedAndFilteredUsers()

    const SortIcon = ({ col }) => {
        if (sortConfig.key !== col) return null
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
    }

    return (
        <div className="flex flex-col h-full">
            {/* Filter bar */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border sticky top-0 bg-background z-10">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {users.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadJsonAsCsv(users, 'userList')}
                        className="text-muted-foreground"
                    >
                        <Download size={14} className="mr-1.5" />
                        Export {users.length} users
                    </Button>
                )}
            </div>

            {/* List */}
            <div className="p-4 md:p-6 flex-1 min-h-0 overflow-auto">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                    </div>
                ) : sortedUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm border border-border rounded-lg">
                        No users found matching your search.
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        {/* TODO: review mobile card design — meta row content/order, tap target, status badge placement */}
                        <div className="md:hidden space-y-2">
                            {sortedUsers.map((user) => (
                                <button
                                    key={user.uid}
                                    onClick={() => { setSelectedUser(user); setIsModalUserOpen(true) }}
                                    className="w-full text-left bg-background border border-border rounded-lg p-3 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {user.avatar
                                                ? <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                                                : customImageGenerator(user.uid)
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                </div>
                                                <Badge variant={statusVariant(user.status)} className="flex-shrink-0">{user.status}</Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground pt-1">
                                                <span className="text-foreground">{user.role}</span>
                                                <span>{formatSiteAccess(user.siteAccess, user.restrictedSites)}</span>
                                                {user.status !== 'Pending' && <span>Joined {formatDate(user.joinedDate)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            User
                                        </th>
                                        {(['role', 'siteAccess', 'joinedDate', 'status'] as const).map((col) => (
                                            <th key={col} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                <button
                                                    onClick={() => requestSort(col)}
                                                    className="flex items-center gap-1 font-medium focus:outline-none hover:text-foreground transition-colors"
                                                >
                                                    {col === 'siteAccess' ? 'Site Access' : col === 'joinedDate' ? 'Joined Date' : col.charAt(0).toUpperCase() + col.slice(1)}
                                                    <SortIcon col={col} />
                                                </button>
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {sortedUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-muted/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {user.avatar
                                                            ? <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                                                            : customImageGenerator(user.uid)
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatSiteAccess(user.siteAccess, user.restrictedSites)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {user.status === 'Pending' ? '—' : formatDate(user.joinedDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setSelectedUser(user); setIsModalUserOpen(true) }}
                                                    className="h-8 w-8"
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
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
