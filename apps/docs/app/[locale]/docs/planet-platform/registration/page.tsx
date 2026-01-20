import { DocPage } from '@/components/doc-page';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function PlanetPlatformRegistrationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.planetPlatformRegistration');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="planet-platform-registration"
    >
      <p>{t('intro')}</p>

      <h2>{t('stepsTitle')}</h2>
      <ol>
        <li>{t('step1')}</li>
        <li>{t('step2')}</li>
        <li>{t('step3')}</li>
        <li>{t('step4')}</li>
      </ol>

      <h2>{t('approvalTitle')}</h2>
      <p>{t('approvalContent')}</p>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
        <h3 className="mt-0 text-primary">{t('noteTitle')}</h3>
        <p className="mb-0">{t('noteContent')}</p>
      </div>

      <h2>{t('requiredDocumentsTitle')}</h2>
      <p>{t('requiredDocumentsIntro')}</p>
      <p>
        <Link href={`/${locale}/docs/planet-platform/documents`}>
          {t('requiredDocumentsLink')}
        </Link>{' '}
        {t('requiredDocumentsText')}
      </p>

      <div className="mt-8 pt-8 border-t">
        <h3>{t('relatedTitle')}</h3>
        <ul>
          <li>
            <Link href={`/${locale}/docs/planet-platform/introduction`}>
              {t('relatedLink1')}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/docs/planet-platform/documents`}>
              {t('relatedLink2')}
            </Link>
          </li>
        </ul>
      </div>
    </DocPage>
  );
}
