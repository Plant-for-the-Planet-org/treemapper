import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Shield, User, Mail, AlertCircle, Trash2, Save, CheckCircle, Key, X } from 'lucide-react'
import { expireInvite, removeProjectMember, updateUserRole, updateMemberExtraPermissions } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { toast } from 'react-toastify'
import avatar from 'animal-avatar-generator'
import { Modal } from '@/app/(dashboard)/project/[projectUid]/species/components/Modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, parseISO } from 'date-fns'

const ALL_PERMISSIONS = [
  { key: 'approve_intervention', label: 'Approve Intervention' },
  { key: 'approve_site', label: 'Approve Site' },
  { key: 'add_site', label: 'Add Site' },
  { key: 'request_species', label: 'Request Species' },
] as const

function capitalize(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

const customImageGenerator = (id: string) => {
  const svg = avatar(id, { size: 100 })
  return <div className="w-24 h-24 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: svg }} />
}

const formatDate = (dateString: string) => {
  try { return format(parseISO(dateString), 'MMMM d, yyyy') } catch { return 'N/A' }
}

const roleVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'default'
    case 'contributor': return 'secondary'
    default: return 'outline'
  }
}

const UserDetailsModal = ({ isOpen, onClose, user, handleRefresh, isImpersonating = false }) => {
  const [currentRole, setCurrentRole] = useState('')
  const [isEdited, setIsEdited] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [permissionsSaveSuccess, setPermissionsSaveSuccess] = useState(false)
  const { accessToken } = useToken()
  const selectedProject = useProjectStore((state) => state.selectedProject)

  useEffect(() => {
    if (user && isOpen) {
      setCurrentRole(user.role ? capitalize(user.role) : '')
      setIsEdited(false)
      setSaveSuccess(false)
      setSelectedPermissions(user.extraPermissions || [])
      setPermissionsSaveSuccess(false)
    }
  }, [user, isOpen])

  const canEditExtraPermissions =
    isImpersonating && user?.type !== 'invitation' && ['Admin', 'Contributor'].includes(user?.role)

  const handlePermissionToggle = (key: string) => {
    setSelectedPermissions(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])
    setPermissionsSaveSuccess(false)
  }

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true)
    try {
      const response = await updateMemberExtraPermissions(
        accessToken || '', selectedProject?.uid || '', user.uid, selectedPermissions,
      )
      if (response?.statusCode === 200) {
        toast.success('Permissions updated successfully')
        setPermissionsSaveSuccess(true)
        setTimeout(() => { setPermissionsSaveSuccess(false); handleRefresh() }, 2000)
        return
      }
      toast.error('Failed to update permissions: ' + String(response.message))
    } catch {
      toast.error('Failed to update permissions')
    } finally {
      setIsSavingPermissions(false)
    }
  }

  const handleRoleChange = (value: string) => {
    setCurrentRole(value)
    setIsEdited(value !== user.role)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await updateUserRole(accessToken || '', selectedProject?.uid || '', user.uid, { role: currentRole })
      if (response?.statusCode == 200) {
        toast.success('Role updated successfully')
        setSaveSuccess(true)
        setIsEdited(false)
        setTimeout(() => { setSaveSuccess(false); handleRefresh() }, 2000)
        return
      }
      toast.error('Failed to update user: ' + String(response.message))
    } catch {
      toast.error('Role update failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveUser = async () => {
    setIsRemoving(true)
    if (user.type === 'invitation') { handleRemoveInvitation(); return }
    try {
      const response = await removeProjectMember(accessToken || '', selectedProject?.uid || '', user.uid)
      if (response?.statusCode == 200) {
        setShowConfirmModal(false)
        toast.success('Member removed from the project successfully')
        setTimeout(() => { handleRefresh(); onClose(); setIsRemoving(false) }, 2000)
        return
      }
      toast.error(String(response.message))
    } catch {
      toast.error('Failed to remove user')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleRemoveInvitation = async () => {
    setShowConfirmModal(false)
    setIsRemoving(true)
    try {
      const response = await expireInvite(accessToken || '', { token: user.token }, selectedProject?.uid || '')
      if (response?.statusCode == 200) {
        toast.success('Invitation removed successfully')
        setTimeout(() => { handleRefresh(); onClose() }, 2000)
        return
      }
      toast.error(String(response.message))
    } catch {
      toast.error('Failed to remove invitation')
    } finally {
      setIsRemoving(false)
    }
  }

  if (!user) return null

  return (
    <>
      {/* Confirm remove dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Remove user</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex items-center justify-center w-14 h-14 bg-destructive/10 rounded-full">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Are you sure you want to remove <strong className="text-foreground">{user.name}</strong> from this project? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleRemoveUser} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Modal isOpen={isOpen} onClose={onClose} title="User details" size="large">
        <div className="space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user.uid ? customImageGenerator(user.uid)
                : <span className="w-full h-full flex items-center justify-center bg-muted text-xl font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
              }
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1.5">@{user.username}</p>
              <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>{user.status}</Badge>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-3">Account information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Email" value={user.email} />
              <InfoItem icon={Calendar} label={user.status !== 'Pending' ? 'Member since' : 'Invited at'} value={formatDate(user.joinedDate)} />
              {user.invitedBy && <InfoItem icon={User} label="Invited by" value={user.invitedBy} />}
              {user.lastActive && <InfoItem icon={Clock} label="Last activity" value={formatDate(user.lastActive)} />}
            </div>
          </div>

          {/* Role management */}
          {user.role !== 'Owner' && user.type !== 'invitation' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Role management</p>
              </div>
              <Select value={currentRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — full access</SelectItem>
                  <SelectItem value="contributor">Contributor — can edit and create</SelectItem>
                  <SelectItem value="observer">Observer — can review</SelectItem>
                </SelectContent>
              </Select>
              {isEdited && !saveSuccess && (
                <p className="text-xs text-amber-600">Role will change from {user.role} to {currentRole}</p>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle size={12} /> Role updated successfully
                </div>
              )}
            </div>
          )}

          {/* Extra permissions */}
          {canEditExtraPermissions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Special permissions</p>
              </div>
              <p className="text-xs text-muted-foreground">Grant extra capabilities beyond the standard role. Only visible to super admins.</p>
              <div className="space-y-2.5">
                {ALL_PERMISSIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${key}`}
                      checked={selectedPermissions.includes(key)}
                      onCheckedChange={() => handlePermissionToggle(key)}
                    />
                    <Label htmlFor={`perm-${key}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
              {permissionsSaveSuccess ? (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle size={12} /> Permissions updated
                </div>
              ) : (
                <Button size="sm" onClick={handleSavePermissions} disabled={isSavingPermissions}>
                  <Save size={12} className="mr-1.5" />
                  {isSavingPermissions ? 'Saving...' : 'Update permissions'}
                </Button>
              )}
            </div>
          )}

          {/* Pending invitation */}
          {user.role !== 'Owner' && user.type === 'invitation' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-600" />
                <p className="text-sm font-medium text-foreground">Pending invitation</p>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>{user.name || user.email}</strong> has not yet accepted the project invitation.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                disabled={isRemoving}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <X size={12} className="mr-1.5" />
                {isRemoving ? 'Removing...' : 'Discard invitation'}
              </Button>
            </div>
          )}

          {/* Footer actions */}
          {user.role !== 'Owner' && user.type !== 'invitation' && (
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                disabled={isRemoving}
              >
                <Trash2 size={12} className="mr-1.5" />
                {isRemoving ? 'Removing...' : 'Remove user'}
              </Button>
              {isEdited && !saveSuccess && (
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save size={12} className="mr-1.5" />
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-1.5 bg-background rounded-md border border-border">
      <Icon size={14} className="text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground font-medium break-words">{value}</p>
    </div>
  </div>
)

export default UserDetailsModal
