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

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <p className="mb-2">
          {t('registrationLinkText')}{' '}
          <Link href={t('registrationLinkUrl')} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t('registrationLink')}
          </Link>.
        </p>
        <p className="mb-0">
          <strong>{t('loginNote')}</strong>
        </p>
      </div>

      <h2>{t('stepsTitle')}</h2>
      
      <div className="space-y-6 my-6">
        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">{t('step1Title')}</h3>
          <p className="mb-0">{t('step1Description')}</p>
        </div>

        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">{t('step2Title')}</h3>
          <p className="mb-0">{t('step2Description')}</p>
        </div>

        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">{t('step3Title')}</h3>
          <p className="mb-0">{t('step3Description')}</p>
        </div>

        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">{t('step4Title')}</h3>
          <p className="mb-0">{t('step4Description')}</p>
        </div>
      </div>

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
