import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function OfflineMapsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.offlineMaps');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="offline-maps"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('howOfflineMapsWorkTitle')}</h2>
      <p>
        {t('howOfflineMapsWorkDesc')}
      </p>
      <ul>
        <li>{t('howOfflineMapsWorkItem1')}</li>
        <li>{t('howOfflineMapsWorkItem2')}</li>
        <li>{t('howOfflineMapsWorkItem3')}</li>
        <li>{t('howOfflineMapsWorkItem4')}</li>
      </ul>

      <h2>{t('downloadingTitle')}</h2>

      <h3>{t('step1Title')}</h3>
      <p>
        {t('step1Desc')}
      </p>

      <PlaceholderImage
        title={t('areaSelectionImageTitle')}
        description={t('areaSelectionImageDesc')}
      />

      <h3>{t('step2Title')}</h3>
      <p>
        {t('step2Desc')}
      </p>
      <ul>
        <li>{t('step2Item1')}</li>
        <li>{t('step2Item2')}</li>
        <li>{t('step2Item3')}</li>
      </ul>

      <h3>{t('step3Title')}</h3>
      <p>
        {t('step3Desc')}
      </p>
      <ul>
        <li>{t('step3Item1')}</li>
        <li>{t('step3Item2')}</li>
        <li>{t('step3Item3')}</li>
      </ul>

      <PlaceholderImage
        title={t('downloadProgressImageTitle')}
        description={t('downloadProgressImageDesc')}
      />

      <h3>{t('step4Title')}</h3>
      <p>
        {t('step4Desc')}
      </p>

      <h2>{t('downloadSpecificationsTitle')}</h2>
      <p>{t('downloadSpecificationsIntro')}</p>

      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">{t('tableSetting')}</th>
              <th className="border border-border px-4 py-2 text-left">{t('tableValue')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow1Setting')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow1Value')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow2Setting')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow2Value')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow3Setting')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow3Value')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        {t('zoomLevelsDesc')}
      </p>

      <h2>{t('managingTitle')}</h2>

      <h3>{t('viewingDownloadedMapsTitle')}</h3>
      <p>{t('viewingDownloadedMapsIntro')}</p>
      <ul>
        <li>
          <strong>{t('mapName')}</strong>: {t('mapNameDesc')}
        </li>
        <li>
          <strong>{t('areaName')}</strong>: {t('areaNameDesc')}
        </li>
        <li>
          <strong>{t('size')}</strong>: {t('sizeDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('offlineMapsListImageTitle')}
        description={t('offlineMapsListImageDesc')}
      />

      <h3>{t('deletingTitle')}</h3>
      <p>{t('deletingIntro')}</p>
      <ul>
        <li>{t('deletingItem1')}</li>
        <li>{t('deletingItem2')}</li>
        <li>{t('deletingItem3')}</li>
        <li>{t('deletingItem4')}</li>
      </ul>
      <p>
        {t('deletingDesc')}
      </p>

      <h2>{t('usingOfflineMapsTitle')}</h2>
      <p>
        {t('usingOfflineMapsDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('mapNavigation')}</strong>: {t('mapNavigationDesc')}
        </li>
        <li>
          <strong>{t('creatingInterventions')}</strong>: {t('creatingInterventionsDesc')}
        </li>
        <li>
          <strong>{t('plotManagement')}</strong>: {t('plotManagementDesc')}
        </li>
        <li>
          <strong>{t('locationTracking')}</strong>: {t('locationTrackingDesc')}
        </li>
      </ul>

      <p>
        {t('whenOnlineMapsDesc')}
      </p>

      <h2>{t('storageConsiderationsTitle')}</h2>

      <h3>{t('estimatingDownloadSizeTitle')}</h3>
      <p>{t('estimatingDownloadSizeIntro')}</p>
      <ul>
        <li>
          <strong>{t('areaSize')}</strong>: {t('areaSizeDesc')}
        </li>
        <li>
          <strong>{t('mapDetail')}</strong>: {t('mapDetailDesc')}
        </li>
        <li>
          <strong>{t('zoomLevels')}</strong>: {t('zoomLevelsDesc2')}
        </li>
      </ul>
      <p>
        {t('typicalSizeDesc')}
      </p>

      <h3>{t('managingDeviceStorageTitle')}</h3>
      <ul>
        <li>{t('managingDeviceStorageItem1')}</li>
        <li>{t('managingDeviceStorageItem2')}</li>
        <li>{t('managingDeviceStorageItem3')}</li>
        <li>{t('managingDeviceStorageItem4')}</li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('beforeFieldworkTitle')}</h3>
      <ul>
        <li>
          <strong>{t('downloadInAdvance')}</strong>: {t('downloadInAdvanceDesc')}
        </li>
        <li>
          <strong>{t('verifyCoverage')}</strong>: {t('verifyCoverageDesc')}
        </li>
        <li>
          <strong>{t('checkStorage')}</strong>: {t('checkStorageDesc')}
        </li>
      </ul>

      <h3>{t('inTheFieldTitle')}</h3>
      <ul>
        <li>
          <strong>{t('testBeforeGoing')}</strong>: {t('testBeforeGoingDesc')}
        </li>
        <li>
          <strong>{t('useGpsWisely')}</strong>: {t('useGpsWiselyDesc')}
        </li>
        <li>
          <strong>{t('conserveBattery')}</strong>: {t('conserveBatteryDesc')}
        </li>
      </ul>

      <h3>{t('afterFieldworkTitle')}</h3>
      <ul>
        <li>
          <strong>{t('syncData')}</strong>: {t('syncDataDesc')}
        </li>
        <li>
          <strong>{t('cleanUp')}</strong>: {t('cleanUpDesc')}
        </li>
        <li>
          <strong>{t('downloadUpdates')}</strong>: {t('downloadUpdatesDesc')}
        </li>
      </ul>

      <h2>{t('troubleshootingTitle')}</h2>

      <h3>{t('downloadFailsTitle')}</h3>
      <ul>
        <li>{t('downloadFailsItem1')}</li>
        <li>{t('downloadFailsItem2')}</li>
        <li>{t('downloadFailsItem3')}</li>
        <li>{t('downloadFailsItem4')}</li>
      </ul>

      <h3>{t('mapsNotDisplayingTitle')}</h3>
      <ul>
        <li>{t('mapsNotDisplayingItem1')}</li>
        <li>{t('mapsNotDisplayingItem2')}</li>
        <li>{t('mapsNotDisplayingItem3')}</li>
      </ul>

      <h3>{t('slowDownloadTitle')}</h3>
      <ul>
        <li>{t('slowDownloadItem1')}</li>
        <li>{t('slowDownloadItem2')}</li>
        <li>{t('slowDownloadItem3')}</li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/mobile/map-navigation`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/sync-offline`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
