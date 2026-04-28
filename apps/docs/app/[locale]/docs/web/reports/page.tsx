import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.reports');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="reports"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('forestChampionsLeaderboardTitle')}</h2>
      <p>
        {t('forestChampionsLeaderboardDesc')}
      </p>

      <PlaceholderImage
        title={t('leaderboardImageTitle')}
        description={t('leaderboardImageDesc')}
      />

      <h3>{t('rankingMetricsTitle')}</h3>
      <p>{t('rankingMetricsDesc')}</p>
      <ul>
        <li>
          <strong>{t('treesPlanted')}</strong>: {t('treesPlantedDesc')}
        </li>
        <li>
          <strong>{t('interventions')}</strong>: {t('interventionsDesc')}
        </li>
        <li>
          <strong>{t('speciesCount')}</strong>: {t('speciesCountDesc')}
        </li>
      </ul>

      <h3>{t('memberInformationTitle')}</h3>
      <p>{t('memberInformationIntro')}</p>
      <ul>
        <li>{t('memberInformationItem1')}</li>
        <li>{t('memberInformationItem2')}</li>
        <li>{t('memberInformationItem3')}</li>
        <li>{t('memberInformationItem4')}</li>
        <li>{t('memberInformationItem5')}</li>
      </ul>

      <h3>{t('expandableDetailsTitle')}</h3>
      <p>
        {t('expandableDetailsDesc')}
      </p>

      <h3>{t('timeBasedFilteringTitle')}</h3>
      <p>{t('timeBasedFilteringIntro')}</p>
      <ul>
        <li>
          <strong>{t('allTime')}</strong>: {t('allTimeDesc')}
        </li>
        <li>
          <strong>{t('thisYear')}</strong>: {t('thisYearDesc')}
        </li>
        <li>
          <strong>{t('thisMonth')}</strong>: {t('thisMonthDesc')}
        </li>
      </ul>
      <p>
        {t('timeBasedFilteringNote')}
      </p>

      <h2>{t('geographicAnalyticsTitle')}</h2>
      <p>
        {t('geographicAnalyticsDesc')}
      </p>

      <h3>{t('mapFeaturesTitle')}</h3>
      <ul>
        <li>
          <strong>{t('siteLocations')}</strong>: {t('siteLocationsDesc')}
        </li>
        <li>
          <strong>{t('areaCoverage')}</strong>: {t('areaCoverageDesc')}
        </li>
        <li>
          <strong>{t('interventionDistribution')}</strong>: {t('interventionDistributionDesc')}
        </li>
      </ul>

      <h3>{t('mapControlsTitle')}</h3>
      <ul>
        <li>{t('mapControlsItem1')}</li>
        <li>{t('mapControlsItem2')}</li>
        <li>{t('mapControlsItem3')}</li>
      </ul>

      <PlaceholderImage
        title={t('geographicMapImageTitle')}
        description={t('geographicMapImageDesc')}
      />

      <h2>{t('dashboardAnalyticsTitle')}</h2>
      <p>
        {t('dashboardAnalyticsDesc')}
      </p>

      <h3>{t('keyMetricsTitle')}</h3>
      <ul>
        <li>{t('keyMetricsItem1')}</li>
        <li>{t('keyMetricsItem2')}</li>
        <li>{t('keyMetricsItem3')}</li>
        <li>{t('keyMetricsItem4')}</li>
      </ul>

      <h3>{t('progressTrackingTitle')}</h3>
      <ul>
        <li>{t('progressTrackingItem1')}</li>
        <li>{t('progressTrackingItem2')}</li>
        <li>{t('progressTrackingItem3')}</li>
      </ul>

      <h3>{t('timeSeriesChartsTitle')}</h3>
      <p>
        {t('timeSeriesChartsDesc')}
      </p>

      <h2>{t('dataExportTitle')}</h2>
      <p>
        {t('dataExportDesc')}
      </p>

      <h3>{t('exportOptionsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('interventionData')}</strong>: {t('interventionDataDesc')}
        </li>
        <li>
          <strong>{t('dateFiltering')}</strong>: {t('dateFilteringDesc')}
        </li>
        <li>
          <strong>{t('csvFormat')}</strong>: {t('csvFormatDesc')}
        </li>
      </ul>

      <h3>{t('whatsIncludedTitle')}</h3>
      <p>{t('whatsIncludedIntro')}</p>
      <ul>
        <li>{t('whatsIncludedItem1')}</li>
        <li>{t('whatsIncludedItem2')}</li>
        <li>{t('whatsIncludedItem3')}</li>
        <li>{t('whatsIncludedItem4')}</li>
        <li>{t('whatsIncludedItem5')}</li>
      </ul>

      <PlaceholderImage
        title={t('exportOptionsImageTitle')}
        description={t('exportOptionsImageDesc')}
      />

      <h2>{t('reportGenerationTitle')}</h2>
      <p>
        {t('reportGenerationDesc')}
      </p>

      <h3>{t('dateRangeSelectionTitle')}</h3>
      <p>
        {t('dateRangeSelectionDesc')}
      </p>

      <h3>{t('reportContentsTitle')}</h3>
      <p>{t('reportContentsIntro')}</p>
      <ul>
        <li>{t('reportContentsItem1')}</li>
        <li>{t('reportContentsItem2')}</li>
        <li>{t('reportContentsItem3')}</li>
        <li>{t('reportContentsItem4')}</li>
        <li>{t('reportContentsItem5')}</li>
      </ul>

      <h2>{t('infiniteScrollTitle')}</h2>
      <p>
        {t('infiniteScrollDesc')}
      </p>
      <ul>
        <li>{t('infiniteScrollItem1')}</li>
        <li>{t('infiniteScrollItem2')}</li>
        <li>{t('infiniteScrollItem3')}</li>
        <li>{t('infiniteScrollItem4')}</li>
      </ul>

      <h2>{t('roleBasedAccessTitle')}</h2>
      <p>{t('roleBasedAccessDesc')}</p>

      <h3>{t('adminOwnerTitle')}</h3>
      <ul>
        <li>{t('adminOwnerItem1')}</li>
        <li>{t('adminOwnerItem2')}</li>
        <li>{t('adminOwnerItem3')}</li>
      </ul>

      <h3>{t('contributorObserverTitle')}</h3>
      <ul>
        <li>{t('contributorObserverItem1')}</li>
        <li>{t('contributorObserverItem2')}</li>
        <li>{t('contributorObserverItem3')}</li>
      </ul>

      <h2>{t('usingAnalyticsEffectivelyTitle')}</h2>

      <h3>{t('progressMonitoringTitle')}</h3>
      <ul>
        <li>{t('progressMonitoringItem1')}</li>
        <li>{t('progressMonitoringItem2')}</li>
        <li>{t('progressMonitoringItem3')}</li>
      </ul>

      <h3>{t('teamMotivationTitle')}</h3>
      <ul>
        <li>{t('teamMotivationItem1')}</li>
        <li>{t('teamMotivationItem2')}</li>
        <li>{t('teamMotivationItem3')}</li>
      </ul>

      <h3>{t('stakeholderReportingTitle')}</h3>
      <ul>
        <li>{t('stakeholderReportingItem1')}</li>
        <li>{t('stakeholderReportingItem2')}</li>
        <li>{t('stakeholderReportingItem3')}</li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('regularReviewTitle')}</h3>
      <ul>
        <li>
          <strong>{t('weeklyCheckIns')}</strong>: {t('weeklyCheckInsDesc')}
        </li>
        <li>
          <strong>{t('monthlyReviews')}</strong>: {t('monthlyReviewsDesc')}
        </li>
        <li>
          <strong>{t('quarterlyReports')}</strong>: {t('quarterlyReportsDesc')}
        </li>
      </ul>

      <h3>{t('dataQualityTitle')}</h3>
      <ul>
        <li>
          <strong>{t('verifyEntries')}</strong>: {t('verifyEntriesDesc')}
        </li>
        <li>
          <strong>{t('completeRecords')}</strong>: {t('completeRecordsDesc')}
        </li>
        <li>
          <strong>{t('syncRegularly')}</strong>: {t('syncRegularlyDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/web/overview`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/data-export`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/team-management`}>{t('relatedLink3')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/analytics-reporting`}>{t('relatedLink4')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
