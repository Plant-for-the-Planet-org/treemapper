'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Form, FormSection, FormField, FieldType, ConditionalRule, FieldOption } from './types'
import { createDefaultField, createDefaultSection } from './defaults'
import { arrayMove } from '@dnd-kit/sortable'

interface BuilderState {
  form: Form
  selectedFieldId: string | null
  selectedSectionId: string | null
  showPreview: boolean
  isDirty: boolean
  activeTab: 'properties' | 'conditions'
}

type Action =
  | { type: 'SET_FORM'; form: Form }
  | { type: 'UPDATE_META'; payload: Partial<Pick<Form, 'name' | 'description' | 'status'>> }
  | { type: 'ADD_SECTION' }
  | { type: 'UPDATE_SECTION'; sectionId: string; payload: Partial<Pick<FormSection, 'title' | 'description' | 'collapsed'>> }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'REORDER_SECTIONS'; activeId: string; overId: string }
  | { type: 'ADD_FIELD'; sectionId: string; fieldType: FieldType; atIndex?: number }
  | { type: 'UPDATE_FIELD'; sectionId: string; fieldId: string; payload: Partial<FormField> }
  | { type: 'REMOVE_FIELD'; sectionId: string; fieldId: string }
  | { type: 'REORDER_FIELDS'; sectionId: string; activeId: string; overId: string }
  | { type: 'MOVE_FIELD'; fromSectionId: string; toSectionId: string; fieldId: string; toIndex: number }
  | { type: 'ADD_OPTION'; sectionId: string; fieldId: string }
  | { type: 'UPDATE_OPTION'; sectionId: string; fieldId: string; optionId: string; label: string }
  | { type: 'REMOVE_OPTION'; sectionId: string; fieldId: string; optionId: string }
  | { type: 'REORDER_OPTIONS'; sectionId: string; fieldId: string; options: FieldOption[] }
  | { type: 'ADD_CONDITION'; sectionId: string; fieldId: string }
  | { type: 'UPDATE_CONDITION'; sectionId: string; fieldId: string; conditionId: string; payload: Partial<ConditionalRule> }
  | { type: 'REMOVE_CONDITION'; sectionId: string; fieldId: string; conditionId: string }
  | { type: 'SELECT_FIELD'; fieldId: string | null; sectionId: string | null }
  | { type: 'SET_ACTIVE_TAB'; tab: 'properties' | 'conditions' }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'MARK_SAVED' }

function findSectionIndex(sections: FormSection[], sectionId: string) {
  return sections.findIndex(s => s.id === sectionId)
}

function updateFieldInSection(section: FormSection, fieldId: string, payload: Partial<FormField>): FormSection {
  return {
    ...section,
    fields: section.fields.map(f => f.id === fieldId ? { ...f, ...payload } : f),
  }
}

