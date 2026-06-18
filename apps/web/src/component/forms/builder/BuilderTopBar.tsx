'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useBuilder } from '@/forms/FormBuilderContext'
import { createForm, updateForm } from '@/forms/storage'
import { useToken } from '@/context/useTokenContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, EyeOff, Save, Globe, FileEdit, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

export default function BuilderTopBar() {
  const router = useRouter()
  const params = useParams()
  const projectUid = params.projectUid as string
  const formId = params.formId as string
  const { accessToken } = useToken()
  const { state, dispatch } = useBuilder()
  const { form, showPreview, isDirty } = state
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  // Whether this form already exists on the server. A `/new` route is unsaved
  // until the first create; after that we PATCH. The form's local uuid is never
  // sent, so the create path and update path are kept distinct.
  const [savedId, setSavedId] = useState<string | null>(formId === 'new' ? null : formId)

  // Persist the given form, mark the builder clean, and on the first save of a
  // new form swap the temporary `/new` URL for the real server id.
  const persist = async (next = form) => {
    if (!savedId) {
      const created = await createForm(accessToken, projectUid, next)
      setSavedId(created.id)
      dispatch({ type: 'MARK_SAVED' })
      router.replace(`/project/${projectUid}/forms/${created.id}`)
      return created
    }
    const saved = await updateForm(accessToken, projectUid, { ...next, id: savedId })
    dispatch({ type: 'MARK_SAVED' })
    return saved
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await persist()
      toast.success('Form saved')
    } catch {
      toast.error('Could not save the form. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const newStatus = form.status === 'published' ? 'draft' : 'published'
    dispatch({ type: 'UPDATE_META', payload: { status: newStatus } })
    try {
      await persist({ ...form, status: newStatus })
      toast.success(newStatus === 'published' ? 'Form published' : 'Form moved to draft')
    } catch {
      toast.error('Could not update the form. Please try again.')
    }
  }

  return (
    <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4 flex-shrink-0">
      <button
        onClick={() => router.push(`/project/${projectUid}/forms`)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Forms</span>
      </button>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex-1 min-w-0">
        {editingName ? (
          <Input
            autoFocus
            value={form.name}
            onChange={e => dispatch({ type: 'UPDATE_META', payload: { name: e.target.value } })}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false) }}
            className="h-8 text-sm font-semibold max-w-xs border-gray-300"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors truncate max-w-xs"
          >
            {form.name || 'Untitled Form'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          className={`text-xs cursor-default ${form.status === 'published'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
        >
          {form.status === 'published' ? (
            <><Globe className="w-3 h-3 mr-1" />Published</>
          ) : (
            <><FileEdit className="w-3 h-3 mr-1" />Draft</>
          )}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          className={`gap-1.5 text-sm ${showPreview ? 'bg-gray-100' : ''}`}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="gap-1.5 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>

        <Button
          size="sm"
          onClick={handlePublish}
          className={`gap-1.5 text-sm ${form.status === 'published'
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-green-600 hover:bg-green-700'
            } text-white`}
        >
          <Globe className="w-4 h-4" />
          {form.status === 'published' ? 'Unpublish' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
