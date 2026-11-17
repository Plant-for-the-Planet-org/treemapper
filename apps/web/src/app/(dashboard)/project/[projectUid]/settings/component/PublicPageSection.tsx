'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Globe,
  ImageIcon,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  Users,
} from 'lucide-react'
import { getPublicPageSettings, updatePublicPageSettings } from '@shared-core/fetchApi/api.fetch'
import { toast } from 'react-toastify'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cdnUrl } from '@/lib/cdn'
import { cn } from '@/lib/utils'
import { THEMES } from '@/components/public-page/themes'
import { isPublicPageImage } from '@/components/public-page/types'
import type { PublicPageTheme } from '@/components/public-page/types'
import {
  PUBLIC_PAGE_IMAGE_ACCEPT,
  uploadPublicPageImage,
} from '@/components/public-page/uploadImage'

/**
 * Public page settings for a project.
 *
 * The only place a project's work can be put on a public URL, so the
 * consequential action is deliberately slower than the cosmetic ones: theme
 * and contributor names save as soon as they change, while switching the page
 * on asks for confirmation and spells out what becomes visible.
 *
 * Theme descriptions come from `THEMES` rather than being written again here,
 * so the picker cannot drift from what the themes actually render.
 */

interface Settings {
  enabled: boolean
  theme: PublicPageTheme
  geoDetail: string
  showContributorNames: boolean
  /** A cover chosen for the public page. Null means pick one automatically. */
  coverImage: string | null
}

const DEFAULTS: Settings = {
  enabled: false,
  theme: 'full',
  geoDetail: 'site',
  showContributorNames: false,
  coverImage: null,
}

