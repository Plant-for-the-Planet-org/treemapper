import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function BulkUploadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.bulkUpload');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="bulk-upload"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('whenToUseTitle')}</h2>
      <ul>
        <li>
          <strong>{t('historicalData')}</strong>: {t('historicalDataDesc')}
        </li>
        <li>
          <strong>{t('dataMigration')}</strong>: {t('dataMigrationDesc')}
        </li>
        <li>
          <strong>{t('largeDatasets')}</strong>: {t('largeDatasetsDesc')}
        </li>
        <li>
          <strong>{t('speciesData')}</strong>: {t('speciesDataDesc')}
        </li>
      </ul>

      <h2>{t('uploadWizardTitle')}</h2>
      <p>
        {t('uploadWizardDesc')}
      </p>

      <PlaceholderImage
        title={t('uploadWizardImageTitle')}
        description={t('uploadWizardImageDesc')}
      />

      <h3>{t('step1Title')}</h3>
      <p>
        {t('step1Desc')}
      </p>
      <ul>
        <li>
          <strong>{t('projectSelection')}</strong>: {t('projectSelectionDesc')}
        </li>
        <li>
          <strong>{t('siteSelection')}</strong>: {t('siteSelectionDesc')}
        </li>
        <li>{t('step1Note')}</li>
      </ul>

      <h3>{t('step2Title')}</h3>
      <p>
        {t('step2Desc')}
      </p>
      <ul>
        <li>
          <strong>{t('supportedFormats')}</strong>: {t('supportedFormatsDesc')}
        </li>
        <li>
          <strong>{t('fileParsing')}</strong>: {t('fileParsingDesc')}
        </li>
        <li>
          <strong>{t('columnMapping')}</strong>: {t('columnMappingDesc')}
        </li>
        <li>
          <strong>{t('preview')}</strong>: {t('previewDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('fileUploadImageTitle')}
        description={t('fileUploadImageDesc')}
      />

      <h3>{t('step3Title')}</h3>
      <p>
        {t('step3Desc')}
      </p>
      <ul>
        <li>
          <strong>{t('fieldValidation')}</strong>: {t('fieldValidationDesc')}
        </li>
        <li>
          <strong>{t('dataTypeVerification')}</strong>: {t('dataTypeVerificationDesc')}
        </li>
        <li>
          <strong>{t('errorReporting')}</strong>: {t('errorReportingDesc')}
        </li>
        <li>
          <strong>{t('dataPreview')}</strong>: {t('dataPreviewDesc')}
        </li>
      </ul>

      <h4>{t('handlingErrorsTitle')}</h4>
      <p>
        {t('handlingErrorsDesc')}
      </p>
      <ul>
        <li>{t('handlingErrorsItem1')}</li>
        <li>{t('handlingErrorsItem2')}</li>
        <li>{t('handlingErrorsItem3')}</li>
        <li>{t('handlingErrorsItem4')}</li>
      </ul>

      <h3>{t('step4Title')}</h3>
      <p>
        {t('step4Desc')}
      </p>
      <ul>
        <li>
          <strong>{t('summary')}</strong>: {t('summaryDesc')}
        </li>
        <li>
          <strong>{t('results')}</strong>: {t('resultsDesc')}
        </li>
        <li>
          <strong>{t('nextSteps')}</strong>: {t('nextStepsDesc')}
        </li>
      </ul>

      <h2>{t('dataRequirementsTitle')}</h2>

      <h3>{t('requiredFieldsTitle')}</h3>
      <p>{t('requiredFieldsIntro')}</p>
      <ul>
        <li>
          <strong>{t('interventionType')}</strong>: {t('interventionTypeDesc')}
        </li>
        <li>
          <strong>{t('date')}</strong>: {t('dateDesc')}
        </li>
        <li>
          <strong>{t('location')}</strong>: {t('locationDesc')}
        </li>
      </ul>

      <h3>{t('optionalFieldsTitle')}</h3>
      <p>{t('optionalFieldsIntro')}</p>
      <ul>
        <li>{t('optionalFieldsItem1')}</li>
        <li>{t('optionalFieldsItem2')}</li>
        <li>{t('optionalFieldsItem3')}</li>
        <li>{t('optionalFieldsItem4')}</li>
      </ul>

      <h3>{t('fileFormatGuidelinesTitle')}</h3>
      <ul>
        <li>{t('fileFormatGuidelinesItem1')}</li>
        <li>{t('fileFormatGuidelinesItem2')}</li>
        <li>{t('fileFormatGuidelinesItem3')}</li>
        <li>{t('fileFormatGuidelinesItem4')}</li>
        <li>{t('fileFormatGuidelinesItem5')}</li>
      </ul>

      <h2>{t('bulkSpeciesUploadTitle')}</h2>
      <p>
        {t('bulkSpeciesUploadDesc')}
      </p>
      <ul>
        <li>{t('bulkSpeciesUploadItem1')}</li>
        <li>{t('bulkSpeciesUploadItem2')}</li>
        <li>{t('bulkSpeciesUploadItem3')}</li>
      </ul>

      <h2>{t('progressTrackingTitle')}</h2>
      <p>
        {t('progressTrackingDesc')}
      </p>
      <ul>
        <li>{t('progressTrackingItem1')}</li>
        <li>{t('progressTrackingItem2')}</li>
        <li>{t('progressTrackingItem3')}</li>
      </ul>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('beforeUploadingTitle')}</h3>
      <ul>
        <li>
          <strong>{t('cleanYourData')}</strong>: {t('cleanYourDataDesc')}
        </li>
        <li>
          <strong>{t('testWithSample')}</strong>: {t('testWithSampleDesc')}
        </li>
        <li>
          <strong>{t('backupOriginal')}</strong>: {t('backupOriginalDesc')}
        </li>
        <li>
          <strong>{t('mapColumns')}</strong>: {t('mapColumnsDesc')}
        </li>
      </ul>

      <h3>{t('duringUploadTitle')}</h3>
      <ul>
        <li>
          <strong>{t('reviewCarefully')}</strong>: {t('reviewCarefullyDesc')}
        </li>
        <li>
          <strong>{t('addressErrors')}</strong>: {t('addressErrorsDesc')}
        </li>
        <li>
          <strong>{t('dontRefresh')}</strong>: {t('dontRefreshDesc')}
        </li>
      </ul>

      <h3>{t('afterUploadTitle')}</h3>
      <ul>
        <li>
          <strong>{t('verifyResults')}</strong>: {t('verifyResultsDesc')}
        </li>
        <li>
          <strong>{t('spotCheck')}</strong>: {t('spotCheckDesc')}
        </li>
        <li>
          <strong>{t('document')}</strong>: {t('documentDesc')}
        </li>
      </ul>

      <h2>{t('troubleshootingTitle')}</h2>

      <h3>{t('fileWontUploadTitle')}</h3>
      <ul>
        <li>{t('fileWontUploadItem1')}</li>
        <li>{t('fileWontUploadItem2')}</li>
        <li>{t('fileWontUploadItem3')}</li>
      </ul>

      <h3>{t('validationErrorsTitle')}</h3>
      <ul>
        <li>{t('validationErrorsItem1')}</li>
        <li>{t('validationErrorsItem2')}</li>
        <li>{t('validationErrorsItem3')}</li>
        <li>{t('validationErrorsItem4')}</li>
      </ul>

      <h3>{t('missingDataTitle')}</h3>
      <ul>
        <li>{t('missingDataItem1')}</li>
        <li>{t('missingDataItem2')}</li>
        <li>{t('missingDataItem3')}</li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/interventions`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/species-management`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/concepts/data-export`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
