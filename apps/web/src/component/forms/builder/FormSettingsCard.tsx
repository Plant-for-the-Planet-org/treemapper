'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useBuilder } from '@/forms/FormBuilderContext'
import { useToken } from '@/context/useTokenContext'
import { getUserProjectSites } from '@shared-core/fetchApi/api.fetch'
import { INTERVENTION_TYPE_OPTIONS } from '@/forms/constants'
import { SiteAssignment, InterventionAssignment } from '@/forms/types'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MapPin, Sprout, Loader2, ChevronDown } from 'lucide-react'

interface ProjectSite {
  uid: string
  name: string
}

/**
 * Form-level targeting: which sites and which intervention types this form is
 * shown for after an intervention is planted. Lives at the top of the canvas
 * next to the form description because it describes the whole form, not a field.
 */
export default function FormSettingsCard() {
  const params = useParams()
  const projectUid = params.projectUid as string
  const { state, dispatch } = useBuilder()
  const { form } = state
  const { accessToken } = useToken()

  const [sites, setSites] = useState<ProjectSite[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [open, setOpen] = useState(false)
  // Track whether we've already fetched so we don't refetch. Kept in a ref
  // (not state/deps) so toggling loadingSites can't re-trigger this effect and
  // cancel its own in-flight request.
  const fetchedRef = useRef(false)

  // Sites are only needed when the user targets specific ones; fetch lazily the
  // first time "Specific sites" is chosen, then keep them.
  useEffect(() => {
    if (form.siteAssignment !== 'specific' || fetchedRef.current) return
    if (!accessToken || !projectUid) return

    let cancelled = false
    fetchedRef.current = true
    setLoadingSites(true)
    getUserProjectSites(accessToken, projectUid)
      .then(res => {
        if (cancelled) return
        const data = Array.isArray(res?.data) ? res.data : []
        setSites(data.map((s: any) => ({ uid: s.uid, name: s.name })))
      })
      .catch(() => {
        // Allow a retry on the next switch back to "specific".
        if (!cancelled) fetchedRef.current = false
      })
      .finally(() => { if (!cancelled) setLoadingSites(false) })

    return () => { cancelled = true }
  }, [form.siteAssignment, accessToken, projectUid])

  const setSiteAssignment = (value: SiteAssignment) =>
    dispatch({
      type: 'UPDATE_META',
      // Drop the specific list whenever we leave "specific" so a later switch
      // back starts clean and we never persist stale targets.
      payload: { siteAssignment: value, ...(value === 'specific' ? {} : { siteIds: [] }) },
    })

  const toggleSite = (uid: string) => {
    const next = form.siteIds.includes(uid)
      ? form.siteIds.filter(id => id !== uid)
      : [...form.siteIds, uid]
    dispatch({ type: 'UPDATE_META', payload: { siteIds: next } })
  }

  const setInterventionAssignment = (value: InterventionAssignment) =>
    dispatch({
      type: 'UPDATE_META',
      payload: { interventionAssignment: value, ...(value === 'specific' ? {} : { interventionTypes: [] }) },
    })

  const toggleType = (value: string) => {
    const next = form.interventionTypes.includes(value)
      ? form.interventionTypes.filter(t => t !== value)
      : [...form.interventionTypes, value]
    dispatch({ type: 'UPDATE_META', payload: { interventionTypes: next } })
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-y border-gray-100"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 py-3 text-left group">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Where this form appears</h3>
          {!open && (
            <span className="text-xs text-gray-400 truncate hidden sm:inline">
              Shown after an intervention is planted
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="pb-4">
      <p className="text-xs text-gray-400 mb-3">
        Shown on the last screen after an intervention is planted, when both rules match.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Site targeting */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5" /> Sites
          </Label>
          <Select value={form.siteAssignment} onValueChange={v => setSiteAssignment(v as SiteAssignment)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              <SelectItem value="none">No site (site-less interventions)</SelectItem>
              <SelectItem value="specific">Specific sites</SelectItem>
            </SelectContent>
          </Select>

          {form.siteAssignment === 'specific' && (
            <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto p-1">
              {loadingSites ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 px-2 py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading sites...
                </div>
              ) : sites.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-3">No sites in this project yet.</p>
              ) : (
                sites.map(site => (
                  <label
                    key={site.uid}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.siteIds.includes(site.uid)}
                      onCheckedChange={() => toggleSite(site.uid)}
                    />
                    <span className="text-sm text-gray-700 truncate">{site.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Intervention targeting */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs text-gray-600">
            <Sprout className="w-3.5 h-3.5" /> Intervention types
          </Label>
          <Select
            value={form.interventionAssignment}
            onValueChange={v => setInterventionAssignment(v as InterventionAssignment)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interventions</SelectItem>
              <SelectItem value="specific">Specific types</SelectItem>
            </SelectContent>
          </Select>

          {form.interventionAssignment === 'specific' && (
            <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto p-1">
              {INTERVENTION_TYPE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={form.interventionTypes.includes(opt.value)}
                    onCheckedChange={() => toggleType(opt.value)}
                  />
                  <span className="text-sm text-gray-700 truncate">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
