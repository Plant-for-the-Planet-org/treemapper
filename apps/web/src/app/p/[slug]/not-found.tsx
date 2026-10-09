import Link from 'next/link'

/**
 * Shown for a project that does not exist and for one whose public page is
 * switched off. Deliberately the same panel for both: the wording must not let
 * a visitor work out that a private project is there.
 */
export default function PublicProjectNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-24 text-[#15201b]">
      <div className="max-w-[46ch] text-center">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#14532d"
          strokeWidth={1.5}
          aria-hidden="true"
          className="mx-auto"
        >
          <path d="M12 21v-7" />
          <path d="M12 14c-4 0-6-2.6-6-6 4 0 6 2.4 6 6Z" />
          <path d="M12 14c0-4 2-6.6 6-6.6 0 3.6-2 6.6-6 6.6Z" />
        </svg>
        <h1 className="mt-6 mb-0 text-2xl font-semibold">This page is not available</h1>
        <p className="mt-3 mb-0 text-[0.9375rem] text-[#55645b]">
          The link may be wrong, or the project team may have taken the page down. If someone sent
          you this link, ask them to check it.
        </p>
        <Link
          href="https://www.plant-for-the-planet.org"
          className="mt-8 inline-flex min-h-[44px] items-center px-5 py-3 text-sm font-medium text-white no-underline"
          style={{ background: '#14532d' }}
        >
          About Plant-for-the-Planet
        </Link>
      </div>
    </main>
  )
}
