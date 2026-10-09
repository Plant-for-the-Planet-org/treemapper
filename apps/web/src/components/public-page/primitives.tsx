import type { ReactNode } from 'react'
import { cdnUrl } from '@/lib/cdn'
import { cn } from '@/lib/utils'
import type { Tone } from './themes'

/**
 * The small shared pieces every block is built from.
 *
 * They are deliberately unopinionated about colour and corner: each reads
 * `--pp-*` tokens, so the same `Stat` looks institutional in Report and
 * playful in Academy without a single branch.
 */

export const PP_CONTAINER = 'mx-auto w-full max-w-[1176px] px-6'

export function Section({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('pp-section scroll-mt-20', className)}>
      <div className={PP_CONTAINER}>{children}</div>
    </section>
  )
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('text-[0.6875rem] font-semibold uppercase tracking-[0.1em]', className)}
      style={{ color: 'var(--pp-accent-ink)' }}
    >
      {children}
    </span>
  )
}

/**
 * Section heading. Formal tones get a small uppercase kicker, warm and simple
 * tones get a display-face headline, which is most of what separates a report
 * section from a story section.
 */
export function SectionHeading({
  tone,
  title,
  meta,
  lead,
}: {
  tone: Tone
  title: string
  meta?: ReactNode
  lead?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        {tone === 'formal' ? (
          <h2 className="m-0">
            <Kicker>{title}</Kicker>
          </h2>
        ) : (
          <h2 className="pp-display m-0" style={{ fontSize: 'var(--pp-h2-size)', fontWeight: 400 }}>
            {title}
          </h2>
        )}
        {lead ? (
          <p className="mt-2 max-w-[64ch] text-[0.9375rem]" style={{ color: 'var(--pp-muted)' }}>
            {lead}
          </p>
        ) : null}
      </div>
      {meta ? (
        <span className="text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
          {meta}
        </span>
      ) : null}
    </div>
  )
}

export type StatVariant = 'rules' | 'display' | 'cards' | 'plain'

/**
 * One headline figure. The variant decides the furniture around it, never the
 * number itself, so Report and Academy cannot drift apart on what they claim.
 */
export function Stat({
  value,
  label,
  hint,
  variant = 'plain',
  tint,
}: {
  value: string
  label: string
  hint?: string
  variant?: StatVariant
  /** Card background, Academy only. */
  tint?: string
}) {
  if (variant === 'cards') {
    return (
      <div
        className="p-6"
        style={{ background: tint ?? 'var(--pp-accent-soft)', borderRadius: 'var(--pp-radius)' }}
      >
        <div className="pp-display" style={{ fontSize: 'var(--pp-stat-size)', lineHeight: 1 }}>
          {value}
        </div>
        <div className="mt-2 text-[0.9375rem] font-semibold">{label}</div>
        {hint ? (
          <div className="mt-1 text-sm" style={{ color: 'var(--pp-muted)' }}>
            {hint}
          </div>
        ) : null}
      </div>
    )
  }

  if (variant === 'display') {
    return (
      <div>
        <div
          className="pp-display"
          style={{ fontSize: 'var(--pp-stat-size)', lineHeight: 1, color: 'var(--pp-accent)' }}
        >
          {value}
        </div>
        <div className="mt-3 text-base" style={{ color: 'var(--pp-muted)' }}>
          {label}
        </div>
      </div>
    )
  }

  if (variant === 'rules') {
    return (
      <div className="pt-3.5" style={{ borderTop: '2px solid var(--pp-ink)' }}>
        <div
          className="pp-num font-medium"
          style={{ fontSize: 'var(--pp-stat-size)', letterSpacing: '-0.02em' }}
        >
          {value}
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--pp-muted)' }}>
          {label}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="pp-num text-xl font-medium">{value}</div>
      <div className="mt-0.5 text-xs" style={{ color: 'var(--pp-muted)' }}>
        {label}
      </div>
    </div>
  )
}

export function Pill({
  children,
  tone = 'soft',
  color,
}: {
  children: ReactNode
  tone?: 'soft' | 'outline' | 'solid'
  /** Overrides the soft background, for the species badge colours. */
  color?: { bg: string; fg: string }
}) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium'
  const style =
    tone === 'outline'
      ? { border: '1px solid var(--pp-line)', borderRadius: 'var(--pp-radius-pill)' }
      : tone === 'solid'
        ? {
            background: color?.bg ?? 'var(--pp-accent)',
            color: color?.fg ?? 'var(--pp-on-accent)',
            borderRadius: 'var(--pp-radius-pill)',
          }
        : {
            background: color?.bg ?? 'var(--pp-accent-soft)',
            color: color?.fg ?? 'var(--pp-accent-ink)',
            borderRadius: 'var(--pp-radius-pill)',
          }

  return (
    <span className={base} style={style}>
      {children}
    </span>
  )
}

/**
 * A field photograph, or an honest labelled box where one is missing.
 *
 * Never invents imagery: a project with no photos shows empty frames that say
 * so, which is information rather than decoration.
 */
export function PhotoTile({
  image,
  folder,
  caption,
  className,
  height,
}: {
  image?: string | null
  folder?: 'tree' | 'intervention' | 'site'
  caption?: string | null
  className?: string
  height?: number | string
}) {
  const url = image && folder ? cdnUrl(folder, image) : null

  return (
    <figure
      className={cn('relative m-0 flex items-end overflow-hidden', className)}
      style={{
        background: 'var(--pp-placeholder)',
        borderRadius: 'var(--pp-radius)',
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
        <img
          src={url}
          alt={caption ?? ''}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {caption ? (
        <figcaption
          className="relative z-10 px-4 py-3.5 text-xs font-medium"
          style={
            url
              ? {
                  color: '#ffffff',
                  textShadow: '0 1px 6px rgba(0,0,0,0.55)',
                  width: '100%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                }
              : { color: 'var(--pp-muted)' }
          }
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/** Horizontal scroll wrapper so a wide table never breaks the page on a phone. */
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-sm" style={{ color: 'var(--pp-muted)' }}>
      {children}
    </p>
  )
}

/** Shared tree icon. One definition so the brand mark is identical everywhere. */
export function TreeMark({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={1.6}
      aria-hidden="true"
    >
      <path d="M12 21v-7" />
      <path d="M12 14c-4 0-6-2.6-6-6 4 0 6 2.4 6 6Z" />
      <path d="M12 14c0-4 2-6.6 6-6.6 0 3.6-2 6.6-6 6.6Z" />
    </svg>
  )
}

export function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  )
}

/** Shared button skin for the page's few real actions. */
export function ActionLink({
  href,
  children,
  tone = 'solid',
  download,
}: {
  href: string
  children: ReactNode
  tone?: 'solid' | 'outline'
  download?: boolean
}) {
  const style =
    tone === 'solid'
      ? {
          background: 'var(--pp-accent)',
          color: 'var(--pp-on-accent)',
          borderRadius: 'var(--pp-radius-pill)',
        }
      : {
          border: '1px solid currentColor',
          borderRadius: 'var(--pp-radius-pill)',
        }

  return (
    <a
      href={href}
      download={download}
      className="inline-flex min-h-[44px] items-center gap-2.5 px-5 py-3 text-sm font-medium no-underline"
      style={style}
    >
      {children}
    </a>
  )
}
