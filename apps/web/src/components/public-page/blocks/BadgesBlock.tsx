import type { ReactNode } from 'react'
import { fmtHectares, fmtNum, fmtPercent } from '../format'
import { Section, SectionHeading, TreeMark } from '../primitives'
import type { BlockProps } from './types'

/**
 * Milestones, derived rather than stored.
 *
 * Every badge is computed from figures already on the page, so one cannot
 * claim something the rest of the page contradicts, and none is shown unless
 * it has actually been earned. No badge invents a date: the data has counts,
 * not the moment a threshold was crossed.
 */
export function BadgesBlock({ data, theme, copy }: BlockProps) {
  const badges = earnedBadges(data)
  if (!badges.length) return null

  return (
    <Section>
      <SectionHeading tone={theme.tone} title={copy.badgesHeading} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className="flex items-center gap-4 p-6"
            style={{
              background: 'var(--pp-surface)',
              border: '2px solid var(--pp-line)',
              borderRadius: 'var(--pp-radius)',
            }}
          >
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full"
              style={{ background: badge.tint }}
            >
              {badge.icon}
            </span>
            <div>
              <div className="text-[0.9375rem] font-bold">{badge.title}</div>
              <div className="text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
                {badge.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

interface Badge {
  title: string
  detail: string
  tint: string
  icon: ReactNode
}

function earnedBadges(data: BlockProps['data']): Badge[] {
  const { totals, monitoring, verification } = data
  const badges: Badge[] = []

  const milestone = [10000, 5000, 1000, 500, 100].find((step) => totals.trees >= step)
  if (milestone) {
    badges.push({
      title: `First ${fmtNum(milestone)} trees`,
      detail: `${fmtNum(totals.trees)} recorded so far`,
      tint: 'var(--pp-accent-soft)',
      icon: <TreeMark size={24} color="var(--pp-accent)" />,
    })
  }

  if (totals.speciesAssessed > 0 && totals.nativeSpecies / totals.speciesAssessed >= 0.5) {
    badges.push({
      title: 'Mostly native',
      detail: `${fmtNum(totals.nativeSpecies)} of ${fmtNum(totals.speciesAssessed)} assessed species`,
      tint: '#fdf1d4',
      icon: <StarIcon />,
    })
  }

  if (monitoring.remeasured > 0) {
    badges.push({
      title: 'We came back',
      detail: `${fmtNum(monitoring.remeasured)} trees checked twice`,
      tint: '#e4eef8',
      icon: <ClockIcon />,
    })
  }

  if (totals.sites > 0) {
    badges.push({
      title: `All ${fmtNum(totals.sites)} sites mapped`,
      detail: `${fmtHectares(totals.hectares)} hectares`,
      tint: '#f8e6ee',
      icon: <PinIcon />,
    })
  }

  if (verification.total > 0 && verification.withPhoto / verification.total >= 0.9) {
    badges.push({
      title: 'Photographed',
      detail: `${fmtPercent(verification.withPhoto, verification.total)} of trees have a photo`,
      tint: 'var(--pp-accent-soft)',
      icon: <CameraIcon />,
    })
  }

  return badges.slice(0, 4)
}

function StarIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#8a6410" strokeWidth={1.9} aria-hidden="true">
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#2a6ea8" strokeWidth={1.9} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#a63d62" strokeWidth={1.9} aria-hidden="true">
      <path d="M12 21s-7-5.1-7-10a7 7 0 0 1 14 0c0 4.9-7 10-7 10Z" />
      <circle cx="12" cy="11" r="2.4" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--pp-accent)" strokeWidth={1.9} aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  )
}
