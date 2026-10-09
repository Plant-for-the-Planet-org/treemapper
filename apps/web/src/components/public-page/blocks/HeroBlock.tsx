import { cdnUrl } from '@/lib/cdn'
import { fmtDate, fmtHectares, fmtNum, fmtTrees, yearOf } from '../format'
import { PhotoTile, Pill, PP_CONTAINER, TreeMark } from '../primitives'
import type { BlockProps } from './types'

/**
 * The page's opening.
 *
 * Three variants because the first screen is where the four themes really
 * part company, and one because everything below it is shared:
 *
 *  - `masthead` a report title page: rule, eyebrow, name, snapshot date
 *  - `cover`    an inverse full-bleed opening with one large claim
 *  - `goal`     an accent card with progress toward the project target
 */
export function HeroBlock({ data, copy, spec }: BlockProps) {
  const variant = spec.variant ?? 'cover'
  if (variant === 'masthead') return <Masthead data={data} copy={copy} />
  if (variant === 'goal') return <Goal data={data} copy={copy} />
  return <Cover data={data} copy={copy} />
}

function BrandBar({ organization, inverse }: { organization: { name: string; image: string | null }; inverse?: boolean }) {
  const logo = organization.image ? cdnUrl('project', organization.image) : null
  return (
    <div className="flex items-center gap-2.5">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist
        <img src={logo} alt="" className="h-6 w-6 object-contain" />
      ) : (
        <TreeMark size={20} color={inverse ? 'var(--pp-inverse-ink)' : 'var(--pp-accent)'} />
      )}
      <span className="text-[0.8125rem] font-semibold">
        {organization.name || 'Plant-for-the-Planet'}
      </span>
      <span className="text-[0.8125rem] opacity-50">/</span>
      <span className="text-[0.8125rem] opacity-80">TreeMapper</span>
    </div>
  )
}

function Masthead({ data, copy }: Pick<BlockProps, 'data' | 'copy'>) {
  return (
    <header>
      <div style={{ borderBottom: '1px solid var(--pp-line)' }}>
        <div className={`${PP_CONTAINER} flex h-16 items-center justify-between gap-6`}>
          <BrandBar organization={data.organization} />
          <span
            className="text-[0.6875rem] uppercase tracking-[0.09em]"
            style={{ color: 'var(--pp-muted)' }}
          >
            Public project page
          </span>
        </div>
      </div>

      <div className={`${PP_CONTAINER} flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pt-14`}>
        <div className="min-w-0 flex-[999_1_32rem]">
          <div
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--pp-accent-ink)' }}
          >
            {copy.heroEyebrow}
          </div>
          <h1
            className="pp-display mt-3 mb-0"
            style={{ fontSize: 'var(--pp-hero-size)', lineHeight: 1.08 }}
          >
            {data.project.name}
          </h1>
          <p className="mt-3.5 mb-0 max-w-[56ch] text-base" style={{ color: 'var(--pp-muted)' }}>
            {copy.heroSubline}
          </p>
        </div>
        <div className="flex flex-[1_1_14rem] flex-col gap-1 text-[0.8125rem]">
          <span
            className="text-[0.6875rem] uppercase tracking-[0.09em]"
            style={{ color: 'var(--pp-muted)' }}
          >
            Data snapshot
          </span>
          <span className="pp-num text-[0.9375rem]">{fmtDate(data.snapshotAt)}</span>
        </div>
      </div>
    </header>
  )
}

