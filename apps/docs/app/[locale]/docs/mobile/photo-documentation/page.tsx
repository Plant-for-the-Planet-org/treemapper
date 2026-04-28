import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function PhotoDocumentationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.photoDocumentation');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="photo-documentation"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('cameraFeaturesTitle')}</h2>
      <p>{t('cameraFeaturesIntro')}</p>
      <ul>
        <li>
          <strong>{t('realTimePreview')}</strong>: {t('realTimePreviewDesc')}
        </li>
        <li>
          <strong>{t('autoFocus')}</strong>: {t('autoFocusDesc')}
        </li>
        <li>
          <strong>{t('metadataCapture')}</strong>: {t('metadataCaptureDesc')}
        </li>
        <li>
          <strong>{t('gpsTagging')}</strong>: {t('gpsTaggingDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('cameraInterfaceImageTitle')}
        description={t('cameraInterfaceImageDesc')}
      />

      <h2>{t('takingPhotosTitle')}</h2>
      <p>{t('takingPhotosIntro')}</p>

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

      <h2>{t('imagePreviewTitle')}</h2>
      <p>{t('imagePreviewIntro')}</p>
      <ul>
        <li>
          <strong>{t('continue')}</strong>: {t('continueDesc')}
        </li>
        <li>
          <strong>{t('retake')}</strong>: {t('retakeDesc')}
        </li>
      </ul>
      <p>
        {t('imagePreviewDesc')}
      </p>

      <h2>{t('photoContextsTitle')}</h2>
      <p>{t('photoContextsIntro')}</p>

      <h3>{t('speciesPhotosTitle')}</h3>
      <p>
        {t('speciesPhotosDesc')}
      </p>

      <h3>{t('sampleTreePhotosTitle')}</h3>
      <p>
        {t('sampleTreePhotosDesc')}
      </p>

      <h3>{t('plotPhotosTitle')}</h3>
      <p>
        {t('plotPhotosDesc')}
      </p>

      <h3>{t('remeasurementPhotosTitle')}</h3>
      <p>
        {t('remeasurementPhotosDesc')}
      </p>

      <h3>{t('interventionPhotosTitle')}</h3>
      <p>
        {t('interventionPhotosDesc')}
      </p>

      <PlaceholderImage
        title={t('photoTypesImageTitle')}
        description={t('photoTypesImageDesc')}
      />

      <h2>{t('imageStorageTitle')}</h2>
      <p>{t('imageStorageIntro')}</p>

      <h3>{t('localStorageTitle')}</h3>
      <ul>
        <li>{t('localStorageItem1')}</li>
        <li>{t('localStorageItem2')}</li>
        <li>{t('localStorageItem3')}</li>
      </ul>

      <h3>{t('cloudStorageTitle')}</h3>
      <ul>
        <li>{t('cloudStorageItem1')}</li>
        <li>{t('cloudStorageItem2')}</li>
        <li>{t('cloudStorageItem3')}</li>
      </ul>

      <h3>{t('storageTrackingTitle')}</h3>
      <p>
        {t('storageTrackingDesc')}
      </p>

      <h2>{t('photoDataTitle')}</h2>
      <p>{t('photoDataIntro')}</p>
      <ul>
        <li>
          <strong>{t('latitudeLongitude')}</strong>: {t('latitudeLongitudeDesc')}
        </li>
        <li>
          <strong>{t('timestamp')}</strong>: {t('timestampDesc')}
        </li>
        <li>
          <strong>{t('dimensions')}</strong>: {t('dimensionsDesc')}
        </li>
        <li>
          <strong>{t('fileSize')}</strong>: {t('fileSizeDesc')}
        </li>
        <li>
          <strong>{t('uploadStatus')}</strong>: {t('uploadStatusDesc')}
        </li>
        <li>
          <strong>{t('cdnUrl')}</strong>: {t('cdnUrlDesc')}
        </li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('compositionTitle')}</h3>
      <ul>
        <li>
          <strong>{t('fillTheFrame')}</strong>: {t('fillTheFrameDesc')}
        </li>
        <li>
          <strong>{t('includeContext')}</strong>: {t('includeContextDesc')}
        </li>
        <li>
          <strong>{t('useReferenceObjects')}</strong>: {t('useReferenceObjectsDesc')}
        </li>
        <li>
          <strong>{t('multipleAngles')}</strong>: {t('multipleAnglesDesc')}
        </li>
      </ul>

      <h3>{t('lightingTitle')}</h3>
      <ul>
        <li>
          <strong>{t('avoidDirectSun')}</strong>: {t('avoidDirectSunDesc')}
        </li>
        <li>
          <strong>{t('overcastIdeal')}</strong>: {t('overcastIdealDesc')}
        </li>
        <li>
          <strong>{t('positionSunBehind')}</strong>: {t('positionSunBehindDesc')}
        </li>
      </ul>

      <h3>{t('technicalQualityTitle')}</h3>
      <ul>
        <li>
          <strong>{t('holdSteady')}</strong>: {t('holdSteadyDesc')}
        </li>
        <li>
          <strong>{t('cleanTheLens')}</strong>: {t('cleanTheLensDesc')}
        </li>
        <li>
          <strong>{t('checkFocus')}</strong>: {t('checkFocusDesc')}
        </li>
        <li>
          <strong>{t('reviewImmediately')}</strong>: {t('reviewImmediatelyDesc')}
        </li>
      </ul>

      <h3>{t('documentationStandardsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('consistentStyle')}</strong>: {t('consistentStyleDesc')}
        </li>
        <li>
          <strong>{t('beforeAndAfter')}</strong>: {t('beforeAndAfterDesc')}
        </li>
        <li>
          <strong>{t('captureIssues')}</strong>: {t('captureIssuesDesc')}
        </li>
        <li>
          <strong>{t('overviewShots')}</strong>: {t('overviewShotsDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('photoBestPracticesImageTitle')}
        description={t('photoBestPracticesImageDesc')}
      />

      <h2>{t('troubleshootingTitle')}</h2>

      <h3>{t('photoWontSaveTitle')}</h3>
      <ul>
        <li>{t('photoWontSaveItem1')}</li>
        <li>{t('photoWontSaveItem2')}</li>
        <li>{t('photoWontSaveItem3')}</li>
      </ul>

      <h3>{t('blurryImagesTitle')}</h3>
      <ul>
        <li>{t('blurryImagesItem1')}</li>
        <li>{t('blurryImagesItem2')}</li>
        <li>{t('blurryImagesItem3')}</li>
        <li>{t('blurryImagesItem4')}</li>
      </ul>

      <h3>{t('photosNotSyncingTitle')}</h3>
      <ul>
        <li>{t('photosNotSyncingItem1')}</li>
        <li>{t('photosNotSyncingItem2')}</li>
        <li>{t('photosNotSyncingItem3')}</li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/mobile/measurements`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/remeasurement`}>{t('relatedLink3')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/sync-offline`}>{t('relatedLink4')}</Link>
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
