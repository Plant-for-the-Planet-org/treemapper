'use client'

import React from 'react'
import {
  RefreshCw, ClipboardCheck, ArrowUpCircle, BellRing, AlertTriangle, Send, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NotificationTemplate, TemplateCategory } from './mockData'

const CATEGORY_META: Record<TemplateCategory, { label: string; icon: React.ElementType; cls: string }> = {
  sync: { label: 'Sync', icon: RefreshCw, cls: 'text-green-700 bg-green-50' },
  monitoring: { label: 'Monitoring', icon: ClipboardCheck, cls: 'text-teal-700 bg-teal-50' },
  update: { label: 'Update', icon: ArrowUpCircle, cls: 'text-blue-700 bg-blue-50' },
  reminder: { label: 'Reminder', icon: BellRing, cls: 'text-purple-700 bg-purple-50' },
  alert: { label: 'Alert', icon: AlertTriangle, cls: 'text-amber-700 bg-amber-50' },
}

interface Props {
  templates: NotificationTemplate[]
  onUse: (template: NotificationTemplate) => void
}

const TemplatesView = ({ templates, onUse }: Props) => (
  <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        Reusable messages your team can send in one tap. Pick one to pre-fill a notification.
      </p>
      <Button size="sm" variant="outline" disabled className="flex-shrink-0">
        <Plus size={14} className="mr-1.5" /> New template
      </Button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-2">
      {templates.map(t => {
        const meta = CATEGORY_META[t.category]
        const Icon = meta.icon
        return (
          <div
            key={t.uid}
            className="group rounded-xl border border-border bg-card p-4 flex flex-col hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium', meta.cls)}>
                <Icon size={12} />
                {meta.label}
              </span>
              <Badge variant="secondary" className="text-[10px]">{t.usageCount} sent</Badge>
            </div>
            <p className="text-sm font-semibold text-gray-900">{t.title}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-3 flex-1">{t.message}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUse(t)}
              className="mt-3 w-full group-hover:border-[#007A49] group-hover:text-[#007A49]"
            >
              <Send size={13} className="mr-1.5" /> Use template
            </Button>
          </div>
        )
      })}
    </div>
  </div>
)

export default TemplatesView
