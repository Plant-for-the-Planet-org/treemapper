'use client'

import React from 'react'
import { useBuilder } from '@/forms/FormBuilderContext'
import { ConditionalRule, ConditionOperator } from '@/forms/types'
import { CONDITION_OPERATORS } from '@/forms/constants'
import { Plus, Trash2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface ConditionalLogicPanelProps {
  fieldId: string
  sectionId: string
  conditions: ConditionalRule[]
}

export default function ConditionalLogicPanel({ fieldId, sectionId, conditions }: ConditionalLogicPanelProps) {
  const { dispatch, allFields, state } = useBuilder()

  // All fields except the current one (can trigger conditions on others)
  const otherFields = allFields.filter(f => f.id !== fieldId)

  const update = (conditionId: string, payload: Partial<ConditionalRule>) => {
    dispatch({ type: 'UPDATE_CONDITION', sectionId, fieldId, conditionId, payload })
  }

  const needsValue = (op: ConditionOperator) => op !== 'is_empty' && op !== 'is_not_empty'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <GitBranch className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p>Show or hide this field based on values from other fields.</p>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          No conditions yet. Add one below.
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, idx) => (
            <div key={condition.id} className="border border-gray-200 rounded-lg p-3 space-y-2.5 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {idx === 0 ? 'If' : 'And if'}
                </span>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_CONDITION', sectionId, fieldId, conditionId: condition.id })}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action: show/hide */}
              <Select
                value={condition.action}
                onValueChange={val => update(condition.id, { action: val as 'show' | 'hide' })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show this field</SelectItem>
                  <SelectItem value="hide">Hide this field</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-xs font-medium text-gray-500">when</div>

              {/* Target field */}
              <Select
                value={condition.targetFieldId}
                onValueChange={val => update(condition.id, { targetFieldId: val })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select a field..." />
                </SelectTrigger>
                <SelectContent>
                  {otherFields.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="text-gray-400 text-xs mr-1">[{f.sectionTitle}]</span>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator */}
              <Select
                value={condition.operator}
                onValueChange={val => update(condition.id, { operator: val as ConditionOperator })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map(op => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value */}
              {needsValue(condition.operator) && (
                <Input
                  placeholder="Value..."
                  value={condition.value}
                  onChange={e => update(condition.id, { value: e.target.value })}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-sm border-dashed"
        onClick={() => dispatch({ type: 'ADD_CONDITION', sectionId, fieldId })}
      >
        <Plus className="w-3.5 h-3.5" /> Add Condition
      </Button>
    </div>
  )
}
