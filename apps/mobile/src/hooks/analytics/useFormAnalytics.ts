import { useCallback, useEffect, useRef } from 'react'
import {
  AnalyticsEvents,
  AnalyticsProperties,
  FIELD_TERMS,
  incrementSessionCounter,
  trackEvent,
  trackTermEvent,
} from 'src/utils/analytics'

/**
 * Form analytics (section 5) and the field-level half of terminology
 * research (section 9).
 *
 * One hook per form. It watches the form the way an observer sitting next to
 * a field worker would: when they started, which field they kept going back
 * to, which one they left empty, where they gave up.
 *
 * Abandonment is the reason this is a hook and not a set of loose calls. A
 * form is abandoned by the user walking away from the screen, and the only
 * thing that reliably knows that happened is the unmount.
 *
 * Usage:
 *
 *   const form = useFormAnalytics('intervention_form', { intervention_key })
 *   ...
 *   <TextInput
 *     onFocus={() => form.fieldFocused('height')}
 *     onBlur={() => form.fieldBlurred('height', height.length > 0)}
 *     onChangeText={(t) => { form.fieldChanged('height'); setHeight(t) }}
 *   />
 *   ...
 *   if (!valid) return form.validationFailed('height', 'not a number')
 *   form.complete({ tree_count: 3 })
 */

/** Below this a "dwell" is just a tap-through, not thinking time. */
const MIN_DWELL_MS = 3000
/** Editing a field this many times reads as "I am not sure what you want". */
const RE_EDIT_THRESHOLD = 3

interface FieldStat {
  focusCount: number
  editCount: number
  dwellMs: number
  focusedAt: number | null
  skipped: boolean
  validationErrors: number
  reEditReported: boolean
}

export interface FormAnalyticsHandle {
  start: (properties?: AnalyticsProperties) => void
  fieldFocused: (field: string) => void
  fieldBlurred: (field: string, hasValue: boolean) => void
  fieldChanged: (field: string) => void
  validationFailed: (field: string, reason: string) => void
  complete: (properties?: AnalyticsProperties) => void
  abandon: (reason: string) => void
}

interface Options {
  /**
   * Send form_started on mount. Turn off for a screen that shows something
   * else first (a list, a map) and only becomes a form after a tap.
   */
  autoStart?: boolean
}

const newFieldStat = (): FieldStat => ({
  focusCount: 0,
  editCount: 0,
  dwellMs: 0,
  focusedAt: null,
  skipped: false,
  validationErrors: 0,
  reEditReported: false,
})

