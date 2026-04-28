import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function PlotsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.plots');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="plots"
    >
      <h2>{t('whatAreTitle')}</h2>
      <p>
        {t('whatAreIntro1')} <strong>{t('whatAreIntro1Bold')}</strong> {t('whatAreIntro1Rest')}
      </p>

      <p>
        {t('whatAreIntro2')}
      </p>

      <PlaceholderImage
        title={t('conceptImageTitle')}
        description={t('conceptImageDesc')}
      />

      <h2>{t('whyUseTitle')}</h2>
      <p>{t('whyUseIntro')}</p>
      <ul>
        <li>
          <strong>{t('measuringEffectiveness')}</strong>: {t('measuringEffectivenessDesc')}
        </li>
        <li>
          <strong>{t('scientificRigor')}</strong>: {t('scientificRigorDesc')}
        </li>
        <li>
          <strong>{t('comparativeAnalysis')}</strong>: {t('comparativeAnalysisDesc')}
        </li>
        <li>
          <strong>{t('longTermTracking')}</strong>: {t('longTermTrackingDesc')}
        </li>
        <li>
          <strong>{t('evidenceBased')}</strong>: {t('evidenceBasedDesc')}
        </li>
      </ul>

      <h2>{t('plotTypesTitle')}</h2>
      <p>{t('plotTypesIntro')}</p>

      <h3>{t('interventionPlotsTitle')}</h3>
      <p>
        <strong>{t('interventionPlotsBold')}</strong> {t('interventionPlotsIntro')}
      </p>
      <ul>
        <li>{t('interventionPlotsItem1')}</li>
        <li>{t('interventionPlotsItem2')}</li>
        <li>{t('interventionPlotsItem3')}</li>
      </ul>
      <p>
        {t('interventionPlotsDesc')}
      </p>

      <h3>{t('controlPlotsTitle')}</h3>
      <p>
        <strong>{t('controlPlotsBold')}</strong> {t('controlPlotsIntro')}
      </p>
      <ul>
        <li>{t('controlPlotsItem1')}</li>
        <li>{t('controlPlotsItem2')}</li>
        <li>{t('controlPlotsItem3')}</li>
      </ul>
      <p>
        {t('controlPlotsDesc')}
      </p>

      <PlaceholderImage
        title={t('interventionVsControlImageTitle')}
        description={t('interventionVsControlImageDesc')}
      />

      <h2>{t('plotComponentsTitle')}</h2>
      <p>{t('plotComponentsIntro')}</p>

      <h3>{t('plotDefinitionTitle')}</h3>
      <ul>
        <li><strong>{t('name')}</strong>: {t('nameDesc')}</li>
        <li><strong>{t('dimensions')}</strong>: {t('dimensionsDesc')}</li>
        <li><strong>{t('location')}</strong>: {t('locationDesc')}</li>
        <li><strong>{t('type')}</strong>: {t('typeDesc')}</li>
      </ul>

      <h3>{t('plantLevelDataTitle')}</h3>
      <p>
        {t('plantLevelDataIntro')}
      </p>
      <ul>
        <li>{t('plantLevelDataItem1')} <strong>{t('planted')}</strong> {t('plantLevelDataItem1Mid')} <strong>{t('recruits')}</strong> {t('plantLevelDataItem1End')}</li>
        <li><strong>{t('speciesIdentification')}</strong></li>
        <li><strong>{t('measurements')}</strong>: {t('measurementsDesc')}</li>
        <li><strong>{t('position')}</strong> {t('positionDesc')}</li>
        <li><strong>{t('tags')}</strong> {t('tagsDesc')}</li>
      </ul>

      <h3>{t('observationsTitle')}</h3>
      <p>
        {t('observationsIntro')}
      </p>
      <ul>
        <li><strong>{t('soilMoisture')}</strong></li>
        <li><strong>{t('canopyCover')}</strong></li>
        <li>{t('additionalObservations')}</li>
      </ul>

      <PlaceholderImage
        title={t('plotComponentsImageTitle')}
        description={t('plotComponentsImageDesc')}
      />

      <h2>{t('plantTimelineTitle')}</h2>
      <p>
        {t('plantTimelineIntro1')} <strong>{t('plantTimelineBold')}</strong> {t('plantTimelineIntro2')}
      </p>
      <ul>
        <li>{t('plantTimelineItem1')}</li>
        <li>{t('plantTimelineItem2')}</li>
        <li>{t('plantTimelineItem3')}</li>
        <li>{t('plantTimelineItem4')}</li>
      </ul>

      <p>
        {t('plantTimelineDesc')}
      </p>

      <h2>{t('plotGroupsTitle')}</h2>
      <p>
        <strong>{t('plotGroupsBold')}</strong> {t('plotGroupsIntro')}
      </p>

      <h3>{t('groupStructureTitle')}</h3>
      <ul>
        <li>{t('groupStructureItem1')} <strong>{t('multiplePlots')}</strong></li>
        <li>{t('groupStructureItem2')} <strong>{t('onlyOneGroup')}</strong></li>
        <li>{t('groupStructureItem3')}</li>
      </ul>

      <h3>{t('whenToUseTitle')}</h3>
      <p>{t('whenToUseIntro')}</p>
      <ul>
        <li>
          <strong>{t('controlVsIntervention')}</strong>: {t('controlVsInterventionDesc')}
        </li>
        <li>
          <strong>{t('longTermResearch')}</strong>: {t('longTermResearchDesc')}
        </li>
        <li>
          <strong>{t('specificStrategies')}</strong>: {t('specificStrategiesDesc')}
        </li>
        <li>
          <strong>{t('geographicOrg')}</strong>: {t('geographicOrgDesc')}
        </li>
        <li>
          <strong>{t('timeBasedStudies')}</strong>: {t('timeBasedStudiesDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('plotGroupsImageTitle')}
        description={t('plotGroupsImageDesc')}
      />

      <h2>{t('benefitsTitle')}</h2>
      <p>{t('benefitsIntro')}</p>
      <ul>
        <li>
          <strong>{t('simplifiedMgmt')}</strong>: {t('simplifiedMgmtDesc')}
        </li>
        <li>
          <strong>{t('bulkAnalysis')}</strong>: {t('bulkAnalysisDesc')}
        </li>
        <li>
          <strong>{t('organizedReporting')}</strong>: {t('organizedReportingDesc')}
        </li>
        <li>
          <strong>{t('clearStructure')}</strong>: {t('clearStructureDesc')}
        </li>
      </ul>

      <h2>{t('plotsVsInterventionsTitle')}</h2>
      <p>
        {t('plotsVsInterventionsIntro')} <strong>{t('monitoringPlots')}</strong> {t('plotsVsInterventionsMid')}{' '}
        <Link href={`/${locale}/docs/concepts/interventions`}>{t('interventions')}</Link>:
      </p>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{t('keyDifferencesTitle')}</h4>
        <ul className="mb-0">
          <li>
            <strong>{t('interventions')}</strong> {t('keyDiff1')}
          </li>
          <li>
            <strong>{t('monitoringPlots')}</strong> {t('keyDiff2')}
          </li>
          <li>
            {t('keyDiff3')} <em>{t('within')}</em> {t('keyDiff3Rest')}
          </li>
          <li>
            {t('keyDiff4')} <em>{t('results')}</em> {t('keyDiff4Rest')}
          </li>
        </ul>
      </div>

      <h2>{t('bestPracticesTitle')}</h2>
      <p>{t('bestPracticesIntro')}</p>
      <ul>
        <li>
          <strong>{t('establishBoundaries')}</strong>: {t('establishBoundariesDesc')}
        </li>
        <li>
          <strong>{t('consistentMethodology')}</strong>: {t('consistentMethodologyDesc')}
        </li>
        <li>
          <strong>{t('regularMonitoring')}</strong>: {t('regularMonitoringDesc')}
        </li>
        <li>
          <strong>{t('documentEverything')}</strong>: {t('documentEverythingDesc')}
        </li>
        <li>
          <strong>{t('usePlotGroups')}</strong>: {t('usePlotGroupsDesc')}
        </li>
      </ul>

      <h2>{t('whatsNextTitle')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/monitoring-plots`}>{t('nextLink1')}</Link> -
          {t('nextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/interventions`}>{t('nextLink2')}</Link> {t('nextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('nextLink3')}</Link> {t('nextLink3Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/web/overview`}>{t('nextLink4')}</Link> {t('nextLink4Desc')}
        </li>
      </ul>
    </DocPage>
  );
}
