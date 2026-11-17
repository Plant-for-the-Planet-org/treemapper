import { GarminPoint, qualityDescription } from 'src/garmin'

/**
 * What a Garmin-sourced location leaves behind on the intervention.
 *
 * A coordinate taken from a Garmin handheld and one tapped on the map are the
 * same two numbers once they are stored. Nothing downstream can tell them
 * apart, and the whole reason this feature exists is that one of them is
 * better. So the provenance is written down at the moment the person accepts
 * the fix.
 *
 * **Private, not public.** It describes how the work was done rather than what
 * was planted, which is the operator's business and not a public claim about
 * the tree.
 *
 * **Why a quality word and no accuracy in metres.** Connect IQ reports
 * `Position.Quality`, a five-step enum, and nothing else. There is no radius
 * to record, so there is nothing to compare with the metres a phone GPS gives
 * and nothing to average or threshold on later. The entry stores the same
 * phrase the person read on screen before they pressed the button.
 */
export interface GarminMetaEntry {
  label: string
  value: string
  visibility: 'private'
}

export const garminFixMetaEntries = (
  point: GarminPoint,
  deviceName: string | null,
): GarminMetaEntry[] => [
  {
    label: 'GPS Source',
    // The device name is the one the owner set in Garmin Connect, so it is
    // how they refer to the unit themselves. It can be absent on a link that
    // reported a device without a name, and "Garmin" alone is still the
    // answer to the question this entry exists to answer.
    value: deviceName ? `Garmin ${deviceName}` : 'Garmin',
    visibility: 'private',
  },
  {
    label: 'GPS Quality',
    value: qualityDescription(point.quality),
    visibility: 'private',
  },
]

/**
 * Write those entries onto an intervention.
 *
 * `addEntry` is passed in rather than imported because the writer lives in a
 * Realm hook and this file is called from render code in several screens.
 *
 * Entries are keyed by their slugged label, so a second Garmin fix on the same
 * intervention replaces the first. That is right for a single tree. For a
 * polygon it means the record describes the last vertex the person took from
 * the Garmin, not every one of them, which is enough to answer "was this
 * surveyed with a handheld" and not enough to audit each corner.
 */
export const recordGarminFixMetaData = async (
  interventionId: string,
  point: GarminPoint,
  deviceName: string | null,
  addEntry: (
    interventionId: string,
    entry: { label: string; value: string; visibility: 'public' | 'private' },
  ) => Promise<boolean>,
): Promise<void> => {
  if (!interventionId) {
    return
  }
  for (const entry of garminFixMetaEntries(point, deviceName)) {
    await addEntry(interventionId, entry)
  }
}
