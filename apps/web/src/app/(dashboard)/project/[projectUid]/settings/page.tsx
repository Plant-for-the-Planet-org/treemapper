'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import {
  Settings, Users, MapPin, Shield, Trash2, Save, Leaf,
  Globe, Info, FileText, Upload, AlertTriangle, Lock,
  Check, Loader2, Video, AlertCircle, Image as ImageIcon, ImagePlus, X,
  Key, Copy, RefreshCw, Link2,
} from 'lucide-react'

import UnifiedMapComponent from '@/component/MapSelect'
import { cdnUrl } from '@/lib/cdn'
import GeoJSONUpload from '@/component/GeoJSONfileupload'
import { deleteProject, getSingleProjectDetails, updateProjectSettings, getProjectImages, addProjectImage, deleteProjectImage, generatePreSignUrl, getProjectApiKey, generateProjectApiKey, revokeProjectApiKey } from '@shared-core/fetchApi/api.fetch'
import { useToken } from '@/context/useTokenContext'
import useProjectStore from '@shared-core/store/useProjectStore'
import { useUserStore } from '@shared-core/store/useUserStore'
import { toast } from 'react-toastify'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useTreematchStore } from '@/stores/treematchStore'

// ---------- Approval settings helpers ----------

// Default approval config: gate every source and require site approval. Only
// effective when the master switch (approvalBoardEnabled) is on.
const DEFAULT_APPROVAL_SETTINGS = {
  sources: { web: true, bulk: true, mobile: true },
  siteApprovalRequired: true,
}

// Fill any missing fields so the UI never reads undefined off a legacy/partial value.
const normalizeApprovalSettings = (value: any) => {
  const sources = (value && typeof value === 'object' && value.sources) || {}
  return {
    sources: {
      web: typeof sources.web === 'boolean' ? sources.web : true,
      bulk: typeof sources.bulk === 'boolean' ? sources.bulk : true,
      mobile: typeof sources.mobile === 'boolean' ? sources.mobile : true,
    },
    siteApprovalRequired:
      value && typeof value.siteApprovalRequired === 'boolean' ? value.siteApprovalRequired : true,
  }
}

// ---------- Field components ----------

const InputField = ({ label, name, value, onChange, type = 'text', placeholder = '', icon: Icon = null, validation = {} as { error?: string; hint?: string }, required = false, disabled = false, maxLength, ...props }: any) => {
  const hasError = validation?.error
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {maxLength && !disabled && (
          <span className="text-xs text-muted-foreground">{String(value ?? '').length}/{maxLength}</span>
        )}
      </div>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />}
        <Input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={!!hasError}
          className={cn(Icon && 'pl-9', disabled && 'bg-muted/40 text-muted-foreground cursor-not-allowed', disabled && 'pr-9')}
          {...props}
        />
        {disabled && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
      </div>
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
      {validation?.hint && !hasError && <p className="text-xs text-muted-foreground">{validation.hint}</p>}
    </div>
  )
}

const SelectField = ({ label, name, value, onChange, options, validation = {} as { error?: string }, required = false, disabled = false }) => {
  const hasError = validation?.error
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value || ''} onValueChange={(v) => onChange({ target: { name, value: v } })} disabled={disabled}>
        <SelectTrigger id={name} aria-invalid={!!hasError} className={cn('w-full', disabled && 'bg-muted/40 text-muted-foreground cursor-not-allowed')}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)]">
          {options.filter((o: any) => o.value !== '').map((option: any) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
    </div>
  )
}

const TextareaField = ({ label, name, value, onChange, rows = 4, placeholder = '', validation = {} as { error?: string }, required = false, disabled = false }) => {
  const hasError = validation?.error
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea id={name} name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} disabled={disabled} aria-invalid={!!hasError} className={cn('resize-none', disabled && 'bg-muted/40 text-muted-foreground cursor-not-allowed')} />
      {hasError && <p className="text-xs text-destructive">{validation.error}</p>}
    </div>
  )
}

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
          <div className="flex items-center gap-2.5">
            <Icon size={14} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <ChevronRightToggle open={isOpen} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 border-t border-border pt-5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

const SectionCard = ({ title, icon: Icon, children }: any) => (
  <Card className="py-0 gap-0 overflow-hidden">
    <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border">
      <Icon size={14} className="text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </Card>
)

