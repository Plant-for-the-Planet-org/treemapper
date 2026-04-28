import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function MonitoringPlotsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.monitoringPlots');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="monitoring-plots"
    >
      <p>
        {t('intro1')}
      </p>

      <p>
        {t('intro2')}
      </p>

      <PlaceholderImage
        title={t('overviewImageTitle')}
        description={t('overviewImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('whatIsTitle')}</h2>
      <p>
        {t('whatIsDesc')}
      </p>

      <p>{t('usefulForIntro')}</p>
      <ul>
        <li>{t('usefulForItem1')}</li>
        <li>{t('usefulForItem2')}</li>
        <li>{t('usefulForItem3')}</li>
      </ul>

      <h2>{t('creatingTitle')}</h2>
      <p>
        {t('creatingIntro')}
      </p>

      <h3>{t('plotTypeTitle')}</h3>
      <p>{t('plotTypeIntro')} <strong>{t('intervention')}</strong> {t('plotTypeMid')} <strong>{t('control')}</strong> {t('plotTypeEnd')}</p>
      <ul>
        <li>
          <strong>{t('interventionPlots')}</strong> {t('interventionPlotsDesc')}
        </li>
        <li>
          <strong>{t('controlPlots')}</strong> {t('controlPlotsDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('plotTypeImageTitle')}
        description={t('plotTypeImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('plotDetailsTitle')}</h3>
      <p>
        {t('plotDetailsDesc')}
      </p>

      <PlaceholderImage
        title={t('plotDetailsImageTitle')}
        description={t('plotDetailsImageDesc')}
        aspectRatio="portrait"
      />

      <h3>{t('locationTitle')}</h3>
      <p>
        {t('locationDesc')}
      </p>

      <PlaceholderImage
        title={t('locationImageTitle')}
        description={t('locationImageDesc')}
        aspectRatio="portrait"
      />

      <p>
        {t('onceCompleted')}
      </p>

      <h2>{t('addingPlantsTitle')}</h2>
      <p>
        {t('addingPlantsIntro')}
      </p>

      <p>{t('forEachPlantIntro')}</p>
      <ul>
        <li>{t('forEachPlantItem1')} <strong>{t('planted')}</strong> {t('forEachPlantItem1Mid')} <strong>{t('recruit')}</strong> {t('forEachPlantItem1End')}</li>
        <li>{t('forEachPlantItem2')} <strong>{t('species')}</strong></li>
        <li><strong>{t('initialMeasurements')}</strong> {t('initialMeasurementsDesc')}</li>
        <li><strong>{t('optionalTags')}</strong> {t('optionalTagsDesc')}</li>
        <li>{t('forEachPlantItem5')} <strong>{t('position')}</strong> {t('forEachPlantItem5End')}</li>
      </ul>

      <p>
        {t('allowsPlotDesc')}
      </p>

      <PlaceholderImage
        title={t('addingPlantsImageTitle')}
        description={t('addingPlantsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('plantTimelineTitle')}</h2>
      <p>
        {t('plantTimelineIntro')}
      </p>

      <p>{t('asMonitoringIntro')}</p>
      <ul>
        <li>{t('asMonitoringItem1')}</li>
        <li>{t('asMonitoringItem2')}</li>
        <li>{t('asMonitoringItem3')}</li>
      </ul>

      <p>
        {t('createsRecordDesc')}
      </p>

      <PlaceholderImage
        title={t('plantTimelineImageTitle')}
        description={t('plantTimelineImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('plotObservationsTitle')}</h2>
      <p>
        {t('plotObservationsIntro')}
      </p>

      <p>{t('currentlySupportedIntro')}</p>
      <ul>
        <li><strong>{t('soilMoisture')}</strong></li>
        <li><strong>{t('canopyCover')}</strong></li>
      </ul>

      <p>
        {t('observationsRecordedDesc')}
      </p>

      <PlaceholderImage
        title={t('plotObservationsImageTitle')}
        description={t('plotObservationsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('mapViewTitle')}</h2>
      <p>{t('mapViewIntro')}</p>
      <ul>
        <li>{t('mapViewItem1')}</li>
        <li>{t('mapViewItem2')}</li>
      </ul>

      <p>
        {t('mapViewDesc')}
      </p>

      <PlaceholderImage
        title={t('mapViewImageTitle')}
        description={t('mapViewImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('editingTitle')}</h2>
      <p>
        {t('editingDesc')}
      </p>

      <h2>{t('plotGroupsTitle')}</h2>
      <p>
        {t('plotGroupsIntro')}
      </p>

      <ul>
        <li>{t('plotGroupsItem1')}</li>
        <li>{t('plotGroupsItem2')}</li>
      </ul>

      <p>
        {t('groupsUsefulIntro')}
      </p>
      <ul>
        <li>{t('groupsUsefulItem1')}</li>
        <li>{t('groupsUsefulItem2')}</li>
        <li>{t('groupsUsefulItem3')}</li>
      </ul>

      <p>
        {t('structureHelpsDesc')}
      </p>

      <PlaceholderImage
        title={t('plotGroupsImageTitle')}
        description={t('plotGroupsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('whatsNextTitle')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/web/overview`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
