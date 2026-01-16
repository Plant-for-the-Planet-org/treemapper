import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function SiteCreationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.siteCreation');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="site-creation"
    >
      <p>
        <strong>{t('sites')}</strong> {t('intro')}
      </p>

      <PlaceholderImage
        title={t('sitesOverviewImageTitle')}
        description={t('sitesOverviewImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('creatingTitle')}</h2>
      <p>{t('creatingIntro')}</p>
      <ol>
        <li>{t('creatingStep1')} <strong>{t('sites')}</strong></li>
        <li>{t('creatingStep2')} <strong>{t('addNewSite')}</strong></li>
        <li>{t('creatingStep3')} <strong>{t('name')}</strong></li>
        <li>{t('creatingStep4')} <strong>{t('type')}</strong> {t('creatingStep4Desc')}</li>
        <li>{t('creatingStep5')}</li>
        <li>{t('creatingStep6')}</li>
      </ol>

      <h2>{t('defineBoundariesTitle')}</h2>
      <p>{t('defineBoundariesIntro')}</p>

      <h3>{t('drawPolygonTitle')}</h3>
      <p>
        {t('drawPolygonDesc1')}
      </p>

      <p>
        {t('drawPolygonDesc2')} <strong>{t('mobileApp')}</strong>. {t('drawPolygonDesc3')} <strong>{t('traceWithGPS')}</strong> {t('drawPolygonDesc4')}
      </p>

      <PlaceholderImage
        title={t('drawPolygonImageTitle')}
        description={t('drawPolygonImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('uploadGeoJSONTitle')}</h3>
      <p>
        {t('uploadGeoJSONDesc')}
      </p>

      <PlaceholderImage
        title={t('uploadGeoJSONImageTitle')}
        description={t('uploadGeoJSONImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('accessManagementTitle')}</h2>
      <p>
        {t('accessManagementIntro')}
      </p>

      <p>
        {t('accessManagementDesc')}
      </p>

      <h2>{t('whatsNextTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
