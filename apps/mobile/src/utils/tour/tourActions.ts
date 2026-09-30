/**
 * Handlers a screen lends to a tour step, keyed by step id. Shared by every
 * tour in the app, because the problem it solves is not tour-specific.
 *
 * Almost every step works by letting the tap fall through the spotlight hole
 * to the real control, and needs nothing from here. Some cannot: a control
 * that draws itself outside its ancestor's bounds (the add menu) is never hit
 * by a tap that has to be hit-tested down from the overlay, and a control the
 * tour should describe but not fire (a delete) must not be tappable at all.
 *
 * Those steps are driven the other way round: the step is non-interactive, the
 * library puts a press area over the cutout, and pressing it calls the screen's
 * own handler. Registering the real handler rather than re-implementing it
 * here keeps the guards and teardown in one place.
 */
const tourActions = new Map<string, () => void>()

export const setTourAction = (stepId: string, action: () => void) => {
  tourActions.set(stepId, action)
}

export const clearTourAction = (stepId: string, action: () => void) => {
  // Only clear our own entry: a remounting duplicate must not wipe the
  // registration a still-mounted instance just made.
  if (tourActions.get(stepId) === action) {
    tourActions.delete(stepId)
  }
}

export const runTourAction = (stepId: string) => {
  tourActions.get(stepId)?.()
}