export const PublicPageSection = ({
  accessToken,
  projectUid,
  projectSlug,
  canEdit,
}: {
  accessToken: string
  projectUid: string
  /** Falls back to the uid, which the public route also resolves. */
  projectSlug?: string | null
  canEdit: boolean
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [copied, setCopied] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)

  const slug = projectSlug || projectUid
  const path = `/p/${slug}`
  const publicUrl = typeof window === 'undefined' ? path : `${window.location.origin}${path}`

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!projectUid || !accessToken) return
      try {
        const result = await getPublicPageSettings(accessToken, projectUid)
        if (active && result?.data) setSettings({ ...DEFAULTS, ...result.data })
      } catch {
        if (active) toast.error('Could not load the public page settings.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [accessToken, projectUid])

  const save = useCallback(
    async (changes: Partial<Settings>, successMessage: string) => {
      if (!canEdit) {
        toast.error('Only a project owner or admin can change this.')
        return
      }
      const previous = settings
      // Optimistic, because a toggle that lags behind the pointer reads as
      // broken. Rolled back on failure so the switch never lies about what
      // is published.
      setSettings((current) => ({ ...current, ...changes }))
      setSaving(true)
      try {
        const result = await updatePublicPageSettings(accessToken, projectUid, changes)
        if (result?.statusCode !== 200) throw new Error(result?.message || 'Request failed')
        if (result.data) setSettings({ ...DEFAULTS, ...result.data })
        toast.success(successMessage)
        // The public URL is served from a static cache. Ask Next to rebuild it
        // now, so a page that was just switched on (or off, or re-themed) shows
        // the change immediately instead of on the next timed revalidation.
        // Fire-and-forget: the save already succeeded, and the timer is the
        // fallback if this call is lost.
        void fetch('/api/public-page/revalidate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, uid: projectUid }),
        }).catch(() => undefined)
      } catch {
        setSettings(previous)
        toast.error('Could not save. Nothing was changed.')
      } finally {
        setSaving(false)
      }
    },
    [accessToken, canEdit, projectUid, settings, slug],
  )

  // Uploads first, then saves the filename as one settings change, so the
  // cover only changes once the file is actually in storage.
  const chooseCover = async (file: File | undefined) => {
    if (!file) return
    setCoverUploading(true)
    try {
      const filename = await uploadPublicPageImage(accessToken, file)
      await save({ coverImage: filename }, 'Cover image updated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The upload failed. Try again.')
    } finally {
      setCoverUploading(false)
      if (coverInput.current) coverInput.current.value = ''
    }
  }

  const coverUrl = isPublicPageImage(settings.coverImage)
    ? cdnUrl('project', settings.coverImage)
    : null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. The link is shown above.')
    }
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border">
          <Globe size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Public page</h3>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Publish a public page</Label>
              <p className="text-xs text-muted-foreground max-w-[60ch]">
                Anyone with the link can see this project&apos;s totals, species, survival rates,
                site boundaries and field photos. Search engines can index it.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              disabled={!canEdit || saving}
              onCheckedChange={(next) => {
                if (next) {
                  setConfirmPublish(true)
                  return
                }
                setConfirmPublish(false)
                save({ enabled: false }, 'Public page taken down.')
              }}
            />
          </div>

          {confirmPublish && !settings.enabled ? (
            <Alert>
              <AlertTriangle size={14} />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground">Before you publish</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Only approved records appear. Pending and rejected ones stay hidden.</li>
                      <li>Site boundaries are shown. Individual tree positions are never published.</li>
                      <li>Survival is shown honestly, including trees that did not make it.</li>
                      <li>Contributors appear as initials unless you turn names on below.</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        setConfirmPublish(false)
                        save({ enabled: true }, 'Public page is live.')
                      }}
                    >
                      {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                      Publish the page
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmPublish(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {settings.enabled ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Check size={13} className="text-primary" />
                This page is live
              </div>
              <code className="block truncate text-sm">{publicUrl}</code>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy size={13} className="mr-1.5" />
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} className="mr-1.5" />
                    Open page
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`${path}/sites.geojson`} target="_blank" rel="noopener noreferrer">
                    Site boundaries
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border">
          <ImageIcon size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cover image</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 sm:w-48">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
                <img src={coverUrl} alt="Current cover" className="h-full w-full object-cover" />
              ) : (
                <span className="px-3 text-center text-xs text-muted-foreground">
                  Picked automatically
                </span>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground max-w-[60ch]">
                The large photo at the top of the page. Without one, the page uses the project
                photo, then the newest image under Project images. JPG, PNG, WebP or GIF, up to
                10 MB. A wide landscape photo works best.
              </p>
              <input
                ref={coverInput}
                type="file"
                accept={PUBLIC_PAGE_IMAGE_ACCEPT}
                className="sr-only"
                onChange={(event) => chooseCover(event.target.files?.[0])}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canEdit || saving || coverUploading}
                  onClick={() => coverInput.current?.click()}
                >
                  {coverUploading ? (
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                  ) : (
                    <ImagePlus size={13} className="mr-1.5" />
                  )}
                  {coverUploading ? 'Uploading' : coverUrl ? 'Replace cover' : 'Upload a cover'}
                </Button>
                {coverUrl ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canEdit || saving || coverUploading}
                    onClick={() => save({ coverImage: null }, 'Back to the automatic cover.')}
                  >
                    Use automatic cover
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Theme</h3>
          <span className="text-xs text-muted-foreground">
            Same data, four ways of presenting it
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.values(THEMES).map((theme) => {
              const active = settings.theme === theme.id
              return (
                // The chooser and the preview link are siblings, not nested.
                // An anchor inside a button is invalid HTML and leaves the
                // keyboard with two overlapping targets.
                <div
                  key={theme.id}
                  className={cn(
                    'rounded-xl border transition-colors',
                    active ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    disabled={!canEdit || saving || active}
                    onClick={() => save({ theme: theme.id }, `Theme set to ${theme.label}.`)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-t-xl p-4 text-left',
                      !active && canEdit && !saving && 'hover:bg-muted/50',
                      (!canEdit || saving) && !active && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{theme.label}</span>
                      {active ? (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Check size={14} />
                          In use
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {theme.description}
                    </span>
                  </button>
                  <div className="border-t border-border px-4 py-2.5">
                    <a
                      href={`/preview/${projectUid}/${theme.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Preview and arrange
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Previews work whether or not the page is live. They are only visible to this
            project&apos;s owners and admins, and are never indexed.
          </p>

          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-4">
            <Layers size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Arrange the blocks yourself</p>
              <p>
                Open a preview and choose &quot;Arrange blocks&quot;. You can reorder what is on
                the page, drop blocks you do not want, add ones the theme leaves out, write
                your own text and add your own images. Each theme keeps its own arrangement, and
                a theme you never touch keeps following its default.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-border">
          <Users size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">People and privacy</h3>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Name the contributors</Label>
              <p className="text-xs text-muted-foreground max-w-[60ch]">
                Off by default. Joining a project is not consent to appear on a public page, so ask
                your team first. Members who marked their profile private are left out either way.
              </p>
            </div>
            <Switch
              checked={settings.showContributorNames}
              disabled={!canEdit || saving}
              onCheckedChange={(next) =>
                save(
                  { showContributorNames: next },
                  next ? 'Contributor names are shown.' : 'Contributors show as initials.',
                )
              }
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-4">
            <Lock size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Tree locations are never published</p>
              <p>
                The map shows site boundaries only. Exact tree positions stay in the dashboard,
                where they cannot be used to find valuable trees or identify a landholding.
              </p>
            </div>
          </div>

          {!canEdit ? (
            <Alert>
              <Lock size={14} />
              <AlertDescription>
                Only a project owner or admin can change these settings.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

export default PublicPageSection
