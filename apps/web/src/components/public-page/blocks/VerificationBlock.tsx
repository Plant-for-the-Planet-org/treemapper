import { fmtPercent } from '../format'
import { Section, Stat } from '../primitives'
import type { BlockProps } from './types'

/**
 * The trust line: what share of the trees carry evidence.
 *
 * This is the claim no estimate-based impact page can make, so it gets its own
 * band rather than being folded into the numbers row. It renders nothing when
 * there are no tree records to speak for, because "0% verified" would read as
 * a failure rather than as an absence.
 */
export function VerificationBlock({ data, copy }: BlockProps) {
  const { verification } = data
  if (verification.total === 0) return null

  const parts = [
    { value: fmtPercent(verification.withLocation, verification.total), label: copy.verificationLabels.gps },
    { value: fmtPercent(verification.withPhoto, verification.total), label: copy.verificationLabels.photo },
    { value: fmtPercent(verification.capturedOnSite, verification.total), label: copy.verificationLabels.onSite },
  ]

  return (
    <Section>
      <div
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6 px-8 py-7"
        style={{
          background: 'var(--pp-accent-soft)',
          borderLeft: '3px solid var(--pp-accent)',
          borderRadius: 'var(--pp-radius)',
        }}
      >
        <p className="m-0 min-w-0 flex-[999_1_26rem] text-xl leading-snug">
          {copy.verificationHeadline}
        </p>
        <div className="grid flex-[1_1_20rem] grid-cols-3 gap-5">
          {parts.map((part) => (
            <Stat key={part.label} value={part.value} label={part.label} />
          ))}
        </div>
      </div>
    </Section>
  )
}
