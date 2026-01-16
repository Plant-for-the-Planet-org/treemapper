import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function InterventionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.interventions');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="interventions"
    >
      <h2>{t('whatIsTitle')}</h2>
      <p>
        {t('whatIsIntro1')} <strong>{t('whatIsIntro1Bold')}</strong> {t('whatIsIntro1Rest')}
      </p>

      <p>
        {t('whatIsIntro2')}
      </p>

      <PlaceholderImage
        title={t('exampleImageTitle')}
        description={t('exampleImageDesc')}
      />

      <h2>{t('typesTitle')}</h2>
      <p>{t('typesIntro')}</p>

      <h3>{t('plantingTitle')}</h3>
      <ul>
        <li>
          <strong>{t('singleTree')}</strong>: {t('singleTreeDesc')}
        </li>
        <li>
          <strong>{t('multiTree')}</strong>: {t('multiTreeDesc')}
        </li>
        <li>
          <strong>{t('regeneration')}</strong>: {t('regenerationDesc')}
        </li>
      </ul>

      <h3>{t('maintenanceTitle')}</h3>
      <ul>
        <li>
          <strong>{t('maintenance')}</strong>: {t('maintenanceDesc')}
        </li>
        <li>
          <strong>{t('fireSuppression')}</strong>: {t('fireSuppressionDesc')}
        </li>
        <li>
          <strong>{t('fencing')}</strong>: {t('fencingDesc')}
        </li>
      </ul>

      <h3>{t('removalTitle')}</h3>
      <ul>
        <li>
          <strong>{t('invasiveRemoval')}</strong>: {t('invasiveRemovalDesc')}
        </li>
        <li>
          <strong>{t('deadTreeRemoval')}</strong>: {t('deadTreeRemovalDesc')}
        </li>
      </ul>

      <h3>{t('monitoringTitle')}</h3>
      <ul>
        <li>
          <strong>{t('observation')}</strong>: {t('observationDesc')}
        </li>
        <li>
          <strong>{t('remeasurement')}</strong>: {t('remeasurementDesc')}
        </li>
      </ul>

      <h2>{t('anatomyTitle')}</h2>

      <h3>{t('requiredFieldsTitle')}</h3>
      <p>{t('requiredFieldsIntro')}</p>
      <ul>
        <li><strong>{t('location')}</strong>: {t('locationDesc')}</li>
        <li><strong>{t('type')}</strong>: {t('typeDesc')}</li>
        <li><strong>{t('date')}</strong>: {t('dateDesc')}</li>
        <li><strong>{t('project')}</strong>: {t('projectDesc')}</li>
      </ul>

      <h3>{t('optionalTitle')}</h3>
      <ul>
        <li><strong>{t('photos')}</strong>: {t('photosDesc')}</li>
        <li><strong>{t('species')}</strong>: {t('speciesDesc')}</li>
        <li><strong>{t('treeCount')}</strong>: {t('treeCountDesc')}</li>
        <li><strong>{t('measurements')}</strong>: {t('measurementsDesc')}</li>
        <li><strong>{t('notes')}</strong>: {t('notesDesc')}</li>
        <li><strong>{t('site')}</strong>: {t('siteDesc')}</li>
      </ul>

      <h3>{t('metadataTitle')}</h3>
      <p>{t('metadataIntro')}</p>
      <ul>
        <li><strong>{t('creator')}</strong>: {t('creatorDesc')}</li>
        <li><strong>{t('creationTime')}</strong>: {t('creationTimeDesc')}</li>
        <li><strong>{t('deviceInfo')}</strong>: {t('deviceInfoDesc')}</li>
        <li><strong>{t('syncStatus')}</strong>: {t('syncStatusDesc')}</li>
        <li><strong>{t('gpsAccuracy')}</strong>: {t('gpsAccuracyDesc')}</li>
      </ul>

      <h2>{t('workflowTitle')}</h2>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title={t('workflowStep1Title')}
          description={t('workflowStep1Desc')}
        />
        <WorkflowStep
          number={2}
          title={t('workflowStep2Title')}
          description={t('workflowStep2Desc')}
        />
        <WorkflowStep
          number={3}
          title={t('workflowStep3Title')}
          description={t('workflowStep3Desc')}
        />
        <WorkflowStep
          number={4}
          title={t('workflowStep4Title')}
          description={t('workflowStep4Desc')}
        />
        <WorkflowStep
          number={5}
          title={t('workflowStep5Title')}
          description={t('workflowStep5Desc')}
        />
      </div>

      <h2>{t('pointVsPolygonTitle')}</h2>

      <h3>{t('pointTitle')}</h3>
      <p>{t('pointBestFor')}</p>
      <ul>
        <li>{t('pointUse1')}</li>
        <li>{t('pointUse2')}</li>
        <li>{t('pointUse3')}</li>
      </ul>
      <p>
        {t('pointDesc')}
      </p>

      <h3>{t('polygonTitle')}</h3>
      <p>{t('polygonBestFor')}</p>
      <ul>
        <li>{t('polygonUse1')}</li>
        <li>{t('polygonUse2')}</li>
        <li>{t('polygonUse3')}</li>
        <li>{t('polygonUse4')}</li>
      </ul>
      <p>
        {t('polygonDesc')}
      </p>

      <PlaceholderImage
        title={t('pointVsPolygonImageTitle')}
        description={t('pointVsPolygonImageDesc')}
      />

      <h2>{t('statusTitle')}</h2>

      <h3>{t('incompleteTitle')}</h3>
      <p>
        {t('incompleteDesc')}
      </p>

      <h3>{t('pendingSyncTitle')}</h3>
      <p>
        {t('pendingSyncDesc')}
      </p>

      <h3>{t('syncedTitle')}</h3>
      <p>
        {t('syncedDesc')}
      </p>

      <h3>{t('syncFailedTitle')}</h3>
      <p>
        {t('syncFailedDesc')}
      </p>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('accuracyTitle')}</h3>
      <ul>
        <li>{t('accuracyTip1')}</li>
        <li>{t('accuracyTip2')}</li>
        <li>{t('accuracyTip3')}</li>
      </ul>

      <h3>{t('documentationTitle')}</h3>
      <ul>
        <li>{t('documentationTip1')}</li>
        <li>{t('documentationTip2')}</li>
        <li>{t('documentationTip3')}</li>
        <li>{t('documentationTip4')}</li>
      </ul>

      <h3>{t('organizationTitle')}</h3>
      <ul>
        <li>{t('organizationTip1')}</li>
        <li>{t('organizationTip2')}</li>
        <li>{t('organizationTip3')}</li>
        <li>{t('organizationTip4')}</li>
      </ul>

      <h2>{t('commonQuestionsTitle')}</h2>

      <h3>{t('question1Title')}</h3>
      <p>
        {t('question1Answer')}
      </p>

      <h3>{t('question2Title')}</h3>
      <p>
        {t('question2Answer')}
      </p>

      <h3>{t('question3Title')}</h3>
      <p>
        {t('question3Answer')}
      </p>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/first-intervention`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/sync-offline`}>{t('relatedLink3')}</Link>
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
