import { DocPage } from '@/components/doc-page';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function PlanetPlatformDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.planetPlatformDocuments');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="planet-platform-documents"
    >
      <p>{t('intro')}</p>

      <h2>{t('verificationTitle')}</h2>
      <p>{t('verificationIntro')}</p>
      <p>{t('verificationFirstStage')}</p>
      <p>
        <Link href="https://www.plant-for-the-planet.org/restoration-organizations/">
          {t('verificationLinkText')}
        </Link>
      </p>
      <p>{t('verificationSecondStage')}</p>
      <p>{t('verificationConclusion')}</p>

      <h2>{t('documentsTitle')}</h2>
      <p>{t('documentsIntro')}</p>
      <ul>
        <li>{t('document1')}</li>
        <li>{t('document2')}</li>
        <li>{t('document3')}</li>
        <li>{t('document4')}</li>
      </ul>
      <p>{t('documentsNote')}</p>

      <h2>{t('contactTitle')}</h2>
      <p>{t('contactIntro')}</p>
      <ul>
        <li>
          <strong>{t('contactEmailLabel')}</strong>: {t('contactEmail')}
        </li>
        <li>
          <strong>{t('contactPhoneLabel')}</strong>: {t('contactPhone')}
        </li>
        <li>
          <strong>{t('contactWebsiteLabel')}</strong>: {t('contactWebsite')}
        </li>
      </ul>
      <p>{t('contactNote')}</p>

      <div className="mt-8 pt-8 border-t">
        <h3>{t('relatedTitle')}</h3>
        <ul>
          <li>
            <Link href={`/${locale}/docs/planet-platform/introduction`}>
              {t('relatedLink1')}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/docs/planet-platform/registration`}>
              {t('relatedLink2')}
            </Link>
          </li>
        </ul>
      </div>
    </DocPage>
  );
}
