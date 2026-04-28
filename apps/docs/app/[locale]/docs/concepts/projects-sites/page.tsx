import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function ProjectsSitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.projectsSites');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="projects-sites"
    >
      <h2>{t('whatIsProjectTitle')}</h2>
      <p>
        {t('whatIsProjectIntro1')} <strong>{t('project')}</strong> {t('whatIsProjectIntro2')}
      </p>

      <p>
        {t('whatIsProjectIntro3')}
      </p>

      <PlaceholderImage
        title={t('projectOverviewImageTitle')}
        description={t('projectOverviewImageDesc')}
      />

      <h3>{t('projectDetailsTitle')}</h3>
      <p>{t('projectDetailsIntro')}</p>
      <ul>
        <li>
          <strong>{t('name')}</strong>: {t('nameDesc')}
        </li>
        <li>
          <strong>{t('projectType')}</strong>: {t('projectTypeDesc1')} <strong>{t('personal')}</strong> {t('projectTypeDesc2')}
        </li>
        <li>
          <strong>{t('location')}</strong>: {t('locationDesc')}
        </li>
      </ul>

      <p>
        {t('projectDetailsDesc1')}
      </p>

      <p>
        {t('projectDetailsDesc2')} <strong>{t('mobileApp')}</strong> {t('projectDetailsDesc2Mid')} <strong>{t('webDashboard')}</strong> {t('projectDetailsDesc2End')}
      </p>

      <h2>{t('whatIsSiteTitle')}</h2>
      <p>
        {t('whatIsSiteIntro1')} <strong>{t('site')}</strong> {t('whatIsSiteIntro2')}
      </p>

      <p>
        {t('whatIsSiteIntro3')} <strong>{t('manySites')}</strong>. {t('whatIsSiteIntro4')}
      </p>

      <PlaceholderImage
        title={t('sitesOnMapImageTitle')}
        description={t('sitesOnMapImageDesc')}
      />

      <h3>{t('siteDetailsTitle')}</h3>
      <p>{t('siteDetailsIntro')}</p>
      <ul>
        <li>
          <strong>{t('name')}</strong>: {t('siteNameDesc')}
        </li>
        <li>
          <strong>{t('siteType')}</strong>: {t('siteTypeDesc')}
        </li>
        <li>
          <strong>{t('boundary')}</strong>: {t('boundaryDesc')}
        </li>
      </ul>

      <h3>{t('definingBoundariesTitle')}</h3>
      <p>{t('definingBoundariesIntro')}</p>
      <ul>
        <li>
          <strong>{t('drawPolygon')}</strong>: {t('drawPolygonDesc')}
        </li>
        <li>
          <strong>{t('uploadGeoJSON')}</strong>: {t('uploadGeoJSONDesc')}
        </li>
        <li>
          <strong>{t('traceWithGPS')}</strong>: {t('traceWithGPSDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('siteBoundaryMethodsImageTitle')}
        description={t('siteBoundaryMethodsImageDesc')}
      />

      <h2>{t('accessPermissionsTitle')}</h2>
      <p>
        {t('accessPermissionsIntro')}
      </p>

      <h3>{t('projectLevelAccessTitle')}</h3>
      <p>
        {t('projectLevelAccessIntro')}{' '}
        <Link href={`/${locale}/docs/tutorials/team-collaboration`}>{t('teamCollaborationLink')}</Link>:
      </p>
      <ul>
        <li>
          <strong>{t('owner')}</strong> {t('and')} <strong>{t('admin')}</strong>: {t('ownerAdminDesc')}
        </li>
        <li>
          <strong>{t('contributor')}</strong>: {t('contributorDesc')}
        </li>
        <li>
          <strong>{t('observer')}</strong>: {t('observerDesc')}
        </li>
      </ul>

      <h3>{t('siteLevelAccessTitle')}</h3>
      <p>
        {t('siteLevelAccessIntro')}
      </p>
      <ul>
        <li>{t('siteLevelAccessItem1')}</li>
        <li>{t('siteLevelAccessItem2')}</li>
        <li>{t('siteLevelAccessItem3')}</li>
      </ul>

      <PlaceholderImage
        title={t('projectSiteAccessImageTitle')}
        description={t('projectSiteAccessImageDesc')}
      />

      <h2>{t('howWorkTogetherTitle')}</h2>
      <p>{t('howWorkTogetherIntro')}</p>
      <ul>
        <li>
          {t('howWorkTogetherItem1')} <strong>{t('project')}</strong> {t('howWorkTogetherItem1Rest')}
        </li>
        <li>
          <strong>{t('sites')}</strong> {t('howWorkTogetherItem2')}
        </li>
        <li>
          {t('howWorkTogetherItem3')}
        </li>
        <li>
          {t('howWorkTogetherItem4')}
        </li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{t('quickComparisonTitle')}</h4>
        <ul className="mb-0">
          <li>
            <strong>{t('project')}</strong>: {t('quickComparisonProject')}
          </li>
          <li>
            <strong>{t('site')}</strong>: {t('quickComparisonSite')}
          </li>
          <li>
            {t('quickComparisonItem3')}
          </li>
          <li>
            {t('quickComparisonItem4')}
          </li>
        </ul>
      </div>

      <h2>{t('whatsNextTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/project-creation`}>{t('nextLink1')}</Link> {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/site-creation`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/plots`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
