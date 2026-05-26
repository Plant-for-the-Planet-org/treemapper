import React, { useState } from 'react'
import { CheckCircle, Mail, UserPlus } from 'lucide-react'
import { createProjectInvite } from '@shared-core/fetchApi/api.fetch'
import useProjectStore from '@shared-core/store/useProjectStore'
import { toast } from 'react-toastify'
import { Modal } from '@/app/dashboard/species/components/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const InviteUserModal = ({ isOpen, onClose, token, handleRefresh }) => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [role, setRole] = useState('contributor')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const selectedProject = useProjectStore((state) => state.selectedProject)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address is invalid'
    if (message && message.length > 300) newErrors.message = 'Message must be 300 characters or less'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    const response = await createProjectInvite(token, selectedProject?.uid || '', { email, message, role })
    setIsSubmitting(false)
    if (response.statusCode === 200 || response.statusCode === 201) {
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setEmail('')
        setMessage('')
        setRole('contributor')
        onClose()
        handleRefresh()
      }, 2000)
    } else {
      toast.error(String(response.message))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          Invite member to the project
        </span>
      }
      size="small"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <CheckCircle className="w-14 h-14 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Invitation sent!</h3>
          <p className="text-sm text-muted-foreground text-center">
            {email} has been invited as a {role}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@domain.org"
                className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="observer">Observer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-message">Message (optional)</Label>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Add a personal message..."
              className={errors.message ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground text-right">
              {errors.message ? <span className="text-destructive">{errors.message}</span> : `${message.length}/300`}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send invitation'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default InviteUserModal
