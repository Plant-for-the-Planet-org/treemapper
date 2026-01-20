import { DocPage } from '@/components/doc-page';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function PlanetPlatformIntroductionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.planetPlatformIntroduction');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="planet-platform-introduction"
    >
      <p>{t('content')}</p>

      <h2>{t('whatIsTitle')}</h2>
      <p>{t('whatIsContent')}</p>

      <h2>{t('featuresTitle')}</h2>
      <ul>
        <li>{t('feature1')}</li>
        <li>{t('feature2')}</li>
        <li>{t('feature3')}</li>
        <li>{t('feature4')}</li>
      </ul>

      <h2>{t('integrationTitle')}</h2>
      <p>{t('integrationContent')}</p>

      <div className="mt-8 pt-8 border-t">
        <h3>{t('nextStepsTitle')}</h3>
        <ul>
          <li>
            <Link href={`/${locale}/docs/planet-platform/registration`}>
              {t('nextStep1')}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/docs/planet-platform/documents`}>
              {t('nextStep2')}
            </Link>
          </li>
        </ul>
      </div>
    </DocPage>
  );
}
