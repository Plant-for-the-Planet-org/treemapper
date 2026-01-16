import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function DataExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.dataExport');

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="data-export"
    >
      <h2>{t('overviewTitle')}</h2>
      <p>
        {t('overviewIntro1')} <strong>{t('geoJSON')}</strong> {t('overviewIntro2')} <strong>{t('excel')}</strong> {t('overviewIntro3')}
      </p>

      <h2>{t('exportingMobileTitle')}</h2>
      <p>
        {t('exportingMobileIntro1')} <strong>{t('singleIntervention')}</strong> {t('exportingMobileIntro2')}
      </p>

      <PlaceholderImage
        title={t('mobileExportImageTitle')}
        description={t('mobileExportImageDesc')}
      />

      <h3>{t('howToExportMobileTitle')}</h3>
      <ul>
        <li>{t('howToExportMobileItem1')}</li>
        <li>{t('howToExportMobileItem2')}</li>
        <li>{t('howToExportMobileItem3')}</li>
        <li>{t('howToExportMobileItem4')}</li>
      </ul>

      <h2>{t('exportingWebTitle')}</h2>
      <p>
        {t('exportingWebIntro1')} <strong>{t('allData')}</strong>, {t('exportingWebIntro2')}
      </p>

      <PlaceholderImage
        title={t('webDashboardExportImageTitle')}
        description={t('webDashboardExportImageDesc')}
      />

      <h3>{t('timeBasedFilteringTitle')}</h3>
      <p>
        {t('timeBasedFilteringIntro1')} <strong>{t('timeFilter')}</strong> {t('timeBasedFilteringIntro2')}
      </p>

      <h3>{t('availableFormatsTitle')}</h3>
      <p>{t('availableFormatsIntro')}</p>
      <ul>
        <li>
          <strong>{t('excelFormat')}</strong>: {t('excelFormatDesc')}
        </li>
      </ul>

      <h2>{t('additionalExportsTitle')}</h2>
      <p>
        {t('additionalExportsIntro')}
      </p>

      <h3>{t('speciesDataTitle')}</h3>
      <p>
        {t('speciesDataDesc')}
      </p>

      <h3>{t('teamDataTitle')}</h3>
      <p>
        {t('teamDataDesc')}
      </p>

      <h2>{t('exportSummaryTitle')}</h2>
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">{t('tablePlatform')}</th>
              <th className="border border-border px-4 py-2 text-left">{t('tableDataType')}</th>
              <th className="border border-border px-4 py-2 text-left">{t('tableFormat')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">{t('mobileApp')}</td>
              <td className="border border-border px-4 py-2">{t('singleIntervention')}</td>
              <td className="border border-border px-4 py-2">{t('geoJSON')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('webDashboard')}</td>
              <td className="border border-border px-4 py-2">{t('allInterventions')}</td>
              <td className="border border-border px-4 py-2">{t('excel')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('webDashboard')}</td>
              <td className="border border-border px-4 py-2">{t('speciesData')}</td>
              <td className="border border-border px-4 py-2">{t('excel')}</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">{t('webDashboard')}</td>
              <td className="border border-border px-4 py-2">{t('teamData')}</td>
              <td className="border border-border px-4 py-2">{t('excel')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>{t('useCasesTitle')}</h2>
      <ul>
        <li>
          <strong>{t('gisAnalysis')}</strong>: {t('gisAnalysisDesc')}
        </li>
        <li>
          <strong>{t('reporting')}</strong>: {t('reportingDesc')}
        </li>
        <li>
          <strong>{t('dataBackup')}</strong>: {t('dataBackupDesc')}
        </li>
        <li>
          <strong>{t('integration')}</strong>: {t('integrationDesc')}
        </li>
      </ul>

      <h2>{t('relatedTopicsTitle')}</h2>
      <ul>
        <li>
          <Link href={`/${locale}/docs/web/reports`}>{t('relatedLink1')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/species-management`}>{t('relatedLink2')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/docs/web/team-management`}>{t('relatedLink3')}</Link>
        </li>
      </ul>
    </DocPage>
  );
}