const ChevronRightToggle = ({ open }: { open: boolean }) => (
  <svg className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ProjectImagesSection = ({ projectImages, onUpload, onDelete, uploading, canEdit = true }: any) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Project images</Label>
        <label className={cn('cursor-pointer', !canEdit && 'pointer-events-none')}>
          <Button asChild size="sm" disabled={uploading || !canEdit}>
            <span>
              {uploading ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Uploading...</> : <><ImagePlus size={14} className="mr-1.5" />Add image</>}
            </span>
          </Button>
          <input type="file" accept="image/*" className="sr-only" disabled={uploading || !canEdit} onChange={onUpload} />
        </label>
      </div>

      {projectImages.length === 0 ? (
        <div className="bg-muted/40 rounded-lg p-8 border border-dashed border-border text-center">
          <ImageIcon size={28} className="text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">No images yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click "Add image" to upload project photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {projectImages.map((img: any) => (
            <div key={img.uid} className="relative group rounded-lg overflow-hidden aspect-square bg-muted border border-border">
              <img src={cdnUrl('project', img.filename) ?? ''} alt={img.originalName || 'Project image'} className="w-full h-full object-cover" />
              {canEdit && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(img.uid)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WebP. Images are stored permanently.</p>
    </div>
  )
}

const NotificationToast = ({ type, message, onClose }: any) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const tone = type === 'error' ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'
  const Icon = type === 'success' ? Check : type === 'error' ? X : Info

  return (
    <div className={cn('z-40 fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg max-w-sm', tone)}>
      <div className="flex items-center gap-2 text-sm">
        <Icon size={16} />
        <p className="font-medium flex-1">{message}</p>
        <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

const SaveBar = ({ onClick, loading, disabled, label = 'Save changes', savingLabel = 'Saving...' }: any) => (
  <div className="flex justify-end">
    <Button type="button" onClick={onClick} disabled={loading || disabled}>
      {loading ? <><Loader2 size={14} className="mr-1.5 animate-spin" />{savingLabel}</> : <><Save size={14} className="mr-1.5" />{label}</>}
    </Button>
  </div>
)

// ---------- Section: General ----------

const GeneralSettings = ({ projectData, handleInputChange, handleSubmit, loading, validationErrors, projectImages, onImageUpload, onImageDelete, imageUploading, canEdit }: any) => (
  <div className="space-y-4">
    <form onSubmit={handleSubmit} className="space-y-4">
      <CollapsibleSection title="Basic information" icon={FileText}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Project name" name="name" value={projectData.name} onChange={handleInputChange} placeholder="Enter project name" icon={FileText} validation={{ error: validationErrors.name }} required maxLength={40} disabled={!canEdit} />
            <InputField label="Project slug" name="slug" value={projectData.slug} onChange={handleInputChange} placeholder="project-slug" icon={Globe} validation={{ error: validationErrors.slug, hint: 'URL-friendly identifier for your project' }} required disabled />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Project type <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={projectData.type}
              onValueChange={(v) => handleInputChange({ target: { name: 'type', value: v } })}
              disabled={!canEdit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {['restoration', 'conservation', 'research', 'education'].map((type) => (
                <Label key={type} htmlFor={`type-${type}`} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors font-normal">
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <span className="text-sm text-foreground capitalize">{type}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <TextareaField label="About project" name="description" value={projectData.description} onChange={handleInputChange} placeholder="Describe your project goals, methodology, and expected outcomes..." rows={4} disabled={!canEdit} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Project classification" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SelectField label="Purpose" name="purpose" value={projectData.purpose} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'conservation', label: 'Conservation' }, { value: 'restoration', label: 'Restoration' }, { value: 'research', label: 'Research' }, { value: 'education', label: 'Education' }, { value: 'community', label: 'Community Development' },
          ]} />
          <SelectField label="Classification" name="classification" value={projectData.classification} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'environmental', label: 'Environmental' }, { value: 'social', label: 'Social' }, { value: 'economic', label: 'Economic' }, { value: 'research', label: 'Research' }, { value: 'educational', label: 'Educational' },
          ]} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Environmental details" icon={Leaf}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SelectField label="Ecosystem" name="ecosystem" value={projectData.ecosystem} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'tropical_rainforest', label: 'Tropical Rainforest' }, { value: 'temperate_forest', label: 'Temperate Forest' }, { value: 'boreal_forest', label: 'Boreal Forest' }, { value: 'grassland', label: 'Grassland' }, { value: 'wetland', label: 'Wetland' }, { value: 'desert', label: 'Desert' }, { value: 'coastal', label: 'Coastal' }, { value: 'mountain', label: 'Mountain' },
          ]} />
          <SelectField label="Project scale" name="scale" value={projectData.scale} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'small', label: 'Small (< 10 hectares)' }, { value: 'medium', label: 'Medium (10-100 hectares)' }, { value: 'large', label: 'Large (100-1000 hectares)' }, { value: 'enterprise', label: 'Enterprise (> 1000 hectares)' },
          ]} />
          <SelectField label="Intensity" name="intensity" value={projectData.intensity} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
          ]} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Location & monitoring" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SelectField label="Country" name="country" value={projectData.country} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'USA', label: 'United States' }, { value: 'CAN', label: 'Canada' }, { value: 'MEX', label: 'Mexico' }, { value: 'BRA', label: 'Brazil' }, { value: 'IND', label: 'India' }, { value: 'PAK', label: 'Pakistan' }, { value: 'CHN', label: 'China' }, { value: 'DEU', label: 'Germany' }, { value: 'FRA', label: 'France' }, { value: 'GBR', label: 'United Kingdom' }, { value: 'AUS', label: 'Australia' },
          ]} />
          <SelectField label="Revision periodicity" name="revisionPeriodicity" value={projectData.revisionPeriodicity} onChange={handleInputChange} disabled={!canEdit} options={[
            { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' }, { value: 'biannually', label: 'Bi-annually' },
          ]} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Targets & resources" icon={Users}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="Target" name="target" type="number" value={projectData.target} onChange={handleInputChange} min="1" placeholder="Enter target number" icon={Users} validation={{ error: validationErrors.target, hint: 'Target must be a positive number greater than 0' }} disabled={!canEdit} />
            <InputField label="Project website" name="website" type="url" value={projectData.website} onChange={handleInputChange} icon={Globe} placeholder="https://yourproject.com" validation={{ error: validationErrors.website, hint: 'Must start with http:// or https://' }} disabled={!canEdit} />
          </div>

          <ProjectImagesSection projectImages={projectImages} onUpload={onImageUpload} onDelete={onImageDelete} uploading={imageUploading} canEdit={canEdit} />

          <InputField label="Video URL" name="videoUrl" type="url" value={projectData.videoUrl} onChange={handleInputChange} icon={Video} placeholder="https://youtube.com/watch?v=..." validation={{ error: validationErrors.videoUrl, hint: 'YouTube, Vimeo, or direct video URL' }} disabled={!canEdit} />
        </div>
      </CollapsibleSection>
    </form>

    <SaveBar onClick={handleSubmit} loading={loading} disabled={!canEdit} />
  </div>
)

