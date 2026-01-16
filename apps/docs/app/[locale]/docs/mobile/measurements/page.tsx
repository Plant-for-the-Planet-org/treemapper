import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function MeasurementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.measurements');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="measurements"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewDesc')}
      </p>

      <h2>{t('measurementTypesTitle')}</h2>

      <h3>{t('heightLengthTitle')}</h3>
      <p>
        {t('heightLengthDesc')}
      </p>
      <ul>
        <li>
          <strong>{t('metricCountries')}</strong>: {t('metricCountriesDesc')}
        </li>
        <li>
          <strong>{t('nonMetricCountries')}</strong>: {t('nonMetricCountriesDesc')}
        </li>
      </ul>

      <PlaceholderImage
        title={t('heightMeasurementImageTitle')}
        description={t('heightMeasurementImageDesc')}
      />

      <h3>{t('diameterMeasurementsTitle')}</h3>
      <p>
        {t('diameterMeasurementsDesc')}
      </p>

      <h4>{t('dbhTitle')}</h4>
      <p>{t('dbhIntro')}</p>
      <ul>
        <li>{t('dbhItem1')}</li>
        <li>{t('dbhItem2')}</li>
        <li>{t('dbhItem3')}</li>
      </ul>

      <h4>{t('basalDiameterTitle')}</h4>
      <p>{t('basalDiameterIntro')}</p>
      <ul>
        <li>{t('basalDiameterItem1')}</li>
        <li>{t('basalDiameterItem2')}</li>
        <li>{t('basalDiameterItem3')}</li>
      </ul>

      <p>
        {t('appSwitchesDesc')}
      </p>

      <PlaceholderImage
        title={t('diameterMeasurementPointsImageTitle')}
        description={t('diameterMeasurementPointsImageDesc')}
      />

      <h2>{t('takingMeasurementsTitle')}</h2>
      <p>{t('takingMeasurementsIntro')}</p>

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

      <h2>{t('measurementValidationTitle')}</h2>
      <p>
        {t('measurementValidationDesc')}
      </p>

      <h3>{t('heightToDiameterTitle')}</h3>
      <p>
        {t('heightToDiameterDesc')}
      </p>

      <h4>{t('validationFailsTitle')}</h4>
      <ul>
        <li>{t('validationFailsItem1')}</li>
        <li>{t('validationFailsItem2')}</li>
        <li>{t('validationFailsItem3')}</li>
      </ul>

      <h3>{t('inputValidationTitle')}</h3>
      <ul>
        <li>{t('inputValidationItem1')}</li>
        <li>{t('inputValidationItem2')}</li>
        <li>{t('inputValidationItem3')}</li>
      </ul>

      <h2>{t('treeTagsTitle')}</h2>
      <p>
        {t('treeTagsDesc')}
      </p>
      <ul>
        <li>{t('treeTagsItem1')}</li>
        <li>{t('treeTagsItem2')}</li>
        <li>{t('treeTagsItem3')}</li>
        <li>{t('treeTagsItem4')}</li>
      </ul>

      <PlaceholderImage
        title={t('treeTagInputImageTitle')}
        description={t('treeTagInputImageDesc')}
      />

      <h2>{t('locationDataTitle')}</h2>
      <p>
        {t('locationDataDesc')}
      </p>
      <ul>
        <li>{t('locationDataItem1')}</li>
        <li>{t('locationDataItem2')}</li>
        <li>{t('locationDataItem3')}</li>
      </ul>

      <h2>{t('unitConversionTitle')}</h2>
      <p>
        {t('unitConversionDesc')}
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">{t('tableMeasurement')}</th>
              <th className="border border-border px-4 py-2 text-left">{t('tableInputUnit')}</th>
              <th className="border border-border px-4 py-2 text-left">{t('tableStoredUnit')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow1Measurement')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow1Input')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow1Stored')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow2Measurement')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow2Input')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow2Stored')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow3Measurement')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow3Input')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow3Stored')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('tableRow4Measurement')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow4Input')}</td>
              <td className="border border-border px-4 py-2">{t('tableRow4Stored')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>{t('bestPracticesTitle')}</h2>

      <h3>{t('heightMeasurementTipsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('useProperTools')}</strong>: {t('useProperToolsDesc')}
        </li>
        <li>
          <strong>{t('standAtKnownDistance')}</strong>: {t('standAtKnownDistanceDesc')}
        </li>
        <li>
          <strong>{t('identifyTheTop')}</strong>: {t('identifyTheTopDesc')}
        </li>
        <li>
          <strong>{t('accountForSlope')}</strong>: {t('accountForSlopeDesc')}
        </li>
      </ul>

      <h3>{t('diameterMeasurementTipsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('useDiameterTape')}</strong>: {t('useDiameterTapeDesc')}
        </li>
        <li>
          <strong>{t('measurePerpendicular')}</strong>: {t('measurePerpendicularDesc')}
        </li>
        <li>
          <strong>{t('avoidIrregularities')}</strong>: {t('avoidIrregularitiesDesc')}
        </li>
        <li>
          <strong>{t('recordMultipleStems')}</strong>: {t('recordMultipleStemsDesc')}
        </li>
      </ul>

      <h3>{t('generalTipsTitle')}</h3>
      <ul>
        <li>
          <strong>{t('beConsistent')}</strong>: {t('beConsistentDesc')}
        </li>
        <li>
          <strong>{t('doubleCheckUnusual')}</strong>: {t('doubleCheckUnusualDesc')}
        </li>
        <li>
          <strong>{t('documentConditions')}</strong>: {t('documentConditionsDesc')}
        </li>
        <li>
          <strong>{t('takePhotos')}</strong>: {t('takePhotosDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/concepts/remeasurement`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/photo-documentation`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/mobile/creating-interventions`}>{t('relatedLink3')}</Link>
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