function Cover({ data, copy }: Pick<BlockProps, 'data' | 'copy'>) {
  const cover = data.project.image ? cdnUrl('project', data.project.image) : null
  const started = yearOf(data.project.startedAt)

  return (
    <header className="pp-inverse relative overflow-hidden">
      {cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- CDN host is not in the Next image allowlist */}
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(8, 24, 16, 0.68)' }} />
        </>
      ) : (
        // No project photo: two soft shapes rather than a flat slab, so the
        // opening still has depth without pretending to be a photograph.
        <>
          <div
            className="absolute -top-[10%] -right-[4%] h-[120%] w-[46%]"
            style={{ background: 'rgba(22, 53, 36, 0.4)', borderRadius: '48% 42% 50% 46%' }}
          />
          <div
            className="absolute -bottom-[18%] left-[30%] h-[70%] w-[38%]"
            style={{ background: 'rgba(21, 48, 33, 0.35)', borderRadius: '50% 46% 44% 52%' }}
          />
        </>
      )}

      <div className={`${PP_CONTAINER} relative`}>
        <div className="flex h-18 items-center justify-between gap-6 py-5">
          <BrandBar organization={data.organization} inverse />
        </div>

        <div className="max-w-[56rem] pt-20 pb-24">
          <div
            className="text-xs uppercase tracking-[0.14em]"
            style={{ color: 'var(--pp-inverse-muted)' }}
          >
            {copy.heroEyebrow}
          </div>
          <h1
            className="pp-display mt-5 mb-0"
            style={{ fontSize: 'var(--pp-hero-size)', color: '#ffffff' }}
          >
            {copy.heroHeadline}
          </h1>
          <p
            className="mt-7 mb-0 max-w-[54ch] text-xl leading-relaxed"
            style={{ color: 'var(--pp-inverse-muted)' }}
          >
            {copy.heroSubline}
          </p>

          <div className="mt-10 flex flex-wrap gap-2.5">
            {started ? <CoverChip>Since {started}</CoverChip> : null}
            {data.totals.sites > 0 ? (
              <CoverChip>{fmtNum(data.totals.sites)} sites</CoverChip>
            ) : null}
            {data.people.count > 0 ? (
              <CoverChip>{fmtNum(data.people.count)} people</CoverChip>
            ) : null}
            {data.totals.hectares > 0 ? (
              <CoverChip>{fmtHectares(data.totals.hectares)} hectares</CoverChip>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

function CoverChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-4 py-2 text-[0.8125rem]"
      style={{
        border: '1px solid var(--pp-inverse-line)',
        borderRadius: 'var(--pp-radius-pill)',
        color: 'var(--pp-inverse-muted)',
      }}
    >
      {children}
    </span>
  )
}

function Goal({ data, copy }: Pick<BlockProps, 'data' | 'copy'>) {
  const target = data.project.target ?? 0
  const share = target > 0 ? Math.min(100, Math.round((data.totals.trees / target) * 100)) : null

  return (
    <header>
      <div className={`${PP_CONTAINER} flex h-20 items-center justify-between gap-6`}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center"
            style={{ background: 'var(--pp-accent)', borderRadius: 'calc(var(--pp-radius) * 0.7)' }}
          >
            <TreeMark size={22} color="var(--pp-on-accent)" />
          </span>
          <div>
            <div className="text-[0.9375rem] font-bold">{data.project.name}</div>
            <div className="text-[0.8125rem]" style={{ color: 'var(--pp-muted)' }}>
              {data.organization.name || 'Plant-for-the-Planet'}
            </div>
          </div>
        </div>
      </div>

      <div className={PP_CONTAINER}>
        <div
          className="p-8 sm:p-14"
          style={{
            background: 'var(--pp-accent)',
            color: 'var(--pp-on-accent)',
            borderRadius: 'var(--pp-radius-lg)',
          }}
        >
          <div className="flex flex-wrap items-center gap-12">
            <div className="min-w-0 flex-[999_1_32rem]">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] opacity-80">
                {copy.heroEyebrow}
              </div>
              <h1
                className="pp-display mt-4 mb-0"
                style={{ fontSize: 'var(--pp-hero-size)', color: '#ffffff' }}
              >
                {copy.heroHeadline}
              </h1>
              <p className="mt-5 mb-0 max-w-[46ch] text-lg leading-relaxed opacity-90">
                {copy.heroSubline}
              </p>
            </div>
            <div className="flex-[1_1_18rem]">
              <PhotoTile
                image={data.photos[0]?.image}
                folder={data.photos[0]?.folder}
                caption={data.photos[0] ? null : '[Photo of our group]'}
                height={240}
              />
            </div>
          </div>

          {share !== null ? (
            <div className="mt-11">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-base font-semibold">{fmtTrees(data.totals.trees)} trees</span>
                <span className="text-base opacity-85">Goal: {fmtNum(target)}</span>
              </div>
              <div
                className="h-7 overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '999px',
                }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${share}%`,
                    background: 'var(--pp-highlight, #f5c242)',
                    borderRadius: '999px',
                  }}
                />
              </div>
              <div className="mt-2.5 text-sm opacity-85">{copy.goalNote}</div>
            </div>
          ) : (
            <div className="mt-11 flex flex-wrap gap-2.5">
              <Pill tone="solid" color={{ bg: 'rgba(255,255,255,0.18)', fg: '#ffffff' }}>
                {fmtTrees(data.totals.trees)} trees so far
              </Pill>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
