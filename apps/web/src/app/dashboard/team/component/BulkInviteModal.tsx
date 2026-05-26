import React, { useState, useEffect } from 'react'
import {
    Plus,
    Copy,
    Trash2,
    Link2 as LinkIcon,
    Mail,
    Calendar,
    User,
    Loader2,
    Check,
    AlertCircle,
    Minus,
} from 'lucide-react'
import { createProjectInviteLink, getAllProjectInviteLink, removeInviteLink } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { Modal } from '@/app/dashboard/species/components/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'

const BulkInvitationModal = ({ isOpen, onClose }) => {
    const [existingLinks, setExistingLinks] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [domainRestrictions, setDomainRestrictions] = useState([''])
    const [newLink, setNewLink] = useState(null)
    const [copiedId, setCopiedId] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { accessToken } = useToken()
    const SelectedProject = useProjectStore(state => state.selectedProject)
    const inviteurl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/dashboard?project-link`
        : ''

    useEffect(() => {
        if (isOpen) {
            fetchExistingLinks()
            setError('')
            setSuccess('')
            setDomainRestrictions([''])
            setNewLink(null)
        }
    }, [isOpen])

    const fetchExistingLinks = async () => {
        setIsLoading(true)
        try {
            const response = await getAllProjectInviteLink(accessToken || '', SelectedProject?.uid)
            if (response?.statusCode == 200) setExistingLinks(response.data)
            else throw ''
        } catch {
            setError('Failed to fetch existing links')
        } finally {
            setIsLoading(false)
        }
    }

    const addDomainField = () => setDomainRestrictions(prev => [...prev, ''])
    const removeDomainField = (index: number) => {
        if (domainRestrictions.length > 1)
            setDomainRestrictions(prev => prev.filter((_, i) => i !== index))
    }
    const updateDomainRestriction = (index: number, value: string) =>
        setDomainRestrictions(prev => prev.map((d, i) => i === index ? value : d))

    const generateInvitationLink = async () => {
        const validDomains = domainRestrictions.filter(d => d.trim())
        if (validDomains.length === 0) { setError('Please enter at least one domain restriction'); return }
        if (validDomains.some(d => !d.startsWith('@'))) { setError('All domain restrictions should start with @'); return }
        const uniqueDomains = [...new Set(validDomains)]
        if (uniqueDomains.length !== validDomains.length) { setError('Duplicate domains are not allowed'); return }

        setIsCreating(true)
        setError('')
        try {
            const response = await createProjectInviteLink(accessToken || '', SelectedProject?.uid, {
                restriction: uniqueDomains,
                expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            })
            if (response && (response.statusCode == 200 || response.statusCode == 201)) {
                const generatedLink = {
                    id: Date.now().toString(),
                    invitationlink: response.data.link,
                    restriction: uniqueDomains,
                    created_at: new Date().toISOString(),
                    created_by: 'me',
                }
                setNewLink(response.data.link)
                setExistingLinks(prev => [generatedLink, ...prev])
                setDomainRestrictions([''])
                setSuccess('Invitation link created!')
            } else throw ''
        } catch {
            setError('Failed to create invitation link')
        } finally {
            setIsCreating(false)
        }
    }

    const deleteLink = async (id: string) => {
        setExistingLinks(prev => prev.filter(l => l.id !== id))
        setSuccess('Link deleted')
        try { await removeInviteLink(accessToken || '', SelectedProject?.uid, id) }
        catch { setError('Failed to delete link') }
    }

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch { setError('Failed to copy to clipboard') }
    }

    const formatDate = (dateString: string) => {
        try { return format(parseISO(dateString), 'MMM d, yyyy HH:mm') } catch { return '' }
    }

    const renderDomainRestrictions = (restrictions) =>
        Array.isArray(restrictions) ? restrictions.join(', ') : (restrictions || '')

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={
            <span className="flex items-center gap-2">
                <LinkIcon size={16} className="text-primary" />
                Invitation links
            </span>
        } size="large">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Create new link */}
                <div className="lg:w-1/2 space-y-4">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Plus size={14} className="text-primary" />
                        Create new link
                    </p>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                            <Check size={14} />
                            {success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label>Domain restrictions</Label>
                        <div className="space-y-2">
                            {domainRestrictions.map((domain, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        <Input
                                            value={domain}
                                            onChange={(e) => updateDomainRestriction(index, e.target.value)}
                                            placeholder="@company.com"
                                            className="pl-9"
                                            disabled={isCreating}
                                        />
                                    </div>
                                    {domainRestrictions.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeDomainField(index)}
                                            disabled={isCreating}
                                        >
                                            <Minus size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addDomainField}
                            disabled={isCreating}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
                        >
                            <Plus size={12} />
                            Add another domain
                        </button>
                        <p className="text-xs text-muted-foreground">Only emails with these domains can use the link</p>
                    </div>

                    <Button onClick={generateInvitationLink} disabled={isCreating} className="w-full">
                        {isCreating ? (
                            <><Loader2 size={14} className="mr-2 animate-spin" />Creating...</>
                        ) : (
                            <><Plus size={14} className="mr-2" />Generate invitation link</>
                        )}
                    </Button>

                    {newLink && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Check size={14} />
                                New link created!
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={`${inviteurl}=${newLink}`}
                                    readOnly
                                    className="text-xs bg-background"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 flex-shrink-0"
                                    onClick={() => copyToClipboard(`${inviteurl}=${newLink}`, newLink)}
                                >
                                    {copiedId === newLink ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Existing links */}
                <div className="lg:w-1/2 space-y-3">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <LinkIcon size={14} className="text-muted-foreground" />
                        Existing links
                    </p>

                    <ScrollArea className="h-80">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                            </div>
                        ) : existingLinks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                                <LinkIcon size={32} className="text-muted-foreground/40" />
                                <p className="text-sm">No invitation links yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2 pr-2">
                                {existingLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="bg-muted/40 border border-border rounded-lg p-3 hover:border-border/80 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                    <Mail size={12} className="text-muted-foreground" />
                                                    <span className="truncate">{renderDomainRestrictions(link.restriction || link.domain_restriction)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar size={10} />
                                                    <span>{formatDate(link.created_at)}</span>
                                                    <User size={10} className="ml-1" />
                                                    <span>{link.created_by}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        value={`${inviteurl}=${link.invitationlink}`}
                                                        readOnly
                                                        className="h-7 text-xs bg-background px-2"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 flex-shrink-0"
                                                        onClick={() => copyToClipboard(`${inviteurl}=${link.invitationlink}`, link.id)}
                                                    >
                                                        {copiedId === link.id
                                                            ? <Check size={12} className="text-primary" />
                                                            : <Copy size={12} />
                                                        }
                                                    </Button>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                                onClick={() => deleteLink(link.id)}
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </Modal>
    )
}

export default BulkInvitationModal
