/**
 * Handlers a screen lends to a tour step, keyed by step id. Shared by every
 * tour in the app, because the problem it solves is not tour-specific.
 *
 * There are two registries, forward and back, and both hold the screen's own
 * press handler rather than a re-implementation of it -- so the guards,
 * confirmations and teardown stay in one place.
 *
 * **Forward** was first needed by the steps that cannot work by letting the tap
 * fall through the spotlight hole: a control that draws itself outside its
 * ancestor's bounds (the add menu) is never hit by a tap hit-tested down from
 * the overlay, and a control the tour should describe but not fire (a delete)
 * must not be tappable at all. Those steps are non-interactive, the library
 * puts a press area over the cutout, and pressing it runs the handler.
 *
 * It now carries a second job: the tooltip's Next button runs the forward
 * handler instead of just sliding the overlay along, so a user who cannot find
 * or hit the spotlight still moves through the real flow. The tour is advanced
 * by the screen's own handler as usual, which is why `runTourAction` reports
 * whether it found one -- Next falls back to a plain step change when it did
 * not.
 *
 * **Back** is the same idea pointing the other way, and only screen-entry steps
 * register one: Back on the first step of a screen leaves that screen, Back in
 * the middle of a screen only moves the overlay. A screen whose back cannot be
 * undone (the plot is already created, the intervention already saved)
 * registers nothing and keeps `hidePrevButton`.
 */
const forwardActions = new Map<string, () => void>()
const backActions = new Map<string, () => void>()

const register = (registry: Map<string, () => void>, stepId: string, action: () => void) => {
  registry.set(stepId, action)
}

// Only clear our own entry: a remounting duplicate must not wipe the
// registration a still-mounted instance just made.
const unregister = (registry: Map<string, () => void>, stepId: string, action: () => void) => {
  if (registry.get(stepId) === action) {
    registry.delete(stepId)
  }
}

/** Runs the handler if one is registered. Returns whether it found one. */
const run = (registry: Map<string, () => void>, stepId: string): boolean => {
  const action = registry.get(stepId)
  if (!action) {
    return false
  }
  action()
  return true
}

export const setTourAction = (stepId: string, action: () => void) =>
  register(forwardActions, stepId, action)

export const clearTourAction = (stepId: string, action: () => void) =>
  unregister(forwardActions, stepId, action)

export const runTourAction = (stepId: string): boolean => run(forwardActions, stepId)

export const setTourBackAction = (stepId: string, action: () => void) =>
  register(backActions, stepId, action)

export const clearTourBackAction = (stepId: string, action: () => void) =>
  unregister(backActions, stepId, action)

export const runTourBackAction = (stepId: string): boolean => run(backActions, stepId)
