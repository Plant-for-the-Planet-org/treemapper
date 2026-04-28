import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function WorkingOfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.workingOffline');
  const tUi = await getTranslations('ui');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="working-offline"
    >
      <p>
        {t('intro1')}
      </p>

      <p>
        {t('intro2')}
      </p>

      <PlaceholderImage
        title={t('offlineModeImageTitle')}
        description={t('offlineModeImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('offlineMapsTitle')}</h2>
      <p>
        {t('offlineMapsIntro')}
      </p>

      <p>{t('downloadMapsIntro')}</p>
      <ol>
        <li>{t('downloadMapsStep1')} <strong>{t('offlineMaps')}</strong> {t('downloadMapsStep1End')}</li>
        <li>{t('downloadMapsStep2')}</li>
        <li>{t('downloadMapsStep3')}</li>
      </ol>

      <p>
        {t('downloadMapsDesc')}
      </p>

      <PlaceholderImage
        title={t('offlineMapsDownloadImageTitle')}
        description={t('offlineMapsDownloadImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.tip')}</h4>
        <p className="mb-0">
          {t('tipText')}
        </p>
      </div>

      <h2>{t('offlineSpeciesTitle')}</h2>
      <p>
        {t('offlineSpeciesIntro1')}{' '}
        <Link href={`/${locale}/docs/tutorials/managing-species`}>{t('manageSpeciesLink')}</Link> {t('offlineSpeciesIntro2')}
      </p>

      <p>
        {t('refreshSpeciesDesc')}
      </p>

      <PlaceholderImage
        title={t('speciesDatabaseImageTitle')}
        description={t('speciesDatabaseImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">{tUi('alerts.important')}</h4>
        <p className="mb-0">
          {t('importantText')}
        </p>
      </div>

      <h2>{t('imageCollectionTitle')}</h2>
      <p>
        {t('imageCollectionIntro')}
      </p>

      <p>{t('allPhotosIntro')}</p>
      <ul>
        <li>{t('allPhotosItem1')}</li>
        <li>{t('allPhotosItem2')}</li>
        <li>{t('allPhotosItem3')}</li>
        <li>{t('allPhotosItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('offlinePhotoCaptureImageTitle')}
        description={t('offlinePhotoCaptureImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('exportDataTitle')}</h2>
      <p>
        {t('exportDataIntro')}
      </p>

      <p>{t('exportFunctionalityIntro')}</p>
      <ul>
        <li>{t('exportFunctionalityItem1')}</li>
        <li>{t('exportFunctionalityItem2')}</li>
        <li>{t('exportFunctionalityItem3')}</li>
        <li>{t('exportFunctionalityItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('dataExportImageTitle')}
        description={t('dataExportImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('monitoringPlotTitle')}</h2>
      <p>
        {t('monitoringPlotIntro')}
      </p>

      <p>{t('fullyUseIntro')}</p>
      <ul>
        <li>{t('fullyUseItem1')}</li>
        <li>{t('fullyUseItem2')}</li>
        <li>{t('fullyUseItem3')}</li>
        <li>{t('fullyUseItem4')}</li>
        <li>{t('fullyUseItem5')}</li>
      </ul>

      <p>
        {t('monitoringPlotDesc')}
      </p>

      <PlaceholderImage
        title={t('offlineMonitoringPlotImageTitle')}
        description={t('offlineMonitoringPlotImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('whenInternetRequiredTitle')}</h2>
      <p>
        {t('whenInternetRequiredIntro')}
      </p>

      <p>{t('internetEnablesIntro')}</p>
      <ul>
        <li>
          <strong>{t('cloudBackup')}</strong>: {t('cloudBackupDesc')}
        </li>
        <li>
          <strong>{t('webDashboardAccess')}</strong>: {t('webDashboardAccessDesc')}
        </li>
        <li>
          <strong>{t('teamCollaboration')}</strong>: {t('teamCollaborationDesc')}
        </li>
        <li>
          <strong>{t('speciesDatabaseUpdates')}</strong>: {t('speciesDatabaseUpdatesDesc')}
        </li>
        <li>
          <strong>{t('offlineMapDownloads')}</strong>: {t('offlineMapDownloadsDesc')}
        </li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">{tUi('alerts.note')}</h4>
        <p className="mb-0">
          {t('noteText')}
        </p>
      </div>

      <h2>{t('whatsNextTitle')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('nextLink1')}</Link> - {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/monitoring-plots`}>{t('nextLink2')}</Link> - {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile-setup`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