// ---------- Section: Location ----------

const LocationSettings = ({ handleLocationUpdate, existingGeoJSON, loading, canEdit }: any) => {
  const [geoJSON, setGeoJSON] = useState(existingGeoJSON || null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { setGeoJSON(existingGeoJSON || null) }, [existingGeoJSON])

  const handleSave = async () => {
    setIsLoading(true)
    await handleLocationUpdate(geoJSON)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Project location" icon={MapPin}>
        <div className="overflow-hidden w-full h-80 lg:h-96 bg-muted rounded-lg flex items-center justify-center mb-4">
          <UnifiedMapComponent mode="point" updateGeoJSON={setGeoJSON} uploadedGeoJSON={geoJSON} />
        </div>
        <GeoJSONUpload onGeoJSONChange={setGeoJSON} />
      </SectionCard>

      <SaveBar onClick={handleSave} loading={isLoading || loading} disabled={!canEdit} label="Update location" savingLabel="Updating..." />
    </div>
  )
}

// ---------- Section: Features ----------

const FeatureToggle = ({ icon: Icon, title, description, checked, onToggle, disabled, children }: any) => (
  <Card className="py-0 gap-0 overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-md leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
          <span className={cn('text-xs font-medium', checked ? 'text-primary' : 'text-muted-foreground')}>
            {checked ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
)

const ApiSettings = ({ projectUid, accessToken, canEdit, apiEnabled, onApiToggle }: any) => {
  const [status, setStatus] = useState<{ exists: boolean; keyPrefix: string | null; lastUsedAt: string | null; createdAt: string | null } | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  const loadStatus = useCallback(async () => {
    if (!projectUid) return
    const result = await getProjectApiKey(accessToken, projectUid)
    if (result?.data) setStatus(result.data)
  }, [projectUid, accessToken])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleGenerate = async () => {
    if (!canEdit) { toast.error('You do not have permission to manage API keys.'); return }
    setBusy(true)
    try {
      const result = await generateProjectApiKey(accessToken, projectUid)
      if (result?.data?.apiKey) {
        setNewKey(result.data.apiKey)
        toast.success('API key generated. Copy it now, it will not be shown again.')
        await loadStatus()
      } else {
        toast.error(result?.message || 'Failed to generate API key')
      }
    } finally { setBusy(false) }
  }

  const handleRevoke = async () => {
    if (!canEdit) { toast.error('You do not have permission to manage API keys.'); return }
    setBusy(true)
    try {
      const result = await revokeProjectApiKey(accessToken, projectUid)
      if (result?.statusCode === 200 || result?.statusCode === 201) {
        setNewKey(null)
        setStatus({ exists: false, keyPrefix: null, lastUsedAt: null, createdAt: null })
        toast.success('API key revoked')
      } else {
        toast.error(result?.message || 'Failed to revoke API key')
      }
    } finally { setBusy(false) }
  }

  const handleCopy = async () => {
    if (!newKey) return
    try {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : 'Never'

  return (
    <FeatureToggle
      icon={Key}
      title="Project API"
      description="Let external apps read this project's information, sites, and interventions using an API key sent in the x-api-key header."
      checked={apiEnabled}
      onToggle={() => onApiToggle(!apiEnabled)}
      disabled={!canEdit || busy}
    >
      {apiEnabled && (
      <div className="mt-4 bg-muted/40 rounded-lg p-4 border border-border space-y-4">
        {newKey ? (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle />
              <AlertDescription>Copy this key now. For security, you will not be able to see it again.</AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-foreground text-background rounded-md text-xs font-mono break-all">{newKey}</code>
              <Button type="button" size="icon" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
        ) : status?.exists ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-mono text-foreground">{status.keyPrefix}{'••••••••'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last used: {formatDate(status.lastUsedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={!canEdit || busy} onClick={() => setConfirmRegenerate(true)}>
                  <RefreshCw size={14} className="mr-1.5" />Regenerate
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={!canEdit || busy} onClick={handleRevoke} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 size={14} className="mr-1.5" />Revoke
                </Button>
              </div>
            </div>
            {confirmRegenerate && (
              <div className="bg-background rounded-lg p-3 border border-border space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>Regenerating will immediately invalidate the current key. Any integrations using it will stop working.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" disabled={busy} onClick={async () => { setConfirmRegenerate(false); await handleGenerate() }}>
                    {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}Yes, regenerate
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRegenerate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">No API key yet. Generate one to start using the API.</p>
            <Button type="button" size="sm" disabled={!canEdit || busy} onClick={handleGenerate}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Key size={14} className="mr-1.5" />}Generate API key
            </Button>
          </div>
        )}
      </div>
      )}
    </FeatureToggle>
  )
}

const SubToggleRow = ({ label, description, checked, onToggle, disabled }: any) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
  </div>
)

const FeaturesSettings = ({ projectData, handleToggleChange, handleApprovalSourceToggle, handleSiteApprovalToggle, handleSubmit, loading, canEdit, projectUid, accessToken, onApiToggle }: any) => {
  const approvalSettings = normalizeApprovalSettings(projectData.approvalSettings)
  return (
  <div className="space-y-4">
    <FeatureToggle
      icon={Shield}
      title="Approval board"
      description="Require admin approval before team members' interventions are registered."
      checked={projectData.approvalBoardEnabled}
      onToggle={() => handleToggleChange('approvalBoardEnabled')}
      disabled={!canEdit}
    >
      <div className="mt-4 bg-muted/40 rounded-lg p-3 border border-border">
        <p className="text-xs text-muted-foreground font-medium mb-1.5">What happens when enabled</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-start gap-1.5"><span className="text-primary">•</span><span>Interventions are submitted for review instead of being directly registered</span></li>
          <li className="flex items-start gap-1.5"><span className="text-primary">•</span><span>Admins can approve, reject, or request changes on submissions</span></li>
          <li className="flex items-start gap-1.5"><span className="text-primary">•</span><span>Team members can track their submission status in the Approvals tab</span></li>
        </ul>
      </div>

      {projectData.approvalBoardEnabled && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-foreground mb-1">Require approval for interventions from</p>
            <p className="text-xs text-muted-foreground mb-2">Only the sources you turn on here need approval. Others are published right away.</p>
            <div className="divide-y divide-border">
              <SubToggleRow
                label="Web dashboard"
                description="Interventions created in the web app"
                checked={approvalSettings.sources.web}
                onToggle={() => handleApprovalSourceToggle('web')}
                disabled={!canEdit}
              />
              <SubToggleRow
                label="Bulk upload"
                description="Interventions imported from CSV or custom formats"
                checked={approvalSettings.sources.bulk}
                onToggle={() => handleApprovalSourceToggle('bulk')}
                disabled={!canEdit}
              />
              <SubToggleRow
                label="Mobile app"
                description="Interventions and plots recorded in the TreeMapper app"
                checked={approvalSettings.sources.mobile}
                onToggle={() => handleApprovalSourceToggle('mobile')}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <SubToggleRow
              label="Require approval for sites"
              description="New sites must be approved before they appear on the map"
              checked={approvalSettings.siteApprovalRequired}
              onToggle={handleSiteApprovalToggle}
              disabled={!canEdit}
            />
          </div>
        </div>
      )}
    </FeatureToggle>

    {/* TODO: wire leaderboardEnabled to the API (add to prepareDataForApi + backend field) — currently UI-only */}
    {/* Leaderboard toggle hidden until the feature is wired up
    <FeatureToggle
      icon={Trophy}
      title="Leaderboard"
      description="Show the Forest Champions leaderboard ranking top contributors for this project."
      checked={projectData.leaderboardEnabled}
      onToggle={() => handleToggleChange('leaderboardEnabled')}
      disabled={!canEdit}
    /> */}

    {/* TODO: wire bulkUploadEnabled to the API (add to prepareDataForApi + backend field) — currently UI-only */}
    <FeatureToggle
      icon={Upload}
      title="Bulk upload"
      description="Allow team members to import interventions in bulk from CSV or custom formats."
      checked={projectData.bulkUploadEnabled}
      onToggle={() => handleToggleChange('bulkUploadEnabled')}
      disabled={!canEdit}
    />

    <ApiSettings
      projectUid={projectUid}
      accessToken={accessToken}
      canEdit={canEdit}
      apiEnabled={projectData.apiEnabled}
      onApiToggle={onApiToggle}
    />

    <SaveBar onClick={handleSubmit} loading={loading} disabled={!canEdit} />
  </div>
  )
}

// ---------- Section: Danger Zone ----------

const DangerZone = ({ projectData, showDeleteConfirm, setShowDeleteConfirm, handleDeleteProject, canEdit }: any) => {

  return (
    <div className="space-y-6">
      {/* Archive */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Archive project</h3>
            <p className="text-sm text-amber-700/90 dark:text-amber-400/90 mb-4 leading-relaxed">
              Archiving makes your project read-only. Data remains accessible for reporting, but no new entries or changes can be made. This action is reversible.
            </p>
            {/* TODO: wire archive to a project-status change (e.g. updateProjectStatusApi -> 'suspended').
                The status endpoint is workspace-scoped, so confirm a project-owner has permission (or route through workspace admin) before enabling. Disabled until then to avoid a no-op button. */}
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" disabled className="border-amber-500/50 text-amber-700/60 dark:text-amber-400/60">
                <Lock size={14} className="mr-1.5" />
                Archive project
              </Button>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-destructive mb-1">Delete project</h3>
            <p className="text-sm text-destructive/80 mb-4 leading-relaxed">
              Permanently delete this project and all associated data. This includes all trees, locations, progress reports, and collaborator assignments. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (!canEdit) { toast.error('You do not have permission to delete this project.'); return }
                  setShowDeleteConfirm(true)
                }}
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete project
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-3 border border-destructive/30">
                  <p className="text-sm font-medium text-destructive mb-1">Are you absolutely sure you want to delete "{projectData.name}"?</p>
                  <p className="text-xs text-destructive/80 mb-2">This action cannot be undone and will permanently delete all project data including:</p>
                  <ul className="text-xs text-destructive/80 space-y-0.5 ml-3">
                    <li>• All tree inventory and location data</li>
                    <li>• Progress reports and milestones</li>
                    <li>• Collaborator assignments</li>
                    <li>• Project media and documents</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="destructive" onClick={() => { handleDeleteProject(); setShowDeleteConfirm(false) }}>
                    <Trash2 size={14} className="mr-1.5" />Yes, delete forever
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- ForestCloud ----------

const ForestCloudSettings = ({ selectedProject, canEdit }: any) => {
  const enabled = useTreematchStore(state => state.enabled)
  const setEnabled = useTreematchStore(state => state.setEnabled)

  return (
    <div className="space-y-4">
      <SectionCard title="Connection" icon={Globe}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <Check size={12} /> Connected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Connected to project</div>
              <div className="text-sm font-medium text-foreground truncate mt-0.5">{selectedProject?.name || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Project ID</div>
              <div className="text-xs font-mono text-foreground break-all mt-0.5">{selectedProject?.uid || '—'}</div>
            </div>
          </div>
        </div>
      </SectionCard>

      <FeatureToggle
        icon={Link2}
        title="TreeMatch"
        description="Match planted trees to donations. Auto-enabled for workspaces with Plant-for-the-Planet projects."
        checked={enabled}
        onToggle={setEnabled}
        disabled={!canEdit}
      />
    </div>
  )
}

// ---------- Main ----------

const NAV_ITEMS = [
  { id: 'general', label: 'General settings', icon: Settings },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'features', label: 'Features', icon: Shield },
  { id: 'forestcloud', label: 'ForestCloud', icon: Globe },
  { id: 'danger', label: 'Danger zone', icon: Trash2, danger: true },
]

const ProjectSettings = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { projectUid } = useParams<{ projectUid: string }>()
  const tabParam = searchParams.get('tab')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { accessToken } = useToken()
  const selectedProject = useProjectStore(state => state.selectedProject)
  const selectedWorkspce = useProjectStore(state => state.selectedWorkspce)
  const currentUser = useUserStore(state => state.user)
  const userRole = selectedProject?.userRole

  const isPlatformWorkspace = selectedWorkspce?.slug === 'platform-projects'
  const isImpersonatingSuperAdmin = currentUser?.impersonated === true && currentUser?.type === 'superadmin'
  // Only the platform workspace OWNER (not workspace admins) may edit platform-linked projects.
  const isWorkspaceOwner = selectedWorkspce?.userRole === 'owner'
  const isProjectOwnerAdmin = ['owner', 'admin'].includes(userRole || '')

  const [projectData, setProjectData] = useState<any>({
    name: '', slug: '', type: '', ecosystem: '', scale: '', target: '', website: '', videoUrl: '',
    description: '', purpose: '', classification: '', intensity: '', revisionPeriodicity: '', country: '',
    image: null, location: null, originalGeometry: null, metadata: {}, approvalBoardEnabled: false,
    approvalSettings: DEFAULT_APPROVAL_SETTINGS,
    leaderboardEnabled: true, bulkUploadEnabled: true, apiEnabled: false, status: '',
  })

  // Platform-linked projects are read-only by default. Editing is allowed for:
  //  - a superadmin impersonating,
  //  - the platform workspace owner (any status),
  //  - the project owner/admin, but only while the project is in review.
  // Non-platform projects keep the normal project owner/admin rule.
  const isInReview = projectData.status === 'in_review'
  const canEdit = isImpersonatingSuperAdmin
    || (isPlatformWorkspace
      ? isWorkspaceOwner || (isProjectOwnerAdmin && isInReview)
      : isProjectOwnerAdmin)
  // Settings now follow a single gate, including basic info (no separate platform lock).
  const canEditBasicInfo = canEdit

  const activeTab = NAV_ITEMS.some(i => i.id === tabParam) ? tabParam! : 'general'
  const setActiveTab = (id: string) => router.push(`/project/${projectUid}/settings?tab=${id}`)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectImages, setProjectImages] = useState<any[]>([])
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    if (selectedProject?.uid) {
      fetchProjectDetails()
      fetchImages()
    }
  }, [selectedProject])

  const fetchProjectDetails = async () => {
    try {
      const result = await getSingleProjectDetails(accessToken, selectedProject?.uid || '')
      if (result.data) {
        setProjectData({
          name: result.data.name || '',
          slug: result.data.slug || '',
          type: result.data.type || '',
          ecosystem: result.data.ecosystem || '',
          scale: result.data.scale || '',
          target: result.data.target !== null && result.data.target !== undefined ? String(result.data.target) : '',
          website: result.data.website || '',
          videoUrl: result.data.videoUrl || '',
          description: result.data.description || '',
          purpose: result.data.purpose || '',
          classification: result.data.classification || '',
          intensity: result.data.intensity || '',
          revisionPeriodicity: result.data.revisionPeriodicity || '',
          country: result.data.country || '',
          image: result.data.image ?? null,
          location: result.data.location ?? null,
          originalGeometry: result.data.originalGeometry || null,
          metadata: result.data.metadata || {},
          approvalBoardEnabled: result.data.approvalBoardEnabled ?? false,
          approvalSettings: normalizeApprovalSettings(result.data.approvalSettings),
          leaderboardEnabled: result.data.leaderboardEnabled ?? true,
          bulkUploadEnabled: result.data.bulkUploadEnabled ?? true,
          apiEnabled: result.data.apiEnabled ?? false,
          status: result.data.status || '',
        })
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load project details' })
    }
  }

  const fetchImages = async () => {
    try {
      const result = await getProjectImages(accessToken, selectedProject?.uid || '')
      if (result.data) setProjectImages(result.data)
    } catch {
      // silently fail — images are non-critical
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error('You do not have permission to modify project images.')
      e.target.value = ''
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be less than 10MB'); return }

    setImageUploading(true)
    try {
      const presignResponse = await generatePreSignUrl(accessToken, { fileName: file.name, fileType: file.type, folder: 'project' })
      const presignData = presignResponse?.data?.data || presignResponse?.data
      if (!presignData?.uploadUrl) throw new Error('Failed to get upload URL')

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      const uploadResponse = await fetch(`/api/upload-image?uploadUrl=${encodeURIComponent(presignData.uploadUrl)}`, { method: 'PUT', body: uploadFormData })
      if (!uploadResponse.ok) throw new Error('Upload to storage failed')

      const saveResult = await addProjectImage(accessToken, selectedProject.uid, { filename: presignData.fileName, originalName: file.name, mimeType: file.type })
      if (saveResult.data) {
        setProjectImages(prev => [...prev, saveResult.data])
        toast.success('Image uploaded successfully')
      } else {
        throw new Error('Failed to save image record')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image')
    } finally {
      setImageUploading(false)
      e.target.value = ''
    }
  }

  const handleImageDelete = async (imageUid: string) => {
    if (!canEdit) { toast.error('You do not have permission to delete project images.'); return }
    try {
      const result = await deleteProjectImage(accessToken, selectedProject.uid, imageUid)
      if (result.statusCode === 200 || result.statusCode === 201) {
        setProjectImages(prev => prev.filter(img => img.uid !== imageUid))
        toast.success('Image deleted')
      } else {
        toast.error('Failed to delete image')
      }
    } catch {
      toast.error('Failed to delete image')
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    const data = projectData as any
    if (!data.name || !String(data.name).trim()) errors.name = 'Project name is required'
    if (!data.slug || !String(data.slug).trim()) errors.slug = 'Project slug is required'
    else if (!/^[a-z0-9-]+$/.test(String(data.slug))) errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    if (!data.type) errors.type = 'Project type is required'
    if (data.website && !/^https?:\/\/.+/.test(String(data.website))) errors.website = 'Please enter a valid URL starting with http:// or https://'
    if (data.videoUrl && !/^https?:\/\/.+/.test(String(data.videoUrl))) errors.videoUrl = 'Please enter a valid URL starting with http:// or https://'
    const targetValue = data.target
    if (targetValue !== '' && targetValue !== null && targetValue !== undefined) {
      const numTarget = typeof targetValue === 'string' ? Number(targetValue) : targetValue
      if (Number.isNaN(numTarget) || numTarget <= 0) errors.target = 'Target must be a positive number greater than 0'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setProjectData((prev: any) => ({ ...prev, [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value } }))
    } else {
      setProjectData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value }))
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined as any }))
    }
  }

  const handleToggleChange = (fieldName: string) => {
    setProjectData((prev: any) => ({ ...prev, [fieldName]: !prev[fieldName] }))
  }

  // Toggle one intervention source (web/bulk/mobile) under approvalSettings.sources
  const handleApprovalSourceToggle = (sourceKey: 'web' | 'bulk' | 'mobile') => {
    setProjectData((prev: any) => {
      const settings = normalizeApprovalSettings(prev.approvalSettings)
      return {
        ...prev,
        approvalSettings: {
          ...settings,
          sources: { ...settings.sources, [sourceKey]: !settings.sources[sourceKey] },
        },
      }
    })
  }

  // Toggle whether sites require approval
  const handleSiteApprovalToggle = () => {
    setProjectData((prev: any) => {
      const settings = normalizeApprovalSettings(prev.approvalSettings)
      return {
        ...prev,
        approvalSettings: { ...settings, siteApprovalRequired: !settings.siteApprovalRequired },
      }
    })
  }

  const handleApiToggle = async (next: boolean) => {
    if (!canEdit) { toast.error('You do not have permission to update project settings.'); return }
    setProjectData((prev: any) => ({ ...prev, apiEnabled: next }))
    const result = await updateProjectSettings(accessToken, { apiEnabled: next }, selectedProject.uid)
    if (result?.statusCode === 200 || result?.statusCode === 201) {
      toast.success(next ? 'API access enabled' : 'API access disabled')
    } else {
      setProjectData((prev: any) => ({ ...prev, apiEnabled: !next }))
      toast.error(result?.message || 'Failed to update API access')
    }
  }

  const handleLocationUpdate = async (geoData: any) => {
    if (!canEdit) { setNotification({ type: 'error', message: 'You do not have permission to update project location.' }); return }
    setLoading(true)
    try {
      await updateProjectSettings(accessToken, { originalGeometry: geoData }, selectedProject.uid)
      setProjectData((prev: any) => ({ ...prev, originalGeometry: geoData }))
      setNotification({ type: 'success', message: 'Project location updated successfully!' })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update project location'
      setNotification({ type: 'error', message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const prepareDataForApi = (data: any) => {
    const cleaned: Record<string, any> = {}
    if (data.name && data.name.trim()) cleaned.name = data.name.trim()
    if (data.slug && data.slug.trim()) cleaned.slug = data.slug.trim()
    if (data.type && data.type.trim()) cleaned.type = data.type.trim()
    if (data.description && data.description.trim()) cleaned.description = data.description.trim()
    if (data.purpose && data.purpose.trim()) cleaned.purpose = data.purpose.trim()
    if (data.classification && data.classification.trim()) cleaned.classification = data.classification.trim()
    if (data.ecosystem && data.ecosystem.trim()) cleaned.ecosystem = data.ecosystem.trim()
    if (data.scale && data.scale.trim()) cleaned.scale = data.scale.trim()
    if (data.intensity != null && data.intensity !== '') cleaned.intensity = data.intensity
    if (data.revisionPeriodicity && data.revisionPeriodicity.trim()) cleaned.revisionPeriodicity = data.revisionPeriodicity.trim()
    if (data.country && data.country.trim()) cleaned.country = data.country.trim().substring(0, 3).toUpperCase()
    if (data.website && data.website.trim()) cleaned.website = data.website.trim()
    if (data.videoUrl && data.videoUrl.trim()) cleaned.videoUrl = data.videoUrl.trim()
    if (data.image) cleaned.image = typeof data.image === 'string' ? data.image : null
    if (data.target !== '' && data.target !== null && data.target !== undefined) {
      const targetNum = typeof data.target === 'string' ? Number(data.target) : data.target
      if (!Number.isNaN(targetNum) && Number.isInteger(targetNum) && targetNum > 0) cleaned.target = targetNum
    }
    if (data.originalGeometry) cleaned.originalGeometry = data.originalGeometry
    if (typeof data.approvalBoardEnabled === 'boolean') cleaned.approvalBoardEnabled = data.approvalBoardEnabled
    if (data.approvalSettings) cleaned.approvalSettings = normalizeApprovalSettings(data.approvalSettings)
    return cleaned
  }

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault()
    if (!canEdit) { setNotification({ type: 'error', message: 'You do not have permission to update project settings.' }); return }
    if (!validateForm()) { setNotification({ type: 'error', message: 'Please fix the validation errors before saving' }); return }
    setLoading(true)
    try {
      const cleanedData = prepareDataForApi(projectData)
      await updateProjectSettings(accessToken, cleanedData, selectedProject.uid)
      setNotification({ type: 'success', message: 'Project settings updated successfully!' })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save project settings'
      setNotification({ type: 'error', message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!canEdit) { toast.error('You do not have permission to delete this project.'); return }
    const response = await deleteProject(accessToken, selectedProject.uid)
    if (response.statusCode !== 200 && response.statusCode !== 201) { toast.error('Something went wrong'); return }
    window.location.reload()
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'location':
        return <LocationSettings handleLocationUpdate={handleLocationUpdate} existingGeoJSON={projectData.originalGeometry} loading={loading} canEdit={canEdit} />
      case 'features':
        return <FeaturesSettings projectData={projectData} handleToggleChange={handleToggleChange} handleApprovalSourceToggle={handleApprovalSourceToggle} handleSiteApprovalToggle={handleSiteApprovalToggle} handleSubmit={handleSubmit} loading={loading} canEdit={canEdit} projectUid={selectedProject?.uid} accessToken={accessToken} onApiToggle={handleApiToggle} />
      case 'forestcloud':
        return <ForestCloudSettings selectedProject={selectedProject} canEdit={canEdit} />
      case 'danger':
        return <DangerZone projectData={projectData} showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm} handleDeleteProject={handleDeleteProject} canEdit={canEdit} />
      default:
        return <GeneralSettings projectData={projectData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} loading={loading} validationErrors={validationErrors} projectImages={projectImages} onImageUpload={handleImageUpload} onImageDelete={handleImageDelete} imageUploading={imageUploading} canEdit={canEditBasicInfo} />
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {notification && <NotificationToast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      {isPlatformWorkspace && !isImpersonatingSuperAdmin && !canEdit && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <Lock />
          <AlertDescription>
            This project belongs to the platform workspace, so its settings are read-only.
            {isProjectOwnerAdmin
              ? ' You can edit them only while the project is in review.'
              : ' Only the platform workspace owner can change them.'}
          </AlertDescription>
        </Alert>
      )}

      {isPlatformWorkspace && !isImpersonatingSuperAdmin && canEdit && isProjectOwnerAdmin && !isWorkspaceOwner && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertCircle />
          <AlertDescription>
            This project is in review, so you can edit its settings. Once it leaves review, these settings become read-only.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Secondary nav */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id
              return (
                <Button
                  key={item.id}
                  variant={isActive ? (item.danger ? 'destructive' : 'secondary') : 'ghost'}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'justify-start flex-shrink-0',
                    !isActive && item.danger && 'text-destructive hover:text-destructive hover:bg-destructive/10',
                  )}
                >
                  <item.icon size={14} className="mr-2" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default ProjectSettings
