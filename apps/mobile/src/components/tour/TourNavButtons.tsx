import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useTourGuide, type TourButtonProps } from '@wrack/react-native-tour-guide'

import { runTourAction, runTourBackAction } from 'src/utils/tour/tourActions'

/**
 * The tooltip's Next and Back buttons, replacing the library's own through the
 * `components` slots in `utils/tour/tourConfig.ts`.
 *
 * They exist for one reason: pressing them has to move the *app*, not just the
 * overlay. Nearly every step is `interactive`, so the only way forward used to
 * be a tap through the spotlight hole -- and when that hole is hard to see, or
 * the target failed to measure and there is no hole at all, the step was a dead
 * end with Skip as the only exit. Next now runs the same handler the real
 * control runs (`utils/tour/tourActions.ts`), so there are two ways through
 * every step instead of one.
 *
 * Next deliberately does **not** call the library's own advance when it found a
 * handler. The handler advances the tour itself, through the screen's
 * `advanceIfOn` or through the next screen's focus sync, and doing both would
 * run away: the registered handlers call `advanceIfOn`, and the library's
 * `nextStep` has no reentrancy guard unless a `beforeStepChange` is configured,
 * so each re-entry would fire the *following* step's handler in turn.
 *
 * Back is the other way round and calls both. Nothing pulls the tour backwards
 * on its own -- a screen's focus sync only ever moves it forward -- so the step
 * change has to come from here, and the navigation after it.
 *
 * The styling repeats the library's defaults rather than restyling the tooltip:
 * this change is about what the buttons do.
 */

const useCurrentStepId = (): string | undefined => {
  const { activeSteps, currentStep } = useTourGuide()
  return activeSteps[currentStep]?.id
}

export const TourNextButton = ({ label, onPress, disabled, isLast }: TourButtonProps) => {
  const stepId = useCurrentStepId()

  const handlePress = () => {
    // No handler on this step (it teaches something only the user can do, or
    // only moves the overlay along), so fall back to a plain step change.
    if (stepId && runTourAction(stepId)) {
      return
    }
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.primary, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={isLast ? `${label}, finish tour` : `${label}, go to the next step`}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  )
}

export const TourPrevButton = ({ label, onPress }: TourButtonProps) => {
  const stepId = useCurrentStepId()

  const handlePress = () => {
    onPress()
    if (stepId) {
      runTourBackAction(stepId)
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.secondary}
      accessibilityRole="button"
      accessibilityLabel={`${label}, go to the previous step`}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  primary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  secondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
