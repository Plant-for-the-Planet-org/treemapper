import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function CreatingInterventionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.creatingInterventions');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="creating-interventions"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('interventionTypesTitle')}</h2>
      <p>{t('interventionTypesIntro')}</p>

      <h3>{t('plantingInterventionsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('singleTreePlanting')}</strong>: {t('singleTreePlantingDesc')}
        </li>
        <li>
          <strong>{t('multiTreePlanting')}</strong>: {t('multiTreePlantingDesc')}
        </li>
        <li>
          <strong>{t('assistedRegeneration')}</strong>: {t('assistedRegenerationDesc')}
        </li>
      </ul>

      <h3>{t('maintenanceInterventionsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('maintenance')}</strong>: {t('maintenanceDesc')}
        </li>
        <li>
          <strong>{t('fireSuppression')}</strong>: {t('fireSuppressionDesc')}
        </li>
        <li>
          <strong>{t('firePatrol')}</strong>: {t('firePatrolDesc')}
        </li>
        <li>
          <strong>{t('fencing')}</strong>: {t('fencingDesc')}
        </li>
      </ul>

      <h3>{t('removalOtherTitle')}</h3>
      <ul>
        <li>
          <strong>{t('invasiveRemoval')}</strong>: {t('invasiveRemovalDesc')}
        </li>
        <li>
          <strong>{t('grassSuppression')}</strong>: {t('grassSuppressionDesc')}
        </li>
        <li>
          <strong>{t('markingRegenerant')}</strong>: {t('markingRegenerantDesc')}
        </li>
        <li>
          <strong>{t('soilImprovement')}</strong>: {t('soilImprovementDesc')}
        </li>
        <li>
          <strong>{t('stopHarvesting')}</strong>: {t('stopHarvestingDesc')}
        </li>
        <li>
          <strong>{t('directSeeding')}</strong>: {t('directSeedingDesc')}
        </li>
        <li>
          <strong>{t('other')}</strong>: {t('otherDesc')}
        </li>
      </ul>

      <h2>{t('stepByStepTitle')}</h2>

      <h3>{t('step1Title')}</h3>
      <p>
        {t('step1Desc')}
      </p>

      <PlaceholderImage
        title={t('newInterventionFormImageTitle')}
        description={t('newInterventionFormImageDesc')}
      />

      <h3>{t('step2Title')}</h3>
      <p>
        {t('step2Desc')}
      </p>

      <h3>{t('step3Title')}</h3>
      <p>{t('step3Desc')}</p>

      <h3>{t('step4Title')}</h3>
      <p>
        {t('step4Desc')}
      </p>

      <h3>{t('step5Title')}</h3>
      <p>
        {t('step5Desc')}
      </p>

      <h2>{t('markingLocationTitle')}</h2>
      <p>
        {t('markingLocationDesc')}
      </p>

      <h3>{t('pointLocationTitle')}</h3>
      <p>{t('pointLocationIntro')}</p>
      <ul>
        <li>{t('pointLocationItem1')}</li>
        <li>{t('pointLocationItem2')}</li>
        <li>{t('pointLocationItem3')}</li>
        <li>{t('pointLocationItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('pointMarkerImageTitle')}
        description={t('pointMarkerImageDesc')}
      />

      <h3>{t('polygonLocationTitle')}</h3>
      <p>{t('polygonLocationIntro')}</p>
      <ul>
        <li>{t('polygonLocationItem1')}</li>
        <li>{t('polygonLocationItem2')}</li>
        <li>{t('polygonLocationItem3')}</li>
        <li>{t('polygonLocationItem4')}</li>
      </ul>

      <h4>{t('gpsPolygonTrackingTitle')}</h4>
      <p>
        {t('gpsPolygonTrackingDesc')}
      </p>
      <ul>
        <li>{t('gpsPolygonTrackingItem1')}</li>
        <li>{t('gpsPolygonTrackingItem2')}</li>
        <li>{t('gpsPolygonTrackingItem3')}</li>
        <li>{t('gpsPolygonTrackingItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('polygonTrackingImageTitle')}
        description={t('polygonTrackingImageDesc')}
      />

      <h2>{t('addingSpeciesTitle')}</h2>
      <p>
        {t('addingSpeciesDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('speciesSelection')}</strong>: {t('speciesSelectionDesc')}
        </li>
        <li>
          <strong>{t('treeCount')}</strong>: {t('treeCountDesc')}
        </li>
        <li>
          <strong>{t('sampleTrees')}</strong>: {t('sampleTreesDesc')}
        </li>
      </ul>

      <h3>{t('registeringSampleTreesTitle')}</h3>
      <p>{t('registeringSampleTreesIntro')}</p>
      <ul>
        <li>{t('registeringSampleTreesItem1')}</li>
        <li>{t('registeringSampleTreesItem2')}</li>
        <li>{t('registeringSampleTreesItem3')}</li>
        <li>{t('registeringSampleTreesItem4')}</li>
      </ul>

      <h2>{t('localDynamicFormsTitle')}</h2>
      <p>
        {t('localDynamicFormsDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('localForms')}</strong>: {t('localFormsDesc')}
        </li>
        <li>
          <strong>{t('dynamicForms')}</strong>: {t('dynamicFormsDesc')}
        </li>
      </ul>

      <h2>{t('completingTitle')}</h2>
      <p>
        {t('completingDesc')}
      </p>
      <ul>
        <li>{t('completingItem1')}</li>
        <li>{t('completingItem2')}</li>
        <li>{t('completingItem3')}</li>
      </ul>

      <h2>{t('interventionStatusTitle')}</h2>
      <p>{t('interventionStatusIntro')}</p>
      <ul>
        <li>
          <strong>{t('initialized')}</strong>: {t('initializedDesc')}
        </li>
        <li>
          <strong>{t('location')}</strong>: {t('locationDesc')}
        </li>
        <li>
          <strong>{t('species')}</strong>: {t('speciesDesc')}
        </li>
        <li>
          <strong>{t('treeDetails')}</strong>: {t('treeDetailsDesc')}
        </li>
        <li>
          <strong>{t('localForm')}</strong>: {t('localFormDesc')}
        </li>
        <li>
          <strong>{t('dynamicForm')}</strong>: {t('dynamicFormDesc')}
        </li>
        <li>
          <strong>{t('complete')}</strong>: {t('completeDesc')}
        </li>
      </ul>

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
        <li>
          <strong>{t('tip5Bold')}</strong>: {t('tip5Desc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/interventions`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/photo-documentation`}>{t('relatedLink3')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/map-navigation`}>{t('relatedLink4')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
