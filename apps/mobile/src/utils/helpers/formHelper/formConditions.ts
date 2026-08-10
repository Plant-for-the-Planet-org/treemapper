import {
  ConditionalRule,
  FormField,
  FormSection,
  FormValues,
  ServerForm,
} from 'src/types/interface/projectForm.interface'

// Evaluates a single conditional rule against the current field values.
const evalRule = (rule: ConditionalRule, values: FormValues): boolean => {
  const raw = values[rule.targetFieldId]
  const v = raw == null ? '' : String(raw)
  const target = rule.value == null ? '' : String(rule.value)
  switch (rule.operator) {
    case 'equals':
      return v === target
    case 'not_equals':
      return v !== target
    case 'contains':
      return v.includes(target)
    case 'greater_than':
      return Number(v) > Number(target)
    case 'less_than':
      return Number(v) < Number(target)
    case 'is_empty':
      return v === ''
    case 'is_not_empty':
      return v !== ''
    default:
      return false
  }
}

// Returns whether a field should be visible given the current values.
// Semantics: every `show` rule must match (AND); any matching `hide` rule wins.
// A field with no conditions is always visible.
export const evaluateFieldVisibility = (
  field: FormField,
  values: FormValues,
): boolean => {
  if (!field.conditions || field.conditions.length === 0) return true
  let visible = true
  for (const rule of field.conditions) {
    const matched = evalRule(rule, values)
    if (rule.action === 'show') visible = visible && matched
    if (rule.action === 'hide' && matched) visible = false
  }
  return visible
}

// Parses a cached ProjectForm.sections string into FormSection[]. Safe on bad data.
export const parseFormSections = (sections: string): FormSection[] => {
  if (!sections) return []
  try {
    const parsed = JSON.parse(sections)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

// Flattens a form's sections into a single ordered list of fields.
export const getAllFields = (sections: FormSection[]): FormField[] => {
  const all: FormField[] = []
  sections.forEach((section) => {
    ;(section.fields || []).forEach((field) => all.push(field))
  })
  return all
}

// Decides whether a cached form targets a given intervention.
// Site rule: 'all' -> any; 'none' -> intervention has no site; 'specific' ->
// the site must be listed. Type rule: 'all' -> any; 'specific' -> the type
// must be listed. A form matches when BOTH rules pass.
export const formMatchesIntervention = (
  form: {
    site_assignment: string
    site_ids: string[]
    intervention_assignment: string
    intervention_types: string[]
  },
  siteId: string,
  interventionType: string,
): boolean => {
  const hasSite = !!siteId

  let siteMatch = true
  if (form.site_assignment === 'none') {
    siteMatch = !hasSite
  } else if (form.site_assignment === 'specific') {
    siteMatch = hasSite && Array.from(form.site_ids || []).includes(siteId)
  }

  let typeMatch = true
  if (form.intervention_assignment === 'specific') {
    typeMatch = Array.from(form.intervention_types || []).includes(interventionType)
  }

  return siteMatch && typeMatch
}

// Convenience overload for the server shape (used where a ServerForm is in hand).
export const serverFormMatchesIntervention = (
  form: ServerForm,
  siteId: string,
  interventionType: string,
): boolean =>
  formMatchesIntervention(
    {
      site_assignment: form.siteAssignment,
      site_ids: form.siteIds,
      intervention_assignment: form.interventionAssignment,
      intervention_types: form.interventionTypes,
    },
    siteId,
    interventionType,
  )
