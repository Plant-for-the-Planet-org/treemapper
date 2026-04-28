import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.dashboardOverview');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="dashboard-overview"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <PlaceholderImage
        title={t('dashboardHomeImageTitle')}
        description={t('dashboardHomeImageDesc')}
      />

      <h2>{t('dashboardStatisticsTitle')}</h2>
      <p>
        {t('dashboardStatisticsDesc')}
      </p>

      <h3>{t('treesPlantedTitle')}</h3>
      <p>
        {t('treesPlantedDesc')}
      </p>

      <h3>{t('speciesPlantedTitle')}</h3>
      <p>
        {t('speciesPlantedDesc')}
      </p>

      <h3>{t('areaCoveredTitle')}</h3>
      <p>
        {t('areaCoveredDesc')}
      </p>

      <h3>{t('fieldDataCollectorsTitle')}</h3>
      <p>
        {t('fieldDataCollectorsDesc')}
      </p>

      <h3>{t('trendIndicatorsTitle')}</h3>
      <p>{t('trendIndicatorsIntro')}</p>
      <ul>
        <li>
          <strong>{t('percentageChange')}</strong>: {t('percentageChangeDesc')}
        </li>
        <li>
          <strong>{t('direction')}</strong>: {t('directionDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('statisticsCardsImageTitle')}
        description={t('statisticsCardsImageDesc')}
      />

      <h2>{t('dateRangeFilteringTitle')}</h2>
      <p>
        {t('dateRangeFilteringDesc')}
      </p>
      <ul>
        <li>{t('dateRangeItem1')}</li>
        <li>{t('dateRangeItem2')}</li>
        <li>{t('dateRangeItem3')}</li>
        <li>{t('dateRangeItem4')}</li>
        <li>{t('dateRangeItem5')}</li>
        <li>{t('dateRangeItem6')}</li>
        <li>{t('dateRangeItem7')}</li>
      </ul>
      <p>
        {t('dateRangeFilteringNote')}
      </p>

      <h2>{t('forestProgressTitle')}</h2>
      <p>
        {t('forestProgressDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('progressBar')}</strong>: {t('progressBarDesc')}
        </li>
        <li>
          <strong>{t('currentCount')}</strong>: {t('currentCountDesc')}
        </li>
        <li>
          <strong>{t('targetGoal')}</strong>: {t('targetGoalDesc')}
        </li>
        <li>
          <strong>{t('percentageComplete')}</strong>: {t('percentageCompleteDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('forestProgressImageTitle')}
        description={t('forestProgressImageDesc')}
      />

      <h2>{t('treePlantingChartTitle')}</h2>
      <p>
        {t('treePlantingChartDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('monthlyView')}</strong>: {t('monthlyViewDesc')}
        </li>
        <li>
          <strong>{t('historicalData')}</strong>: {t('historicalDataDesc')}
        </li>
        <li>
          <strong>{t('interactiveTooltips')}</strong>: {t('interactiveTooltipsDesc')}
        </li>
      </ul>

      <h2>{t('recentAdditionsTitle')}</h2>
      <p>
        {t('recentAdditionsDesc')}
      </p>
      <ul>
        <li>{t('recentAdditionsItem1')}</li>
        <li>{t('recentAdditionsItem2')}</li>
        <li>{t('recentAdditionsItem3')}</li>
      </ul>
      <p>{t('recentAdditionsNote')}</p>

      <h2>{t('dashboardTabsTitle')}</h2>
      <p>{t('dashboardTabsIntro')}</p>

      <h3>{t('overviewTabTitle')}</h3>
      <p>
        {t('overviewTabDesc')}
      </p>

      <h3>{t('leaderboardTabTitle')}</h3>
      <p>
        {t('leaderboardTabDesc')}
      </p>

      <h3>{t('mapTabTitle')}</h3>
      <p>
        {t('mapTabDesc')}
      </p>

      <PlaceholderImage
        title={t('dashboardTabsImageTitle')}
        description={t('dashboardTabsImageDesc')}
      />

      <h2>{t('roleBasedAccessTitle')}</h2>
      <p>
        {t('roleBasedAccessDesc')}
      </p>

      <h3>{t('adminOwnerTitle')}</h3>
      <p>{t('adminOwnerIntro')}</p>
      <ul>
        <li>{t('adminOwnerItem1')}</li>
        <li>{t('adminOwnerItem2')}</li>
        <li>{t('adminOwnerItem3')}</li>
        <li>{t('adminOwnerItem4')}</li>
      </ul>

      <h3>{t('contributorTitle')}</h3>
      <p>{t('contributorIntro')}</p>
      <ul>
        <li>{t('contributorItem1')}</li>
        <li>{t('contributorItem2')}</li>
        <li>{t('contributorItem3')}</li>
      </ul>

      <h3>{t('observerTitle')}</h3>
      <p>{t('observerIntro')}</p>
      <ul>
        <li>{t('observerItem1')}</li>
        <li>{t('observerItem2')}</li>
        <li>{t('observerItem3')}</li>
      </ul>

      <h2>{t('dataExportTitle')}</h2>
      <p>
        {t('dataExportDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('csvReports')}</strong>: {t('csvReportsDesc')}
        </li>
        <li>
          <strong>{t('dateFiltering')}</strong>: {t('dateFilteringDesc')}
        </li>
        <li>
          <strong>{t('projectStatistics')}</strong>: {t('projectStatisticsDesc')}
        </li>
      </ul>
      <p>
        {t('dataExportNote')} <Link href={`/${locale}/docs/concepts/data-export`}>{t('dataExportLink')}</Link> {t('dataExportNoteEnd')}
      </p>

      <h2>{t('navigationTitle')}</h2>
      <p>
        {t('navigationDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('overview')}</strong>: {t('overviewDesc')}
        </li>
        <li>
          <strong>{t('sites')}</strong>: {t('sitesDesc')}
        </li>
        <li>
          <strong>{t('interventions')}</strong>: {t('interventionsDesc')}
        </li>
        <li>
          <strong>{t('species')}</strong>: {t('speciesDesc')}
        </li>
        <li>
          <strong>{t('team')}</strong>: {t('teamDesc')}
        </li>
        <li>
          <strong>{t('reports')}</strong>: {t('reportsDesc')}
        </li>
        <li>
          <strong>{t('settings')}</strong>: {t('settingsDesc')}
        </li>
      </ul>

      <h2>{t('gettingStartedTitle')}</h2>
      <p>{t('gettingStartedIntro')}</p>
      <ol>
        <li>{t('gettingStartedItem1')}</li>
        <li>{t('gettingStartedItem2')}</li>
        <li>{t('gettingStartedItem3')}</li>
        <li>{t('gettingStartedItem4')}</li>
        <li>{t('gettingStartedItem5')}</li>
      </ol>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/web/sites-management`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/team-management`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/reports`}>{t('relatedLink3')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/data-export`}>{t('relatedLink4')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
