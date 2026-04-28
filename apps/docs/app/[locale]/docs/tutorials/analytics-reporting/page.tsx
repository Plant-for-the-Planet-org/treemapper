import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function AnalyticsReportingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.analyticsReporting');
  const tUi = await getTranslations('ui');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="analytics-reporting"
    >
      <p>
        {t('intro1')}
      </p>

      <PlaceholderImage
        title={t('analyticsDashboardImageTitle')}
        description={t('analyticsDashboardImageDesc')}
        aspectRatio="landscape"
      />

      <h2>{t('overviewDashboardTitle')}</h2>
      <p>
        {t('overviewDashboardDesc')}
      </p>

      <p>{t('currentlyGivesIntro')}</p>
      <ul>
        <li><strong>{t('speciesPlanted')}</strong>: {t('speciesPlantedDesc')}</li>
        <li><strong>{t('areaCoverage')}</strong>: {t('areaCoverageDesc')}</li>
        <li><strong>{t('numberOfContributors')}</strong>: {t('numberOfContributorsDesc')}</li>
        <li><strong>{t('treesPlanted')}</strong>: {t('treesPlantedDesc')}</li>
      </ul>

      <PlaceholderImage
        title={t('projectOverviewImageTitle')}
        description={t('projectOverviewImageDesc')}
        aspectRatio="landscape"
      />

      <h2>{t('barGraphTitle')}</h2>
      <p>
        {t('barGraphDesc')}
      </p>
      <ul>
        <li>{t('barGraphItem1')}</li>
        <li>{t('barGraphItem2')}</li>
        <li>{t('barGraphItem3')}</li>
        <li>{t('barGraphItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('treePlantationBarGraphImageTitle')}
        description={t('treePlantationBarGraphImageDesc')}
        aspectRatio="landscape"
      />

      <h2>{t('recentActivityTitle')}</h2>
      <p>
        {t('recentActivityDesc')}
      </p>
      <ul>
        <li>{t('recentActivityItem1')}</li>
        <li>{t('recentActivityItem2')}</li>
        <li>{t('recentActivityItem3')}</li>
        <li>{t('recentActivityItem4')}</li>
        <li>{t('recentActivityItem5')}</li>
        <li>{t('recentActivityItem6')}</li>
      </ul>

      <p>
        {t('recentActivityDesc2')}
      </p>

      <PlaceholderImage
        title={t('recentActivityFeedImageTitle')}
        description={t('recentActivityFeedImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('targetTrackerTitle')}</h2>
      <p>
        {t('targetTrackerIntro')}
      </p>
      <ul>
        <li>{t('targetTrackerItem1')}</li>
        <li>{t('targetTrackerItem2')}</li>
        <li>{t('targetTrackerItem3')}</li>
        <li>{t('targetTrackerItem4')}</li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.settingTargets')}</h4>
        <p className="mb-0">
          {t('settingTargetsDesc')}
        </p>
      </div>

      <PlaceholderImage
        title={t('targetTrackerImageTitle')}
        description={t('targetTrackerImageDesc')}
        aspectRatio="landscape"
      />

      <h2>{t('downloadReportsTitle')}</h2>
      <p>
        {t('downloadReportsIntro')}
      </p>
      <ul>
        <li>{t('downloadReportsItem1')}</li>
        <li>{t('downloadReportsItem2')}</li>
        <li>{t('downloadReportsItem3')}</li>
        <li>{t('downloadReportsItem4')}</li>
        <li>{t('downloadReportsItem5')}</li>
        <li>{t('downloadReportsItem6')}</li>
        <li>{t('downloadReportsItem7')}</li>
      </ul>

      <p>{t('toDownloadIntro')}</p>
      <ol>
        <li>{t('toDownloadStep1')}</li>
        <li>{t('toDownloadStep2')} <strong>{t('downloadReport')}</strong> {t('toDownloadStep2Mid')} <strong>{t('export')}</strong></li>
        <li>{t('toDownloadStep3')}</li>
        <li>{t('toDownloadStep4')}</li>
        <li>{t('toDownloadStep5')} <strong>{t('download')}</strong></li>
      </ol>

      <PlaceholderImage
        title={t('reportDownloadImageTitle')}
        description={t('reportDownloadImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">{tUi('alerts.reportUses')}</h4>
        <p className="mb-0">
          {t('reportUsesDesc')}
        </p>
      </div>

      <h2>{t('upcomingFeaturesTitle')}</h2>
      <p>
        {t('upcomingFeaturesIntro')}
      </p>
      <ul>
        <li><strong>{t('aiIntegration')}</strong>: {t('aiIntegrationDesc')}</li>
        <li>{t('upcomingFeaturesItem2')}</li>
        <li>{t('upcomingFeaturesItem3')}</li>
        <li>{t('upcomingFeaturesItem4')}</li>
        <li>{t('upcomingFeaturesItem5')}</li>
        <li>{t('upcomingFeaturesItem6')}</li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">{tUi('alerts.stayUpdated')}</h4>
        <p className="mb-0">
          {t('stayUpdatedDesc')}
        </p>
      </div>

      <h2>{t('whatsNextTitle')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/web-setup`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/monitoring-plots`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
