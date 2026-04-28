import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function MapNavigationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.mapNavigation');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="map-navigation"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <PlaceholderImage
        title={t('mapInterfaceImageTitle')}
        description={t('mapInterfaceImageDesc')}
      />

      <h2>{t('mapViewsTitle')}</h2>
      <p>{t('mapViewsIntro')}</p>

      <h3>{t('standardMapViewTitle')}</h3>
      <p>
        {t('standardMapViewDesc')}
      </p>

      <h3>{t('satelliteViewTitle')}</h3>
      <p>
        {t('satelliteViewIntro')}
      </p>
      <ul>
        <li>{t('satelliteViewItem1')}</li>
        <li>{t('satelliteViewItem2')}</li>
        <li>{t('satelliteViewItem3')}</li>
        <li>{t('satelliteViewItem4')}</li>
      </ul>
      <p>
        {t('satelliteViewDesc')}
      </p>

      <h2>{t('mapElementsTitle')}</h2>

      <h3>{t('interventionsTitle')}</h3>
      <p>
        {t('interventionsDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('clusteredMarkers')}</strong>: {t('clusteredMarkersDesc')}
        </li>
        <li>
          <strong>{t('individualMarkers')}</strong>: {t('individualMarkersDesc')}
        </li>
        <li>
          <strong>{t('polygonShapes')}</strong>: {t('polygonShapesDesc')}
        </li>
      </ul>

      <h3>{t('sitesTitle')}</h3>
      <p>
        {t('sitesDesc')}
      </p>

      <h3>{t('sampleTreesTitle')}</h3>
      <p>
        {t('sampleTreesDesc')}
      </p>

      <PlaceholderImage
        title={t('sampleTreesImageTitle')}
        description={t('sampleTreesImageDesc')}
      />

      <h2>{t('interactingTitle')}</h2>

      <h3>{t('selectingInterventionsTitle')}</h3>
      <p>
        {t('selectingInterventionsDesc')}
      </p>
      <ul>
        <li>{t('selectingInterventionsItem1')}</li>
        <li>{t('selectingInterventionsItem2')}</li>
        <li>{t('selectingInterventionsItem3')}</li>
        <li>{t('selectingInterventionsItem4')}</li>
      </ul>
      <p>{t('selectingInterventionsNote')}</p>

      <h3>{t('userLocationTitle')}</h3>
      <p>
        {t('userLocationDesc')}
      </p>

      <h3>{t('zoomAndPanTitle')}</h3>
      <ul>
        <li>
          <strong>{t('pinchToZoom')}</strong>: {t('pinchToZoomDesc')}
        </li>
        <li>
          <strong>{t('dragToPan')}</strong>: {t('dragToPanDesc')}
        </li>
        <li>
          <strong>{t('doubleTap')}</strong>: {t('doubleTapDesc')}
        </li>
        <li>
          <strong>{t('zoomScale')}</strong>: {t('zoomScaleDesc')}
        </li>
      </ul>

      <h2>{t('filteringTitle')}</h2>
      <p>
        {t('filteringIntro')}
      </p>

      <h3>{t('filterByTypeTitle')}</h3>
      <p>
        {t('filterByTypeDesc')}
      </p>

      <h3>{t('filterByDateTitle')}</h3>
      <p>{t('filterByDateDesc')}</p>

      <h3>{t('filterByStatusTitle')}</h3>
      <p>{t('filterByStatusDesc')}</p>

      <h3>{t('remeasurementFilterTitle')}</h3>
      <p>
        {t('remeasurementFilterDesc')}
      </p>

      <PlaceholderImage
        title={t('mapFiltersImageTitle')}
        description={t('mapFiltersImageDesc')}
      />

      <h2>{t('gpsAccuracyTitle')}</h2>
      <p>
        {t('gpsAccuracyDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('highAccuracy')}</strong>: {t('highAccuracyDesc')}
        </li>
        <li>
          <strong>{t('mediumAccuracy')}</strong>: {t('mediumAccuracyDesc')}
        </li>
        <li>
          <strong>{t('lowAccuracy')}</strong>: {t('lowAccuracyDesc')}
        </li>
      </ul>
      <p>
        {t('gpsAccuracyNote')}
      </p>

      <h2>{t('tipsTitle')}</h2>
      <ul>
        <li>
          <strong>{t('tip1Bold')}</strong>: {t('tip1Desc')}
        </li>
        <li>
          <strong>{t('tip2Bold')}</strong>: {t('tip2Desc')}
        </li>
        <li>
          <strong>{t('tip3Bold')}</strong>: {t('tip3Desc')}
        </li>
        <li>
          <strong>{t('tip4Bold')}</strong>: {t('tip4Desc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/offline-maps`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/remeasurement`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
