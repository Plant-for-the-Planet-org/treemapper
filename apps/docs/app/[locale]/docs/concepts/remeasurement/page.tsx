import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function RemeasurementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.remeasurement');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="remeasurement"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewIntro1')} <strong>{t('remeasureTrees')}</strong> {t('overviewIntro2')} <strong>{t('sampleTrees')}</strong> {t('overviewIntro3')} <strong>{t('singleTrees')}</strong> {t('overviewIntro4')}
      </p>

      <h2>{t('howToRemeasureTitle')}</h2>
      <p>{t('howToRemeasureIntro')}</p>

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
        title={t('remeasurementFlowImageTitle')}
        description={t('remeasurementFlowImageDesc')}
      />

      <h2>{t('recordingDeadTreesTitle')}</h2>
      <p>
        {t('recordingDeadTreesIntro')}
      </p>
      <ul>
        <li>{t('recordingDeadTreesItem1')}</li>
        <li>
          {t('recordingDeadTreesItem2')} <strong>{t('treeIsDead')}</strong> {t('recordingDeadTreesItem2End')}
        </li>
        <li>{t('recordingDeadTreesItem3')}</li>
        <li>{t('recordingDeadTreesItem4')}</li>
        <li>{t('recordingDeadTreesItem5')}</li>
      </ul>

      <p>
        {t('recordingDeadTreesDesc')}
      </p>

      <h2>{t('measurementHistoryTitle')}</h2>
      <p>
        {t('measurementHistoryIntro1')} <strong>{t('historyTimeline')}</strong> {t('measurementHistoryIntro2')} <strong>{t('treeDetailsSection')}</strong> {t('measurementHistoryIntro3')}
      </p>
      <ul>
        <li>{t('measurementHistoryItem1')}</li>
        <li>{t('measurementHistoryItem2')}</li>
        <li>{t('measurementHistoryItem3')}</li>
        <li>{t('measurementHistoryItem4')}</li>
        <li>{t('measurementHistoryItem5')}</li>
      </ul>

      <PlaceholderImage
        title={t('treeTimelineImageTitle')}
        description={t('treeTimelineImageDesc')}
      />

      <h2>{t('remeasurementRemindersTitle')}</h2>
      <p>
        {t('remeasurementRemindersIntro1')} <strong>{t('remeasurementPeriodicity')}</strong> {t('remeasurementRemindersIntro2')}
      </p>
      <ul>
        <li>{t('remeasurementRemindersItem1')}</li>
        <li>{t('remeasurementRemindersItem2')}</li>
        <li>{t('remeasurementRemindersItem3')}</li>
      </ul>

      <h2>{t('identifyingTreesTitle')}</h2>
      <p>{t('identifyingTreesIntro')}</p>

      <h3>{t('visualIndicatorsTitle')}</h3>
      <p>
        {t('visualIndicatorsIntro1')} <strong>{t('red')}</strong> {t('visualIndicatorsIntro2')}
      </p>

      <h3>{t('locationFeatureTitle')}</h3>
      <p>
        {t('locationFeatureIntro1')} <strong>{t('locationFeature')}</strong> {t('locationFeatureIntro2')}
      </p>

      <PlaceholderImage
        title={t('treesDueImageTitle')}
        description={t('treesDueImageDesc')}
      />

      <h2>{t('bestPracticesTitle')}</h2>
      <ul>
        <li>
          <strong>{t('consistentTiming')}</strong>: {t('consistentTimingDesc')}
        </li>
        <li>
          <strong>{t('photoDocumentation')}</strong>: {t('photoDocumentationDesc')}
        </li>
        <li>
          <strong>{t('noteConditions')}</strong>: {t('noteConditionsDesc')}
        </li>
        <li>
          <strong>{t('regularSchedule')}</strong>: {t('regularScheduleDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/interventions`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/plots`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('relatedLink3')}</Link>
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
