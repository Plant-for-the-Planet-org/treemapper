import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function SpeciesManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.speciesManagement');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="species-management"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('speciesTypesTitle')}</h2>
      <p>{t('speciesTypesIntro')}</p>

      <h3>{t('scientificSpeciesTitle')}</h3>
      <p>
        {t('scientificSpeciesDesc')}
      </p>
      <ul>
        <li>{t('scientificSpeciesItem1')}</li>
        <li>{t('scientificSpeciesItem2')}</li>
        <li>{t('scientificSpeciesItem3')}</li>
        <li>{t('scientificSpeciesItem4')}</li>
      </ul>

      <h3>{t('unknownSpeciesTitle')}</h3>
      <p>
        {t('unknownSpeciesDesc')}
      </p>
      <ul>
        <li>{t('unknownSpeciesItem1')}</li>
        <li>{t('unknownSpeciesItem2')}</li>
        <li>{t('unknownSpeciesItem3')}</li>
      </ul>
      <p>
        {t('unknownSpeciesNote')}
      </p>

      <PlaceholderImage
        title={t('speciesGridImageTitle')}
        description={t('speciesGridImageDesc')}
      />

      <h2>{t('viewingSpeciesTitle')}</h2>
      <p>{t('viewingSpeciesIntro')}</p>

      <h3>{t('speciesCardInformationTitle')}</h3>
      <ul>
        <li>
          <strong>{t('speciesImage')}</strong>: {t('speciesImageDesc')}
        </li>
        <li>
          <strong>{t('scientificName')}</strong>: {t('scientificNameDesc')}
        </li>
        <li>
          <strong>{t('commonName')}</strong>: {t('commonNameDesc')}
        </li>
        <li>
          <strong>{t('usageCount')}</strong>: {t('usageCountDesc')}
        </li>
        <li>
          <strong>{t('interventionCount')}</strong>: {t('interventionCountDesc')}
        </li>
        <li>
          <strong>{t('status')}</strong>: {t('statusDesc')}
        </li>
        <li>
          <strong>{t('favoriteIndicator')}</strong>: {t('favoriteIndicatorDesc')}
        </li>
      </ul>

      <h2>{t('searchAndFilterTitle')}</h2>
      <p>{t('searchAndFilterIntro')}</p>

      <h3>{t('search')}</h3>
      <p>{t('searchDesc')}</p>

      <h3>{t('filterOptionsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('speciesType')}</strong>: {t('speciesTypeDesc')}
        </li>
        <li>
          <strong>{t('source')}</strong>: {t('sourceDesc')}
        </li>
        <li>
          <strong>{t('interventionType')}</strong>: {t('interventionTypeDesc')}
        </li>
        <li>
          <strong>{t('showDisabled')}</strong>: {t('showDisabledDesc')}
        </li>
      </ul>

      <h3>{t('sorting')}</h3>
      <p>{t('sortingIntro')}</p>
      <ul>
        <li>{t('sortingItem1')}</li>
        <li>{t('sortingItem2')}</li>
        <li>{t('sortingItem3')}</li>
        <li>{t('sortingItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('speciesFiltersImageTitle')}
        description={t('speciesFiltersImageDesc')}
      />

      <h2>{t('speciesDetailsTitle')}</h2>
      <p>{t('speciesDetailsIntro')}</p>

      <h3>{t('basicInformationTitle')}</h3>
      <ul>
        <li>{t('basicInformationItem1')}</li>
        <li>{t('basicInformationItem2')}</li>
        <li>{t('basicInformationItem3')}</li>
        <li>{t('basicInformationItem4')}</li>
      </ul>

      <h3>{t('metadata')}</h3>
      <ul>
        <li>
          <strong>{t('habitat')}</strong>: {t('habitatDesc')}
        </li>
        <li>
          <strong>{t('height')}</strong>: {t('heightDesc')}
        </li>
        <li>
          <strong>{t('flowers')}</strong>: {t('flowersDesc')}
        </li>
        <li>
          <strong>{t('bloomingSeason')}</strong>: {t('bloomingSeasonDesc')}
        </li>
      </ul>

      <h3>{t('usageStatisticsTitle')}</h3>
      <ul>
        <li>{t('usageStatisticsItem1')}</li>
        <li>{t('usageStatisticsItem2')}</li>
        <li>{t('usageStatisticsItem3')}</li>
        <li>{t('usageStatisticsItem4')}</li>
      </ul>

      <h2>{t('addingSpeciesTitle')}</h2>

      <h3>{t('fromScientificDatabaseTitle')}</h3>
      <p>{t('fromScientificDatabaseIntro')}</p>
      <ol>
        <li>{t('fromScientificDatabaseItem1')}</li>
        <li>{t('fromScientificDatabaseItem2')}</li>
        <li>{t('fromScientificDatabaseItem3')}</li>
        <li>{t('fromScientificDatabaseItem4')}</li>
        <li>{t('fromScientificDatabaseItem5')}</li>
        <li>{t('fromScientificDatabaseItem6')}</li>
      </ol>

      <h3>{t('requestingNewSpeciesTitle')}</h3>
      <p>{t('requestingNewSpeciesIntro')}</p>
      <ol>
        <li>{t('requestingNewSpeciesItem1')}</li>
        <li>{t('requestingNewSpeciesItem2')}</li>
        <li>{t('requestingNewSpeciesItem3')}</li>
        <li>{t('requestingNewSpeciesItem4')}</li>
        <li>{t('requestingNewSpeciesItem5')}</li>
      </ol>

      <PlaceholderImage
        title={t('addSpeciesImageTitle')}
        description={t('addSpeciesImageDesc')}
      />

      <h2>{t('editingSpeciesTitle')}</h2>
      <p>{t('editingSpeciesIntro')}</p>

      <h3>{t('editableFieldsTitle')}</h3>
      <ul>
        <li>{t('editableFieldsItem1')}</li>
        <li>{t('editableFieldsItem2')}</li>
        <li>{t('editableFieldsItem3')}</li>
        <li>{t('editableFieldsItem4')}</li>
        <li>{t('editableFieldsItem5')}</li>
        <li>{t('editableFieldsItem6')}</li>
      </ul>

      <h3>{t('imageManagementTitle')}</h3>
      <p>{t('imageManagementIntro')}</p>
      <ul>
        <li>{t('imageManagementItem1')}</li>
        <li>{t('imageManagementItem2')}</li>
        <li>{t('imageManagementItem3')}</li>
      </ul>

      <h2>{t('managingUnknownSpeciesTitle')}</h2>
      <p>{t('managingUnknownSpeciesDesc')}</p>

      <h3>{t('individualAssignmentTitle')}</h3>
      <ol>
        <li>{t('individualAssignmentItem1')}</li>
        <li>{t('individualAssignmentItem2')}</li>
        <li>{t('individualAssignmentItem3')}</li>
        <li>{t('individualAssignmentItem4')}</li>
      </ol>

      <h3>{t('bulkAssignmentTitle')}</h3>
      <p>{t('bulkAssignmentIntro')}</p>
      <ol>
        <li>{t('bulkAssignmentItem1')}</li>
        <li>{t('bulkAssignmentItem2')}</li>
        <li>{t('bulkAssignmentItem3')}</li>
        <li>{t('bulkAssignmentItem4')}</li>
      </ol>

      <PlaceholderImage
        title={t('speciesAssignmentImageTitle')}
        description={t('speciesAssignmentImageDesc')}
      />

      <h2>{t('speciesStatusTitle')}</h2>

      <h3>{t('activeSpeciesTitle')}</h3>
      <p>
        {t('activeSpeciesDesc')}
      </p>

      <h3>{t('disabledSpeciesTitle')}</h3>
      <p>
        {t('disabledSpeciesDesc')}
      </p>
      <ul>
        <li>{t('disabledSpeciesItem1')}</li>
        <li>{t('disabledSpeciesItem2')}</li>
        <li>{t('disabledSpeciesItem3')}</li>
      </ul>
      <p>
        <strong>{t('note')}</strong>: {t('disabledSpeciesNote')}
      </p>

      <h2>{t('favorites')}</h2>
      <p>{t('favoritesDesc')}</p>
      <ul>
        <li>{t('favoritesItem1')}</li>
        <li>{t('favoritesItem2')}</li>
        <li>{t('favoritesItem3')}</li>
      </ul>

      <h2>{t('deletingSpeciesTitle')}</h2>
      <p>
        {t('deletingSpeciesDesc')}
      </p>
      <ul>
        <li>{t('deletingSpeciesItem1')}</li>
        <li>{t('deletingSpeciesItem2')}</li>
        <li>{t('deletingSpeciesItem3')}</li>
      </ul>
      <p>
        {t('deletingSpeciesNote')}
      </p>

      <h2>{t('dataExportTitle')}</h2>
      <p>{t('dataExportIntro')}</p>
      <ul>
        <li>{t('dataExportItem1')}</li>
        <li>{t('dataExportItem2')}</li>
        <li>{t('dataExportItem3')}</li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('speciesOrganizationTitle')}</h3>
      <ul>
        <li>
          <strong>{t('standardizeNames')}</strong>: {t('standardizeNamesDesc')}
        </li>
        <li>
          <strong>{t('addImages')}</strong>: {t('addImagesDesc')}
        </li>
        <li>
          <strong>{t('useFavorites')}</strong>: {t('useFavoritesDesc')}
        </li>
        <li>
          <strong>{t('reviewUnknowns')}</strong>: {t('reviewUnknownsDesc')}
        </li>
      </ul>

      <h3>{t('dataQualityTitle')}</h3>
      <ul>
        <li>
          <strong>{t('verifyScientificNames')}</strong>: {t('verifyScientificNamesDesc')}
        </li>
        <li>
          <strong>{t('documentLocalNames')}</strong>: {t('documentLocalNamesDesc')}
        </li>
        <li>
          <strong>{t('addMetadata')}</strong>: {t('addMetadataDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/managing-species`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/data-export`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
