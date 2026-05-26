'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Users, UserMinus, UserPlus, Search, Crown, ShieldCheck } from 'lucide-react'
import { getallstieMembers, grantSiteAccess, revokeiteAccess } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const siteAccessAPI = {
  async getMembers(token, prjId, siteUid) {
    const response = await getallstieMembers(token, prjId, siteUid)
    if (response.statusCode !== 200) throw new Error(response.message || 'Failed to fetch members')
    return response.data.data
  },
  async grantAccess(siteUid, memberUid, selectedProjectUid, token) {
    const response = await grantSiteAccess(token, selectedProjectUid, siteUid, memberUid)
    if (response.statusCode !== 201 && response.statusCode !== 200) throw new Error(response.message || 'Failed to grant access')
    return response.data
  },
  async revokeAccess(siteUid, memberUid, selectedProjectUid, token) {
    const response = await revokeiteAccess(token, selectedProjectUid, siteUid, memberUid)
    if (response.statusCode !== 201 && response.statusCode !== 200) throw new Error(response.message || 'Failed to revoke access')
    return response.data
  },
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  contributor: 'Contributor',
  observer: 'Observer',
}

const getRoleVariant = (role: string): 'ghost' | 'secondary' => {
  return role === 'admin' || role === 'owner' ? 'ghost' : 'secondary'
}

const RoleIcon = ({ role }: { role: string }) => {
  if (role === 'owner') return <Crown size={10} />
  if (role === 'admin') return <ShieldCheck size={10} />
  return null
}

interface ConfirmDialogState {
  isOpen: boolean
  type: 'grant-access' | 'revoke-access' | ''
  member: any
}

function MemberCard({ member, action }: { member: any; action: React.ReactNode }) {
  const isDefault = member.role === 'admin' || member.role === 'owner'
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <Avatar className="bg-background">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium text-foreground text-sm truncate">{member.name}</div>
          <div className="text-muted-foreground text-xs break-all">{member.email}</div>
          {isDefault && (
            <div className="mt-0.5">
              <Badge variant={getRoleVariant(member.role)} className="pl-0">
                <RoleIcon role={member.role} />
                {ROLE_LABELS[member.role] ?? member.role}
              </Badge>
            </div>
          )}
        </div>
      </div>
      {!isDefault && (
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant={getRoleVariant(member.role)}>
            {ROLE_LABELS[member.role] ?? member.role}
          </Badge>
          {action}
        </div>
      )}
    </div>
  )
}

export default function SiteAccessModal({ isOpen, setIsOpen, site, refreshData }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: '',
    member: null,
  })

  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)

  useEffect(() => {
    if (isOpen && site?.id) fetchMembers()
  }, [isOpen, site?.id])

  const fetchMembers = async () => {
    if (!site?.id) return
    setInitialLoading(true)
    setError(null)
    try {
      const data = await siteAccessAPI.getMembers(accessToken, selectedProject.uid, site.id)
      setMembers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setInitialLoading(false)
    }
  }

  const withAccess = useMemo(() =>
    members.filter((m: any) => m.hasAccess || m.role === 'admin' || m.role === 'owner'),
    [members]
  )

  const withoutAccess = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter((m: any) => {
      if (m.hasAccess || m.role === 'admin' || m.role === 'owner') return false
      if (!q) return true
      return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    })
  }, [members, search])

  const handleConfirmAction = async () => {
    setLoading(true)
    setError(null)
    try {
      if (confirmDialog.type === 'grant-access') {
        await siteAccessAPI.grantAccess(site.id, confirmDialog.member.uid, selectedProject.uid, accessToken)
        await refreshData()
        setMembers(prev => prev.map((m: any) =>
          m.uid === confirmDialog.member.uid ? { ...m, hasAccess: true } : m
        ))
      } else if (confirmDialog.type === 'revoke-access') {
        await siteAccessAPI.revokeAccess(site.id, confirmDialog.member.uid, selectedProject.uid, accessToken)
        await refreshData()
        setMembers(prev => prev.map((m: any) =>
          m.uid === confirmDialog.member.uid ? { ...m, hasAccess: false } : m
        ))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setConfirmDialog({ isOpen: false, type: '', member: null })
    }
  }

  // TODO: bulk "Add All Contributors" action was stubbed but not implemented
  // <Button onClick={handleAddAllContributors}>Add All Contributors</Button>

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl h-[80vh] sm:h-[70vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-border flex-shrink-0">
            <DialogTitle>Manage Site Access</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {initialLoading ? (
              <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                <span className="text-sm">Loading members...</span>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={fetchMembers}>Retry</Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="has-access" className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 pt-4 flex-shrink-0">
                  <TabsList className="w-full">
                    <TabsTrigger value="has-access" className="flex-1">
                      Has Access
                      <span className="ml-1.5 text-xs opacity-60">({withAccess.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="no-access" className="flex-1">
                      No Access
                      <span className="ml-1.5 text-xs opacity-60">({withoutAccess.length || members.filter((m: any) => !m.hasAccess && m.role !== 'admin' && m.role !== 'owner').length})</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Has Access tab */}
                <TabsContent value="has-access" className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
                  {withAccess.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No members have access yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {withAccess.map((member: any) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          action={
                            member.role === 'admin' || member.role === 'owner' ? null : (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={loading}
                                onClick={() => setConfirmDialog({ isOpen: true, type: 'revoke-access', member })}
                              >
                                <UserMinus size={12} />
                                Revoke
                              </Button>
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* No Access tab */}
                <TabsContent value="no-access" className="flex-1 overflow-hidden flex flex-col mt-4">
                  <div className="px-6 flex-shrink-0 mb-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} />
                      <Input
                        placeholder="Search members..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {withoutAccess.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{search ? 'No members match your search' : 'Everyone has access'}</p>
                      {!search && <p className="text-xs text-muted-foreground/60 mt-1">Invite people to the project to grant site access</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {withoutAccess.map((member: any) => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            action={
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                onClick={() => setConfirmDialog({ isOpen: true, type: 'grant-access', member })}
                              >
                                <UserPlus size={12} />
                                Add
                              </Button>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmDialog({ isOpen: false, type: '', member: null }) }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog.type === 'grant-access'
              ? `Grant site access to ${confirmDialog.member?.name}?`
              : `Revoke site access from ${confirmDialog.member?.name}?`}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setConfirmDialog({ isOpen: false, type: '', member: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'revoke-access' ? 'destructive' : 'default'}
              disabled={loading}
              onClick={handleConfirmAction}
            >
              {loading && <span className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
