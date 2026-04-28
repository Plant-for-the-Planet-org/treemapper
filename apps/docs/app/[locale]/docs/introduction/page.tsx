import { DocPage } from '@/components/doc-page';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function IntroductionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.introduction');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="introduction"
    >
      <p>{t('intro')}</p>

      <Image
        src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/introduction_one.png"
        alt="TreeMapper mobile app and web dashboard overview"
        width={1200}
        height={675}
        className="rounded-lg my-4 w-full h-auto"
        priority
      />

      <p>{t('platformIntro')}</p>

      <ul>
        <li>
          <strong>{t('mobileApp')}</strong> – {t('mobileAppDesc')}
        </li>
        <li>
          <strong>{t('webDashboard')}</strong> – {t('webDashboardDesc')}
        </li>
      </ul>

      <p>{t('platformSummary')}</p>

      <h2>{t('purposeTitle')}</h2>
      <p>{t('purposeIntro')}</p>
      <ul>
        <li>{t('challenge1')}</li>
        <li>{t('challenge2')}</li>
        <li>{t('challenge3')}</li>
        <li>{t('challenge4')}</li>
      </ul>
      <p>{t('purposeSummary')}</p>

      <h2>{t('whoForTitle')}</h2>
      <p>{t('whoForIntro')}</p>
      <ul>
        <li>{t('user1')}</li>
        <li>{t('user2')}</li>
        <li>{t('user3')}</li>
        <li>{t('user4')}</li>
      </ul>
      <p>{t('whoForSummary')}</p>

      <h2>{t('whatsNewTitle')}</h2>
      <p>{t('whatsNewIntro')}</p>
      <ul>
        <li>{t('newFeature1')}</li>
        <li>{t('newFeature2')}</li>
      </ul>
      <p>{t('whatsNewSummary')}</p>

      <div className="mt-8 pt-8 border-t">
        <Link href={`/${locale}/docs/mobile-setup`}>
          <Button size="lg" className="gap-2">
            {t('nextButton')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </DocPage>
  );
}
