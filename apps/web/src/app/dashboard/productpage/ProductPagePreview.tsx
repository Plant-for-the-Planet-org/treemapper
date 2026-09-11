'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

import ProductPage from '@/component/product/ProductPage';
import { productFont } from '@/component/product/font';
import { ctaPrimary, ctaSecondary } from '@/component/product/primitives';
import Spinner from '@/component/Spinner';
import { useAccessToken } from '@/hooks/useAccessToken';
import { emailFromAccessToken } from '@/lib/auth/token-claims';
import { logout } from '@/lib/logout';
import { cn } from '@/lib/utils';

/**
 * Team-only gate around the product page POC.
 *
 * Not a security boundary: the product page is static marketing markup that
 * ships in the public JS bundle either way, and the email comes off an
 * unverified client-side token read. It exists so the team can review the page
 * on a real URL without it reading as live to anyone who wanders in.
 */
const PREVIEW_PATH = '/dashboard/productpage';
const ALLOWED_EMAIL_DOMAIN = '@plant-for-the-planet.org';

export default function ProductPagePreview() {
  const router = useRouter();
  const { accessToken, tokenLoading } = useAccessToken();

  // Same bounce the dashboard layout does, so an anonymous visitor signs in and
  // lands back here (/dashboard/* is an allowed returnTo root).
  useEffect(() => {
    if (!tokenLoading && !accessToken) {
      router.replace(`/login?returnTo=${encodeURIComponent(PREVIEW_PATH)}`);
    }
  }, [accessToken, tokenLoading, router]);

  if (tokenLoading || !accessToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const email = emailFromAccessToken(accessToken);

  if (!email || !email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return <RestrictedAccess email={email} accessToken={accessToken} />;
  }

  return <ProductPage />;
}

function RestrictedAccess({ email, accessToken }: { email?: string; accessToken: string }) {
  const router = useRouter();

  return (
    <div
      className={cn(
        productFont.className,
        'flex min-h-screen items-center justify-center bg-tm-cream px-5 text-tm-body antialiased',
      )}
    >
      <div className="w-full max-w-[440px] rounded-[20px] border border-tm-edge bg-white p-8 text-center shadow-[0_3px_10px_rgba(0,0,0,.04)]">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-tm-mist text-tm-green">
          <Lock size={22} />
        </div>

        <h1 className="mb-2 text-[22px] font-extrabold text-tm-ink">Restricted access</h1>

        <p className="text-[15px] leading-relaxed text-tm-body">
          This page is an internal preview, open to Plant-for-the-Planet accounts only.
        </p>

        <p className="mt-3 text-sm text-tm-muted">
          {email ? (
            <>
              You are signed in as <span className="font-semibold text-tm-body">{email}</span>.
            </>
          ) : (
            <>We could not read an email address from your account.</>
          )}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button type="button" className={ctaPrimary('w-full')} onClick={() => router.replace('/')}>
            Go to dashboard
          </button>
          <button type="button" className={ctaSecondary('w-full')} onClick={() => logout({ accessToken })}>
            Sign in with another account
          </button>
        </div>
      </div>
    </div>
  );
}
