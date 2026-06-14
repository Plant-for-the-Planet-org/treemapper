'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Form } from '@/forms/types'
import { deleteForm } from '@/forms/storage'
import { useToken } from '@/context/useTokenContext'
import { toast } from 'react-toastify'
import { FileText, MoreVertical, Pencil, Trash2, Globe, FileEdit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FormCardProps {
  form: Form
  onDeleted: () => void
}

export default function FormCard({ form, onDeleted }: FormCardProps) {
  const router = useRouter()
  const params = useParams()
  const projectUid = params.projectUid as string
  const { accessToken } = useToken()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalFields = form.sections.reduce((acc, s) => acc + s.fields.length, 0)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteForm(accessToken, projectUid, form.id)
      setShowDeleteDialog(false)
      onDeleted()
    } catch {
      toast.error('Could not delete the form. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group relative"
        onClick={() => router.push(`/project/${projectUid}/forms/${form.id}`)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{form.name}</h3>
              {form.description && (
                <p className="text-sm text-gray-500 truncate mt-0.5">{form.description}</p>
              )}
            </div>
          </div>

          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(v => !v)}
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => { setShowMenu(false); router.push(`/project/${projectUid}/forms/${form.id}`) }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { setShowMenu(false); setShowDeleteDialog(true) }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Badge
            variant="secondary"
            className={`text-xs ${form.status === 'published'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
          >
            {form.status === 'published' ? (
              <><Globe className="w-3 h-3 mr-1" />Published</>
            ) : (
              <><FileEdit className="w-3 h-3 mr-1" />Draft</>
            )}
          </Badge>
          <span className="text-xs text-gray-400">
            {form.sections.length} {form.sections.length === 1 ? 'section' : 'sections'} · {totalFields} {totalFields === 1 ? 'field' : 'fields'}
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Updated {new Date(form.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete form?</DialogTitle>
            <DialogDescription>
              &quot;{form.name}&quot; will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
