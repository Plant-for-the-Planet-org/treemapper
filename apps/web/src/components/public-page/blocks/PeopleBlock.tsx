import { cdnUrl } from '@/lib/cdn'
import { fmtNum } from '../format'
import { Section, SectionHeading } from '../primitives'
import type { PublicPagePerson } from '../types'
import type { BlockProps } from './types'

/** Muted swatches for initials, distinct in lightness as well as hue. */
const AVATAR_TINTS = ['#cfd6c8', '#d9e0d2', '#d5d8cc', '#ccd4c6', '#dadfd4', '#d2d9cd']
const CHIP_TINTS = [
  { bg: 'var(--pp-accent-soft)', dot: '#2f7a3c' },
  { bg: '#fdf1d4', dot: '#8a6410' },
  { bg: '#e4eef8', dot: '#2a6ea8' },
  { bg: '#f8e6ee', dot: '#a63d62' },
]

/**
 * Who did the work.
 *
 * Names and faces only appear when the project turned on `showContributorNames`
 * and the person is not marked private: the server sends initials otherwise, so
 * this block cannot leak a name it was never given. The consent line is shown
 * either way, because a reader should be able to tell the difference between
 * "nobody agreed" and "nobody worked here".
 */
export function PeopleBlock({ data, theme, copy, spec }: BlockProps) {
  if (!data.people.count) return null
  const variant = spec.variant ?? 'quote'

  if (variant === 'chips') {
    return (
      <Section id="pp-people">
        <SectionHeading
          tone={theme.tone}
          title={copy.peopleHeading}
          lead={copy.peopleConsentNote}
        />
        <div className="flex flex-wrap gap-3">
          {data.people.members.slice(0, 8).map((person, index) => {
            const tint = CHIP_TINTS[index % CHIP_TINTS.length]
            return (
              <span
                key={`${person.initials}-${index}`}
                className="inline-flex items-center gap-2.5 py-2 pr-4 pl-2 text-[0.9375rem] font-semibold"
                style={{ background: tint.bg, borderRadius: 'var(--pp-radius-pill)' }}
              >
                <Avatar person={person} tint={tint.dot} solid />
                {person.name ?? person.initials}
              </span>
            )
          })}
          {data.people.count > 8 ? (
            <span
              className="inline-flex items-center px-5 py-3 text-[0.9375rem] font-semibold"
              style={{
                background: 'var(--pp-line)',
                borderRadius: 'var(--pp-radius-pill)',
                color: 'var(--pp-muted)',
              }}
            >
              and {fmtNum(data.people.count - 8)} more
            </span>
          ) : null}
        </div>
      </Section>
    )
  }

  return (
    <Section id="pp-people">
      <div
        className="flex flex-wrap items-center gap-x-14 gap-y-8 p-8 sm:p-14"
        style={{ background: 'var(--pp-surface)', borderRadius: 'var(--pp-radius)' }}
      >
        <div className="min-w-0 flex-[999_1_28rem]">
          <p
            className="pp-display m-0"
            style={{ fontSize: 'clamp(1.5rem, 2.6vw, 1.9rem)', fontWeight: 400, lineHeight: 1.35 }}
          >
            {copy.peopleHeading}.
          </p>
          <p className="mt-5 mb-0 max-w-[52ch] text-[0.9375rem]" style={{ color: 'var(--pp-muted)' }}>
            {copy.peopleConsentNote}
          </p>
        </div>
        <div className="flex-[1_1_18rem]">
          <div className="flex flex-wrap gap-2">
            {data.people.members.slice(0, 8).map((person, index) => (
              <Avatar
                key={`${person.initials}-${index}`}
                person={person}
                tint={AVATAR_TINTS[index % AVATAR_TINTS.length]}
              />
            ))}
            {data.people.count > 8 ? (
              <span
                className="flex h-11 w-11 items-center justify-center text-sm font-semibold"
                style={{ background: 'var(--pp-line)', borderRadius: '999px', color: 'var(--pp-ink)' }}
              >
                +{fmtNum(data.people.count - 8)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  )
}

function Avatar({
  person,
  tint,
  solid,
}: {
  person: PublicPagePerson
  tint: string
  /** Small filled circle used inside a chip, rather than the 44px standalone one. */
  solid?: boolean
}) {
  const url = person.image ? cdnUrl('profile', person.image) : null
  const size = solid ? 'h-[34px] w-[34px] text-[0.8125rem]' : 'h-11 w-11 text-sm'

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
      <img
        src={url}
        alt={person.name ?? ''}
        className={`${size} rounded-full object-cover`}
        loading="lazy"
      />
    )
  }

  return (
    <span
      className={`${size} flex items-center justify-center rounded-full font-semibold`}
      style={
        solid
          ? { background: tint, color: '#ffffff' }
          : { background: tint, color: '#38463a' }
      }
      aria-hidden="true"
    >
      {person.initials}
    </span>
  )
}
