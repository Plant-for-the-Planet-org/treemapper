import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ManagingSpeciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.managingSpecies');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="managing-species"
    >
      <p>
        {t('intro1')}
      </p>

      <p>
        {t('intro2')} <strong>{t('speciesCount')}</strong> {t('intro2Mid')} <strong>{t('offline')}</strong> {t('intro2End')}
      </p>

      <PlaceholderImage
        title={t('speciesListImageTitle')}
        description={t('speciesListImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('whereManageTitle')}</h2>
      <ul>
        <li>
          <strong>{t('mobileApp')}</strong>: {t('mobileAppDesc')}
        </li>
        <li>
          <strong>{t('webDashboard')}</strong>: {t('webDashboardDesc')}
        </li>
      </ul>

      <h2>{t('mobileAppTitle')}</h2>
      <p>
        {t('mobileAppIntro')}
      </p>

      <p>{t('fromMobileIntro')}</p>
      <ul>
        <li>
          {t('fromMobileItem1')} <strong>{t('localName')}</strong>
        </li>
        <li>
          {t('fromMobileItem2')} <strong>{t('description')}</strong> {t('fromMobileItem2End')}
        </li>
        <li>
          {t('fromMobileItem3')} <strong>{t('customImage')}</strong>
        </li>
        <li>
          {t('fromMobileItem4')} <strong>{t('favorite')}</strong> {t('fromMobileItem4End')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('editSpeciesImageTitle')}
        description={t('editSpeciesImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('webDashboardTitle')}</h2>
      <p>
        {t('webDashboardIntro1')} <strong>{t('moreFilters')}</strong> {t('webDashboardIntro2')}
      </p>

      <p>
        {t('webDashboardDesc')}
      </p>

      <h2>{t('speciesNotFoundTitle')}</h2>
      <p>
        {t('speciesNotFoundIntro')}
      </p>

      <p>
        {t('requestSpeciesDesc')}
      </p>

      <h2>{t('whatsNextTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/monitoring-plots`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
