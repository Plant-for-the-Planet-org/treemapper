import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function FirstInterventionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.firstIntervention');
  const tUi = await getTranslations('ui');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="first-intervention"
    >
      <p>
        {t('intro1')} <strong>{t('intervention')}</strong> {t('intro2')}
      </p>

      <h2>{t('beforeBeginTitle')}</h2>
      <p>{t('beforeBeginIntro')}</p>
      <ul>
        <li>{t('beforeBeginItem1')}</li>
        <li>{t('beforeBeginItem2')}</li>
        <li>{t('beforeBeginItem3')}</li>
        <li>{t('beforeBeginItem4')}</li>
      </ul>

      <h2>{t('step1Title')}</h2>
      <p>
        {t('step1Intro1')} <strong>{t('mapTab')}</strong> {t('step1Intro2')}
      </p>

      <PlaceholderImage
        title={t('mapViewImageTitle')}
        description={t('mapViewImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.tip')}</h4>
        <p className="mb-0">
          {t('tip1Text')}
        </p>
      </div>

      <h2>{t('step2Title')}</h2>
      <p>{t('step2Intro1')} <strong>{t('plusButton')}</strong> {t('step2Intro2')}</p>

      <PlaceholderImage
        title={t('addButtonImageTitle')}
        description={t('addButtonImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('step3Title')}</h2>
      <p>
        {t('step3Intro')}
      </p>
      <ul>
        <li><strong>{t('singleTree')}</strong>: {t('singleTreeDesc')}</li>
        <li><strong>{t('multiTree')}</strong>: {t('multiTreeDesc')}</li>
        <li><strong>{t('regeneration')}</strong>: {t('regenerationDesc')}</li>
        <li><strong>{t('maintenance')}</strong>: {t('maintenanceDesc')}</li>
        <li><strong>{t('removal')}</strong>: {t('removalDesc')}</li>
      </ul>

      <PlaceholderImage
        title={t('interventionTypesImageTitle')}
        description={t('interventionTypesImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('step4Title')}</h2>
      <p>
        {t('step4Intro')}
      </p>

      <h3>{t('pointLocationTitle')}</h3>
      <p>
        {t('pointLocationDesc')}
      </p>

      <h3>{t('polygonAreaTitle')}</h3>
      <p>
        {t('polygonAreaIntro')}
      </p>
      <ol>
        <li>{t('polygonStep1')}</li>
        <li>{t('polygonStep2')}</li>
        <li>{t('polygonStep3')}</li>
        <li>{t('polygonStep4')}</li>
      </ol>

      <PlaceholderImage
        title={t('drawingPolygonImageTitle')}
        description={t('drawingPolygonImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">{tUi('alerts.proTip')}</h4>
        <p className="mb-0">
          {t('proTip1Text')}
        </p>
      </div>

      <h2>{t('step5Title')}</h2>
      <p>
        {t('step5Intro')}
      </p>
      <ol>
        <li>{t('step5Item1')} <strong>{t('addSpecies')}</strong></li>
        <li>{t('step5Item2')}</li>
        <li>{t('step5Item3')}</li>
        <li>{t('step5Item4')}</li>
      </ol>

      <PlaceholderImage
        title={t('speciesSelectionImageTitle')}
        description={t('speciesSelectionImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">{tUi('alerts.note')}</h4>
        <p className="mb-0">
          {t('note1Text1')}{' '}
          <Link href={`/${locale}/docs/tutorials/managing-species`}>{t('note1Link')}</Link>.
        </p>
      </div>

      <h2>{t('step6Title')}</h2>
      <p>
        <strong>{tUi('alerts.note')}:</strong> {t('step6Note')}
      </p>
      <p>
        {t('step6Intro')}
      </p>
      <ol>
        <li>{t('step6Item1')} <strong>{t('cameraIcon')}</strong></li>
        <li>{t('step6Item2')}</li>
        <li>{t('step6Item3')}</li>
        <li>{t('step6Item4')}</li>
      </ol>

      <PlaceholderImage
        title={t('photoCaptureImageTitle')}
        description={t('photoCaptureImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('step7Title')}</h2>
      <p>
        {t('step7Intro')}
      </p>
      <ul>
        <li><strong>{t('treeHeight')}</strong>: {t('treeHeightDesc')}</li>
        <li><strong>{t('diameter')}</strong>: {t('diameterDesc')}</li>
        <li><strong>{t('plantingDate')}</strong>: {t('plantingDateDesc')}</li>
        <li><strong>{t('otherMeasurements')}</strong>: {t('otherMeasurementsDesc')}</li>
      </ul>

      <PlaceholderImage
        title={t('measurementsImageTitle')}
        description={t('measurementsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('step8Title')}</h2>
      <p>
        {t('step8Intro')}
      </p>
      <ul>
        <li><strong>{t('tags')}</strong>: {t('tagsDesc')}</li>
        <li><strong>{t('notes')}</strong>: {t('notesDesc')}</li>
      </ul>

      <PlaceholderImage
        title={t('interventionDetailsImageTitle')}
        description={t('interventionDetailsImageDesc')}
        aspectRatio="portrait"
      />

      <h2>{t('sampleTreesTitle')}</h2>
      <p>
        {t('sampleTreesIntro1')} <strong>{t('multiTree')}</strong> {t('sampleTreesIntro2')} <strong>{t('sampleTrees')}</strong>.
        {t('sampleTreesIntro3')}
      </p>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.example')}</h4>
        <p className="mb-0">
          {t('exampleText')}
        </p>
      </div>

      <p>{t('sampleTreesBenefitsTitle')}</p>
      <ul>
        <li>{t('sampleTreesBenefit1')}</li>
        <li>{t('sampleTreesBenefit2')}</li>
        <li>{t('sampleTreesBenefit3')}</li>
        <li>{t('sampleTreesBenefit4')}</li>
      </ul>

      <p>
        {t('sampleTreesHowTo')}
      </p>

      <h2>{t('step9Title')}</h2>
      <p>
        {t('step9Intro')}
      </p>

      <h3>{t('option1Title')}</h3>
      <p>
        {t('option1Desc')}
      </p>

      <h3>{t('option2Title')}</h3>
      <p>
        {t('option2Intro')}
      </p>
      <ul>
        <li>{t('option2Item1')}</li>
        <li>{t('option2Item2')}</li>
        <li>{t('option2Item3')}</li>
        <li>{t('option2Item4')}</li>
      </ul>

      <p>
        {t('beforeSavingIntro')}
      </p>
      <ol>
        <li>{t('beforeSavingItem1')}</li>
        <li>{t('beforeSavingItem2')}</li>
        <li>{t('beforeSavingItem3')}</li>
        <li>{t('beforeSavingItem4')}</li>
        <li>{t('beforeSavingItem5')} <strong>{t('save')}</strong> {t('beforeSavingItem5Mid')} <strong>{t('register')}</strong></li>
      </ol>

      <PlaceholderImage
        title={t('reviewScreenImageTitle')}
        description={t('reviewScreenImageDesc')}
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">{tUi('alerts.offlineMode')}</h4>
        <p className="mb-0">
          {t('offlineModeText1')}{' '}
          <Link href={`/${locale}/docs/tutorials/working-offline`}>{t('offlineModeLink')}</Link>.
        </p>
      </div>

      <h2>{tUi('common.whatsNext')}</h2>
      <p>{t('whatsNextIntro')}</p>
      <ul>
        <li>
          <Link href={`/${locale}/docs/tutorials/monitoring-plots`}>{t('whatsNextLink1')}</Link> {t('whatsNextLink1Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('whatsNextLink2')}</Link> {t('whatsNextLink2Desc')}
        </li>
        <li>
          <Link href={`/${locale}/docs/web/overview`}>{t('whatsNextLink3')}</Link> {t('whatsNextLink3Desc')}
        </li>
      </ul>

      <h2>{tUi('common.commonQuestions')}</h2>

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
    </DocPage>
  );
}
