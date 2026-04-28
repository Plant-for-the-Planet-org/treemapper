import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function SitesManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.sitesManagement');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="sites-management"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('viewingSitesTitle')}</h2>
      <p>
        {t('viewingSitesDesc')}
      </p>

      <h3>{t('gridViewTitle')}</h3>
      <p>
        {t('gridViewDesc')}
      </p>

      <h3>{t('listViewTitle')}</h3>
      <p>
        {t('listViewDesc')}
      </p>

      <PlaceholderImage
        title={t('sitesListImageTitle')}
        description={t('sitesListImageDesc')}
      />

      <h2>{t('siteInformationTitle')}</h2>
      <p>{t('siteInformationIntro')}</p>
      <ul>
        <li>
          <strong>{t('siteName')}</strong>: {t('siteNameDesc')}
        </li>
        <li>
          <strong>{t('description')}</strong>: {t('descriptionDesc')}
        </li>
        <li>
          <strong>{t('creationDate')}</strong>: {t('creationDateDesc')}
        </li>
        <li>
          <strong>{t('creator')}</strong>: {t('creatorDesc')}
        </li>
        <li>
          <strong>{t('lastUpdated')}</strong>: {t('lastUpdatedDesc')}
        </li>
        <li>
          <strong>{t('area')}</strong>: {t('areaDesc')}
        </li>
        <li>
          <strong>{t('status')}</strong>: {t('statusDesc')}
        </li>
        <li>
          <strong>{t('members')}</strong>: {t('membersDesc')}
        </li>
      </ul>

      <h2>{t('searchingFilteringTitle')}</h2>
      <p>{t('searchingFilteringIntro')}</p>
      <ul>
        <li>
          <strong>{t('searchByName')}</strong>: {t('searchByNameDesc')}
        </li>
        <li>
          <strong>{t('statusFilter')}</strong>: {t('statusFilterDesc')}
        </li>
        <li>
          <strong>{t('sortableColumns')}</strong>: {t('sortableColumnsDesc')}
        </li>
      </ul>

      <h2>{t('creatingNewSiteTitle')}</h2>
      <p>
        {t('creatingNewSiteDesc')}
      </p>

      <h3>{t('siteDetailsTitle')}</h3>
      <p>{t('siteDetailsIntro')}</p>
      <ul>
        <li>
          <strong>{t('siteName')}</strong>: {t('siteNameDesc2')}
        </li>
        <li>
          <strong>{t('description')}</strong>: {t('descriptionDesc2')}
        </li>
        <li>
          <strong>{t('siteType')}</strong>: {t('siteTypeDesc')}
        </li>
      </ul>

      <h3>{t('definingBoundariesTitle')}</h3>
      <p>{t('definingBoundariesIntro')}</p>

      <h4>{t('drawOnMapTitle')}</h4>
      <p>
        {t('drawOnMapDesc')}
      </p>

      <h4>{t('uploadGeoJsonTitle')}</h4>
      <p>
        {t('uploadGeoJsonDesc')}
      </p>

      <PlaceholderImage
        title={t('siteCreationImageTitle')}
        description={t('siteCreationImageDesc')}
      />

      <h3>{t('areaCalculationTitle')}</h3>
      <p>
        {t('areaCalculationDesc')}
      </p>

      <h2>{t('editingSitesTitle')}</h2>
      <p>
        {t('editingSitesDesc')}
      </p>

      <h3>{t('editableFieldsTitle')}</h3>
      <ul>
        <li>{t('editableFieldsItem1')}</li>
        <li>{t('editableFieldsItem2')}</li>
        <li>{t('editableFieldsItem3')}</li>
      </ul>

      <h3>{t('inPlaceEditingTitle')}</h3>
      <p>
        {t('inPlaceEditingDesc')}
      </p>

      <h3>{t('geometryUpdatesTitle')}</h3>
      <p>
        {t('geometryUpdatesDesc')}
      </p>

      <h2>{t('siteAccessControlTitle')}</h2>
      <p>
        {t('siteAccessControlDesc')}
      </p>

      <h3>{t('managingAccessTitle')}</h3>
      <ol>
        <li>{t('managingAccessItem1')}</li>
        <li>{t('managingAccessItem2')}</li>
        <li>{t('managingAccessItem3')}</li>
      </ol>

      <h3>{t('accessLevelsTitle')}</h3>
      <p>
        {t('accessLevelsDesc')}
      </p>

      <PlaceholderImage
        title={t('siteAccessImageTitle')}
        description={t('siteAccessImageDesc')}
      />

      <h2>{t('deletingSitesTitle')}</h2>
      <p>
        {t('deletingSitesDesc')}
      </p>
      <ol>
        <li>{t('deletingSitesItem1')}</li>
        <li>{t('deletingSitesItem2')}</li>
        <li>{t('deletingSitesItem3')}</li>
      </ol>
      <p>
        <strong>{t('note')}</strong>: {t('deletingSitesNote')}
      </p>

      <h2>{t('siteTypesTitle')}</h2>
      <p>{t('siteTypesIntro')}</p>

      <h3>{t('planting')}</h3>
      <p>{t('plantingDesc')}</p>

      <h3>{t('planted')}</h3>
      <p>{t('plantedDesc')}</p>

      <h3>{t('barren')}</h3>
      <p>{t('barrenDesc')}</p>

      <h3>{t('reforestation')}</h3>
      <p>{t('reforestationDesc')}</p>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('namingConventionsTitle')}</h3>
      <ul>
        <li>{t('namingConventionsItem1')}</li>
        <li>{t('namingConventionsItem2')}</li>
        <li>{t('namingConventionsItem3')}</li>
      </ul>

      <h3>{t('boundaryAccuracyTitle')}</h3>
      <ul>
        <li>{t('boundaryAccuracyItem1')}</li>
        <li>{t('boundaryAccuracyItem2')}</li>
        <li>{t('boundaryAccuracyItem3')}</li>
      </ul>

      <h3>{t('accessManagementTitle')}</h3>
      <ul>
        <li>{t('accessManagementItem1')}</li>
        <li>{t('accessManagementItem2')}</li>
        <li>{t('accessManagementItem3')}</li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/projects-sites`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/tutorials/site-creation`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/team-management`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
