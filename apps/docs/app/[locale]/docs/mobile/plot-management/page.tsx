import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function PlotManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.plotManagement');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="plot-management"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('plotTypesTitle')}</h2>
      <p>{t('plotTypesIntro')}</p>

      <h3>{t('interventionPlotsTitle')}</h3>
      <p>
        {t('interventionPlotsDesc')}
      </p>

      <h3>{t('controlPlotsTitle')}</h3>
      <p>
        {t('controlPlotsDesc')}
      </p>

      <h2>{t('plotShapesTitle')}</h2>
      <p>{t('plotShapesIntro')}</p>

      <h3>{t('circularPlotsTitle')}</h3>
      <ul>
        <li>{t('circularPlotsItem1')}</li>
        <li>{t('circularPlotsItem2')}</li>
        <li>{t('circularPlotsItem3')}</li>
        <li>{t('circularPlotsItem4')}</li>
      </ul>

      <h3>{t('rectangularPlotsTitle')}</h3>
      <ul>
        <li>{t('rectangularPlotsItem1')}</li>
        <li>{t('rectangularPlotsItem2')}</li>
        <li>{t('rectangularPlotsItem3')}</li>
        <li>{t('rectangularPlotsItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('plotShapesImageTitle')}
        description={t('plotShapesImageDesc')}
      />

      <h2>{t('plotComplexityTitle')}</h2>
      <p>{t('plotComplexityIntro')}</p>

      <h3>{t('standardPlotsTitle')}</h3>
      <p>
        {t('standardPlotsDesc')}
      </p>

      <h3>{t('simplePlotsTitle')}</h3>
      <p>
        {t('simplePlotsDesc')}
      </p>

      <h2>{t('creatingPlotTitle')}</h2>
      <p>{t('creatingPlotIntro')}</p>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title={t('step1Title')}
          description={t('step1Desc')}
        />
        <WorkflowStep
          number={2}
          title={t('step2Title')}
          description={t('step2Desc')}
        />
        <WorkflowStep
          number={3}
          title={t('step3Title')}
          description={t('step3Desc')}
        />
        <WorkflowStep
          number={4}
          title={t('step4Title')}
          description={t('step4Desc')}
        />
        <WorkflowStep
          number={5}
          title={t('step5Title')}
          description={t('step5Desc')}
        />
      </div>

      <PlaceholderImage
        title={t('plotCreationImageTitle')}
        description={t('plotCreationImageDesc')}
      />

      <h3>{t('drawingBoundariesTitle')}</h3>
      <p>{t('drawingBoundariesIntro')}</p>
      <ul>
        <li>
          <strong>{t('circularPlots')}</strong>: {t('circularPlotsBoundaryDesc')}
        </li>
        <li>
          <strong>{t('rectangularPlots')}</strong>: {t('rectangularPlotsBoundaryDesc')}
        </li>
        <li>{t('drawingBoundariesItem3')}</li>
        <li>{t('drawingBoundariesItem4')}</li>
      </ul>

      <h2>{t('managingPlantsTitle')}</h2>
      <p>
        {t('managingPlantsIntro')}
      </p>

      <h3>{t('plantInformationTitle')}</h3>
      <ul>
        <li>
          <strong>{t('species')}</strong>: {t('speciesDesc')}
        </li>
        <li>
          <strong>{t('tag')}</strong>: {t('tagDesc')}
        </li>
        <li>
          <strong>{t('type')}</strong>: {t('typeDesc')}
        </li>
        <li>
          <strong>{t('quantity')}</strong>: {t('quantityDesc')}
        </li>
        <li>
          <strong>{t('location')}</strong>: {t('locationDesc')}
        </li>
        <li>
          <strong>{t('status')}</strong>: {t('statusDesc')}
        </li>
      </ul>

      <h3>{t('addingPlantsTitle')}</h3>
      <ul>
        <li>{t('addingPlantsItem1')}</li>
        <li>{t('addingPlantsItem2')}</li>
        <li>{t('addingPlantsItem3')}</li>
        <li>{t('addingPlantsItem4')}</li>
        <li>{t('addingPlantsItem5')}</li>
        <li>{t('addingPlantsItem6')}</li>
      </ul>

      <h2>{t('plotGroupsTitle')}</h2>
      <p>
        {t('plotGroupsDesc')}
      </p>

      <h3>{t('creatingPlotGroupTitle')}</h3>
      <ul>
        <li>{t('creatingPlotGroupItem1')}</li>
        <li>{t('creatingPlotGroupItem2')}</li>
        <li>{t('creatingPlotGroupItem3')}</li>
        <li>{t('creatingPlotGroupItem4')}</li>
      </ul>

      <h3>{t('benefitsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('organization')}</strong>: {t('organizationDesc')}
        </li>
        <li>
          <strong>{t('reporting')}</strong>: {t('reportingDesc')}
        </li>
        <li>
          <strong>{t('workflow')}</strong>: {t('workflowDesc')}
        </li>
      </ul>

      <h2>{t('plantTimelineTitle')}</h2>
      <p>
        {t('plantTimelineDesc')}
      </p>
      <ul>
        <li>{t('plantTimelineItem1')}</li>
        <li>{t('plantTimelineItem2')}</li>
        <li>{t('plantTimelineItem3')}</li>
        <li>{t('plantTimelineItem4')}</li>
        <li>{t('plantTimelineItem5')}</li>
      </ul>

      <PlaceholderImage
        title={t('plantTimelineImageTitle')}
        description={t('plantTimelineImageDesc')}
      />

      <h2>{t('plotObservationsTitle')}</h2>
      <p>
        {t('plotObservationsDesc')}
      </p>

      <h2>{t('managingPlotsTitle')}</h2>

      <h3>{t('editingPlotsTitle')}</h3>
      <p>
        {t('editingPlotsDesc')}
      </p>

      <h3>{t('deletingPlotsTitle')}</h3>
      <p>
        {t('deletingPlotsDesc')}
      </p>

      <h2>{t('bestPracticesTitle')}</h2>
      <ul>
        <li>
          <strong>{t('consistentNaming')}</strong>: {t('consistentNamingDesc')}
        </li>
        <li>
          <strong>{t('accurateBoundaries')}</strong>: {t('accurateBoundariesDesc')}
        </li>
        <li>
          <strong>{t('regularMonitoring')}</strong>: {t('regularMonitoringDesc')}
        </li>
        <li>
          <strong>{t('photoDocumentation')}</strong>: {t('photoDocumentationDesc')}
        </li>
        <li>
          <strong>{t('tagPlants')}</strong>: {t('tagPlantsDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/plots`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/remeasurement`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold mt-0 mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-0">{description}</p>
      </div>
    </div>
  );
}
