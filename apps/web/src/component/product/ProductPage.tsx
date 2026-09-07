'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmailVerificationModal from '@/component/EmailVerificationModal';
import { cn } from '@/lib/utils';
import { useAccessToken } from '@/hooks/useAccessToken';
import { buildSocialAuthorizeUrl, buildUniversalLoginAuthorizeUrl } from '@/lib/auth/auth0-config';
import { getSafeRedirectPath } from '@/lib/utils/auth';
import { Audiences } from './Audiences';
import { CanopySprite } from './CanopySprite';
import { DashboardPreview } from './DashboardPreview';
import { DataExport } from './DataExport';
import { FooterCta } from './FooterCta';
import { ForestCloud } from './ForestCloud';
import { productFont } from './font';
import { FormBuilderAndFaq } from './FormBuilderAndFaq';
import { Hero } from './Hero';
import { Interventions } from './Interventions';
import { MonitoringPlots } from './MonitoringPlots';
import { OpenSource } from './OpenSource';
import { Pricing } from './Pricing';
import { SignInDialog } from './SignInDialog';
import { SiteNav } from './SiteNav';
import { Stories } from './Stories';
import { SupportBlock } from './SupportBlock';
import { Testimonials } from './Testimonials';
import { TrustedBy } from './TrustedBy';
import { VideoGuides } from './VideoGuides';
import { WhatIsTreeMapper } from './WhatIsTreeMapper';
import { WhatYouCanDo } from './WhatYouCanDo';

/**
 * TreeMapper product page.
 *
 * Still a POC, so it is not public yet: /login keeps serving the old
 * split-screen login screen, and this renders at /dashboard/productpage behind
 * a Plant-for-the-Planet-only gate for team review. The sign-in choices live in
 * a dialog behind the nav and run the same Auth0 flow, so the page is ready to
 * take over /login once it is signed off.
 */
export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, tokenLoading } = useAccessToken();

  const returnTo = searchParams.get('returnTo') ?? searchParams.get('redirectTo');
  const [loading, setLoading] = useState<string | false>(false);
  const [signInOpen, setSignInOpen] = useState(false);

  // Follow the token, not the profile store: useUserStore is only filled in by
  // DashboardClientLayout, which does not wrap this page, so a signed-in
  // visitor would otherwise still be offered the sign-in dialog.
  const isAuthenticated = !tokenLoading && !!accessToken;

  // Someone bounced off a protected route still gets sent straight back once
  // they are signed in. Visiting /login deliberately just shows the page.
  useEffect(() => {
    if (isAuthenticated && returnTo) {
      router.push(getSafeRedirectPath(returnTo));
    }
  }, [isAuthenticated, returnTo, router]);

  // Coming back from an Auth0 redirect through the bfcache restores this page
  // with `loading` still set, which would leave every button disabled.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleLogin = useCallback(
    async (connection?: string) => {
      setLoading(connection || 'auth0');
      try {
        const redirectTo = getSafeRedirectPath(returnTo);
        const authorizeUrl =
          connection && connection !== 'auth0'
            ? await buildSocialAuthorizeUrl(connection, redirectTo)
            : await buildUniversalLoginAuthorizeUrl(redirectTo);

        window.location.assign(authorizeUrl);
      } catch (error) {
        console.error('Login failed:', error);
        setLoading(false);
      }
    },
    [returnTo],
  );

  /** Signed in: go to the app. Signed out: ask them to sign in first. */
  const goToApp = useCallback(
    (path: string) => {
      if (isAuthenticated) {
        router.push(path);
        return;
      }
      setSignInOpen(true);
    },
    [isAuthenticated, router],
  );

  const openDashboard = useCallback(() => goToApp('/'), [goToApp]);
  const openSignIn = useCallback(() => setSignInOpen(true), []);

  return (
    <div className={cn(productFont.className, 'min-h-screen bg-tm-cream text-tm-body antialiased')}>
      <CanopySprite />
      <EmailVerificationModal />

      <SiteNav isAuthenticated={isAuthenticated} onSignIn={openSignIn} onOpenDashboard={openDashboard} />

      <main>
        <Hero onOpenDashboard={openDashboard} />
        <TrustedBy />
        <WhatIsTreeMapper onStartFree={openDashboard} />
        <WhatYouCanDo />
        <MonitoringPlots />
        <Interventions />
        <VideoGuides />
        <Stories />
        <DashboardPreview onOpenDashboard={openDashboard} />
        <Audiences />
        <Testimonials />
        <SupportBlock />
        <DataExport onOpenDataExplorer={() => goToApp('/')} />
        <FormBuilderAndFaq onOpenFormBuilder={() => goToApp('/')} />
        <Pricing onStartFree={openDashboard} />
        <OpenSource />
        <ForestCloud />
      </main>

      <FooterCta onOpenDashboard={openDashboard} />

      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} loading={loading} onLogin={handleLogin} />
    </div>
  );
}
