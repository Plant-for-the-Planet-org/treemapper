'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock } from 'lucide-react'
import { getPublicPagePreview } from '@shared-core/fetchApi/api.fetch'
import { useAccessToken } from '@/hooks/useAccessToken'
import { fontClassName } from '@/components/public-page/fonts'
import { PublicProjectPageView } from '@/components/public-page/PublicProjectPageView'
import { THEMES, resolveTheme } from '@/components/public-page/themes'
import { PUBLIC_PAGE_THEMES } from '@/components/public-page/types'
import type { PublicProjectPage } from '@/components/public-page/types'

/**
 * Preview a project's public page in any of the four themes.
 *
 * **Protected.** This route exists outside the public `/p/` namespace for one
 * reason: it is the only way to look at a page that is not published, so it
 * must not be served by the open endpoint. It is rendered on the client so
 * the bearer token in the auth store can be sent, and the data comes from
 * `GET /api/projects/:id/public-page/preview`, which is owner or admin only.
 * Everything below is presentation; the server decides who may see it.
 *
 * It takes a project **uid**, not a slug, because the permission guard
 * resolves membership by uid.
 */
export default function PublicPagePreview({
  params,
}: {
  params: Promise<{ projectUid: string; theme: string }>
}) {
  const { projectUid, theme: requested } = use(params)
  // The auth store rather than `useToken()`: that context is provided by the
  // dashboard layout, and this route sits outside it so the page can render
  // without the dashboard chrome.
  const { accessToken, tokenLoading } = useAccessToken()

  const [data, setData] = useState<PublicProjectPage | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'missing' | 'error'>('loading')

  const validTheme = PUBLIC_PAGE_THEMES.includes(requested as (typeof PUBLIC_PAGE_THEMES)[number])

  useEffect(() => {
    if (!validTheme) {
      setState('missing')
      return
    }
    if (!accessToken) return

    let active = true
    const load = async () => {
      setState('loading')
      try {
        const result = await getPublicPagePreview(accessToken, projectUid, requested)
        if (!active) return
        if (result?.statusCode === 403) setState('denied')
        else if (result?.statusCode === 404) setState('missing')
        else if (result?.statusCode !== 200 || !result?.data) setState('error')
        else {
          setData(result.data)
          setState('ready')
        }
      } catch {
        if (active) setState('error')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [accessToken, projectUid, requested, validTheme])

  if (!accessToken && !tokenLoading) {
    return (
      <Panel
        title="Sign in to preview"
        body="This preview is only available to the project's owners and admins."
      />
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state === 'denied') {
    return <Panel title="You cannot preview this project" body="Only an owner or admin of this project can see its public page before it is published." />
  }

  if (state === 'missing') {
    return <Panel title="Not found" body="That project or theme does not exist." />
  }

  if (state === 'error' || !data) {
    return <Panel title="Could not load the preview" body="Something went wrong fetching the page. Try again in a moment." />
  }

  const theme = resolveTheme(requested)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-[#15201b] px-6 py-3 text-[0.8125rem] text-[#f4f6f4]">
        <span className="font-semibold">Theme preview</span>
        <nav className="flex flex-wrap gap-2" aria-label="Themes">
          {Object.values(THEMES).map((option) => {
            const active = option.id === theme.id
            return (
              <Link
                key={option.id}
                href={`/preview/${projectUid}/${option.id}`}
                className="inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1.5 no-underline"
                style={
                  active
                    ? { background: '#f4f6f4', color: '#15201b', fontWeight: 600 }
                    : { border: '1px solid #3b4c43', color: '#cfdbd1' }
                }
              >
                {option.label}
                {option.id === data.theme ? ' (live)' : ''}
              </Link>
            )
          })}
        </nav>
        <span className="ml-auto flex items-center gap-1.5 text-[#9fb0a4]">
          <Lock size={12} />
          Only visible to you. Not indexed.
        </span>
      </div>

      <PublicProjectPageView data={data} theme={theme} fontClassName={fontClassName(theme)} />
    </>
  )
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-24 text-[#15201b]">
      <div className="max-w-[46ch] text-center">
        <Lock size={28} className="mx-auto text-[#14532d]" />
        <h1 className="mt-6 mb-0 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 mb-0 text-[0.9375rem] text-[#55645b]">{body}</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[44px] items-center px-5 py-3 text-sm font-medium text-white no-underline"
          style={{ background: '#14532d' }}
        >
          Back to the dashboard
        </Link>
      </div>
    </main>
  )
}
