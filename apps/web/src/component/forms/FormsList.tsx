'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForms } from '@/forms/useFormsData'
import FormCard from './FormCard'
import Spinner from '@/component/Spinner'
import { Plus, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FormsListProps {
  projectId: string
  projectName: string
}

export default function FormsList({ projectId, projectName }: FormsListProps) {
  const router = useRouter()
  const { forms, loading, error, refetch } = useForms(projectId)
  const [search, setSearch] = useState('')

  const filtered = forms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Forms</h1>
          <p className="text-gray-500">Custom data collection forms for {projectName}</p>
        </div>
        <Button
          onClick={() => router.push(`/project/${projectId}/forms/new`)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white"
        >
          <Plus className="w-4 h-4" />
          New Form
        </Button>
      </div>

      {!loading && !error && forms.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search forms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No forms yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            Create custom forms to collect data from your mobile app users in the field.
          </p>
          <Button
            onClick={() => router.push(`/project/${projectId}/forms/new`)}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4" />
            Create your first form
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No forms match &quot;{search}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(form => (
            <FormCard key={form.id} form={form} onDeleted={refetch} />
          ))}
        </div>
      )}
    </div>
  )
}