function reducer(state: BuilderState, action: Action): BuilderState {
  const dirty = (form: Form): BuilderState => ({ ...state, form, isDirty: true })

  switch (action.type) {
    case 'SET_FORM':
      return { ...state, form: action.form, isDirty: false }

    case 'UPDATE_META':
      return dirty({ ...state.form, ...action.payload })

    case 'ADD_SECTION': {
      const newSection = createDefaultSection(state.form.sections.length)
      return dirty({ ...state.form, sections: [...state.form.sections, newSection] })
    }

    case 'UPDATE_SECTION': {
      const sections = state.form.sections.map(s =>
        s.id === action.sectionId ? { ...s, ...action.payload } : s
      )
      return dirty({ ...state.form, sections })
    }

    case 'REMOVE_SECTION': {
      const sections = state.form.sections.filter(s => s.id !== action.sectionId)
      const newSelected =
        state.selectedSectionId === action.sectionId
          ? { selectedSectionId: null, selectedFieldId: null }
          : {}
      return { ...dirty({ ...state.form, sections }), ...newSelected }
    }

    case 'REORDER_SECTIONS': {
      const ids = state.form.sections.map(s => s.id)
      const oldIdx = ids.indexOf(action.activeId)
      const newIdx = ids.indexOf(action.overId)
      if (oldIdx === -1 || newIdx === -1) return state
      return dirty({ ...state.form, sections: arrayMove(state.form.sections, oldIdx, newIdx) })
    }

    case 'ADD_FIELD': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const newField = createDefaultField(action.fieldType)
      const sections = [...state.form.sections]
      const fields = [...sections[sIdx].fields]
      if (action.atIndex !== undefined) {
        fields.splice(action.atIndex, 0, newField)
      } else {
        fields.push(newField)
      }
      sections[sIdx] = { ...sections[sIdx], fields }
      return {
        ...dirty({ ...state.form, sections }),
        selectedFieldId: newField.id,
        selectedSectionId: action.sectionId,
        activeTab: 'properties',
      }
    }

    case 'UPDATE_FIELD': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, action.payload)
      return dirty({ ...state.form, sections })
    }

    case 'REMOVE_FIELD': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      sections[sIdx] = { ...sections[sIdx], fields: sections[sIdx].fields.filter(f => f.id !== action.fieldId) }
      const newSelected =
        state.selectedFieldId === action.fieldId
          ? { selectedFieldId: null, selectedSectionId: null }
          : {}
      return { ...dirty({ ...state.form, sections }), ...newSelected }
    }

    case 'REORDER_FIELDS': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const fields = state.form.sections[sIdx].fields
      const oldIdx = fields.findIndex(f => f.id === action.activeId)
      const newIdx = fields.findIndex(f => f.id === action.overId)
      if (oldIdx === -1 || newIdx === -1) return state
      const sections = [...state.form.sections]
      sections[sIdx] = { ...sections[sIdx], fields: arrayMove(fields, oldIdx, newIdx) }
      return dirty({ ...state.form, sections })
    }

    case 'MOVE_FIELD': {
      const fromIdx = findSectionIndex(state.form.sections, action.fromSectionId)
      const toIdx = findSectionIndex(state.form.sections, action.toSectionId)
      if (fromIdx === -1 || toIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[fromIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      const fromFields = sections[fromIdx].fields.filter(f => f.id !== action.fieldId)
      const toFields = [...sections[toIdx].fields]
      toFields.splice(action.toIndex, 0, field)
      sections[fromIdx] = { ...sections[fromIdx], fields: fromFields }
      sections[toIdx] = { ...sections[toIdx], fields: toFields }
      return dirty({ ...state.form, sections })
    }

    case 'ADD_OPTION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      const newOption: FieldOption = {
        id: uuidv4(),
        label: `Option ${field.options.length + 1}`,
        value: `option_${field.options.length + 1}`,
      }
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        options: [...field.options, newOption],
      })
      return dirty({ ...state.form, sections })
    }

    case 'UPDATE_OPTION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        options: field.options.map(o =>
          o.id === action.optionId ? { ...o, label: action.label, value: action.label.toLowerCase().replace(/\s+/g, '_') } : o
        ),
      })
      return dirty({ ...state.form, sections })
    }

    case 'REMOVE_OPTION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        options: field.options.filter(o => o.id !== action.optionId),
      })
      return dirty({ ...state.form, sections })
    }

    case 'REORDER_OPTIONS': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        options: action.options,
      })
      return dirty({ ...state.form, sections })
    }

    case 'ADD_CONDITION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      const newCondition: ConditionalRule = {
        id: uuidv4(),
        targetFieldId: '',
        operator: 'equals',
        value: '',
        action: 'show',
      }
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        conditions: [...field.conditions, newCondition],
      })
      return dirty({ ...state.form, sections })
    }

    case 'UPDATE_CONDITION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        conditions: field.conditions.map(c =>
          c.id === action.conditionId ? { ...c, ...action.payload } : c
        ),
      })
      return dirty({ ...state.form, sections })
    }

    case 'REMOVE_CONDITION': {
      const sIdx = findSectionIndex(state.form.sections, action.sectionId)
      if (sIdx === -1) return state
      const sections = [...state.form.sections]
      const field = sections[sIdx].fields.find(f => f.id === action.fieldId)
      if (!field) return state
      sections[sIdx] = updateFieldInSection(sections[sIdx], action.fieldId, {
        conditions: field.conditions.filter(c => c.id !== action.conditionId),
      })
      return dirty({ ...state.form, sections })
    }

    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.fieldId, selectedSectionId: action.sectionId }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }

    case 'TOGGLE_PREVIEW':
      return { ...state, showPreview: !state.showPreview }

    case 'MARK_SAVED':
      return { ...state, isDirty: false }

    default:
      return state
  }
}

interface BuilderContextValue {
  state: BuilderState
  dispatch: React.Dispatch<Action>
  selectedField: FormField | null
  allFields: Array<FormField & { sectionId: string; sectionTitle: string }>
}

const BuilderContext = createContext<BuilderContextValue | null>(null)

export function FormBuilderProvider({ form, children }: { form: Form; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    form,
    selectedFieldId: null,
    selectedSectionId: null,
    showPreview: false,
    isDirty: false,
    activeTab: 'properties',
  })

  const selectedField = React.useMemo(() => {
    if (!state.selectedFieldId || !state.selectedSectionId) return null
    const section = state.form.sections.find(s => s.id === state.selectedSectionId)
    return section?.fields.find(f => f.id === state.selectedFieldId) ?? null
  }, [state.selectedFieldId, state.selectedSectionId, state.form.sections])

  const allFields = React.useMemo(() =>
    state.form.sections.flatMap(s =>
      s.fields.map(f => ({ ...f, sectionId: s.id, sectionTitle: s.title }))
    ), [state.form.sections])

  return (
    <BuilderContext.Provider value={{ state, dispatch, selectedField, allFields }}>
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilder() {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilder must be used inside FormBuilderProvider')
  return ctx
}