export const useFormAnalytics = (
  formName: string,
  baseProperties?: AnalyticsProperties,
  options?: Options,
): FormAnalyticsHandle => {
  const autoStart = options?.autoStart ?? true

  const fields = useRef<Record<string, FieldStat>>({})
  const startedAt = useRef(0)
  const started = useRef(false)
  const finished = useRef(false)
  const lastField = useRef<string | null>(null)
  // Read inside the unmount cleanup, which must not re-run when the caller
  // rebuilds its properties object on every render.
  const basePropsRef = useRef(baseProperties)
  basePropsRef.current = baseProperties

  const statFor = (field: string): FieldStat => {
    if (!fields.current[field]) {
      fields.current[field] = newFieldStat()
    }
    return fields.current[field]
  }

  const summarise = () => {
    const entries = Object.entries(fields.current)
    const skipped = entries.filter(([, s]) => s.skipped).map(([name]) => name)
    const validationErrorCount = entries.reduce(
      (total, [, s]) => total + s.validationErrors,
      0,
    )
    const mostEdited = entries
      .slice()
      .sort((a, b) => b[1].editCount - a[1].editCount)[0]

    return {
      duration_ms: startedAt.current ? Date.now() - startedAt.current : 0,
      field_count: entries.length,
      touched_field_count: entries.filter(([, s]) => s.editCount > 0).length,
      skipped_fields: skipped,
      skipped_field_count: skipped.length,
      validation_error_count: validationErrorCount,
      most_edited_field: mostEdited && mostEdited[1].editCount > 0 ? mostEdited[0] : null,
      most_edited_field_edits: mostEdited ? mostEdited[1].editCount : 0,
    }
  }

  const start = useCallback(
    (properties?: AnalyticsProperties) => {
      if (started.current) {
        return
      }
      started.current = true
      startedAt.current = Date.now()
      incrementSessionCounter('forms_started')
      trackEvent(AnalyticsEvents.FORM_STARTED, {
        form_name: formName,
        ...basePropsRef.current,
        ...properties,
      })
    },
    [formName],
  )

  const fieldFocused = useCallback((field: string) => {
    const stat = statFor(field)
    stat.focusCount += 1
    stat.focusedAt = Date.now()
    lastField.current = field
  }, [])

  const fieldBlurred = useCallback(
    (field: string, hasValue: boolean) => {
      const stat = statFor(field)
      if (stat.focusedAt) {
        stat.dwellMs += Date.now() - stat.focusedAt
        stat.focusedAt = null
      }
      // "Skipped" is decided on the way out, not on the way in: a field the
      // user opened, looked at and left empty is the interesting one.
      stat.skipped = !hasValue

      const term = FIELD_TERMS[field]

      if (!hasValue) {
        trackEvent(AnalyticsEvents.FORM_FIELD_SKIPPED, {
          form_name: formName,
          field,
          dwell_ms: stat.dwellMs,
        })
        if (term) {
          trackTermEvent(AnalyticsEvents.TERM_FIELD_SKIPPED, term, {
            form_name: formName,
            field,
            dwell_ms: stat.dwellMs,
          })
        }
      }

      if (term && stat.dwellMs >= MIN_DWELL_MS) {
        trackTermEvent(AnalyticsEvents.TERM_FIELD_DWELL, term, {
          form_name: formName,
          field,
          dwell_ms: stat.dwellMs,
          filled: hasValue,
        })
      }
    },
    [formName],
  )

  const fieldChanged = useCallback(
    (field: string) => {
      const stat = statFor(field)
      stat.editCount += 1
      lastField.current = field

      const term = FIELD_TERMS[field]
      if (
        term &&
        !stat.reEditReported &&
        stat.editCount >= RE_EDIT_THRESHOLD
      ) {
        stat.reEditReported = true
        trackTermEvent(AnalyticsEvents.TERM_FIELD_RE_EDITED, term, {
          form_name: formName,
          field,
          edit_count: stat.editCount,
        })
      }
    },
    [formName],
  )

  const validationFailed = useCallback(
    (field: string, reason: string) => {
      const stat = statFor(field)
      stat.validationErrors += 1
      lastField.current = field
      trackEvent(AnalyticsEvents.FORM_VALIDATION_FAILED, {
        form_name: formName,
        field,
        reason,
        attempt: stat.validationErrors,
        ...basePropsRef.current,
      })
    },
    [formName],
  )

  const complete = useCallback(
    (properties?: AnalyticsProperties) => {
      if (finished.current) {
        return
      }
      finished.current = true
      incrementSessionCounter('forms_completed')
      trackEvent(AnalyticsEvents.FORM_COMPLETED, {
        form_name: formName,
        ...summarise(),
        ...basePropsRef.current,
        ...properties,
      })
    },
    [formName],
  )

  const abandon = useCallback(
    (reason: string) => {
      if (finished.current || !started.current) {
        return
      }
      finished.current = true
      incrementSessionCounter('forms_abandoned')

      const field = lastField.current
      trackEvent(AnalyticsEvents.FORM_ABANDONED, {
        form_name: formName,
        reason,
        abandoned_at_field: field,
        ...summarise(),
        ...basePropsRef.current,
      })

      // "Form abandoned after field" from section 9. Only meaningful when the
      // user was actually sitting on one of the words under study.
      const term = field ? FIELD_TERMS[field] : undefined
      if (term) {
        trackTermEvent(AnalyticsEvents.TERM_FORM_ABANDONED_AT_FIELD, term, {
          form_name: formName,
          field,
          reason,
        })
      }
    },
    [formName],
  )

  useEffect(() => {
    if (autoStart) {
      start()
    }
    return () => {
      // Leaving the screen without submitting is the definition of abandoned.
      abandon('screen_left')
    }
  }, [autoStart, start, abandon])

  return {
    start,
    fieldFocused,
    fieldBlurred,
    fieldChanged,
    validationFailed,
    complete,
    abandon,
  }
}

export default useFormAnalytics
