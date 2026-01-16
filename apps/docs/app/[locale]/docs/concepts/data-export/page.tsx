import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function DataExportPage() {
  return (
    <DocPage
      title="Data Export"
      description="Learn how to export your restoration data from TreeMapper in various formats for analysis and reporting."
      pageId="data-export"
    >
      <h2>Overview</h2>
      <p>
        All data registered using the TreeMapper app can be exported in <strong>GeoJSON</strong> or{' '}
        <strong>Excel</strong> format. This allows you to use your restoration data in external
        tools for analysis, reporting, or integration with other systems.
      </p>

      <h2>Exporting from the Mobile App</h2>
      <p>
        From the mobile app, you can export <strong>single intervention data</strong> as a GeoJSON
        file. This exported file can then be imported into any ArcGIS-supported platform or other
        GIS tools for spatial analysis and visualization.
      </p>

      <PlaceholderImage
        title="Mobile Export"
        description="Screenshot showing GeoJSON export option for a single intervention in the mobile app"
      />

      <h3>How to Export from Mobile</h3>
      <ul>
        <li>Open the intervention you want to export</li>
        <li>Tap the export or share option</li>
        <li>Select GeoJSON format</li>
        <li>Share or save the file to your preferred location</li>
      </ul>

      <h2>Exporting from the Web Dashboard</h2>
      <p>
        For exporting <strong>all your data</strong>, use the web dashboard. The web dashboard
        provides more comprehensive export options, including the ability to filter data by time
        period.
      </p>

      <PlaceholderImage
        title="Web Dashboard Export"
        description="Screenshot showing data export options in the web dashboard"
      />

      <h3>Time-Based Filtering</h3>
      <p>
        You can use the <strong>time filter</strong> to export data from a specific time period.
        This is useful when you need to generate reports for a particular month, quarter, or year.
      </p>

      <h3>Available Export Formats</h3>
      <p>Currently, the web dashboard allows you to export all your data in Excel format:</p>
      <ul>
        <li>
          <strong>Excel (.xlsx)</strong>: Export all intervention and restoration data in a
          spreadsheet format, ideal for analysis in Excel, Google Sheets, or other spreadsheet
          applications
        </li>
      </ul>

      <h2>Additional Data Exports</h2>
      <p>
        Beyond intervention data, you can also export other types of data from their respective
        sections in the web dashboard:
      </p>

      <h3>Species Data</h3>
      <p>
        Export species-level data from the species management section. This includes all tree
        species records, counts, and related information collected across your projects.
      </p>

      <h3>Team Data</h3>
      <p>
        Export team member information and activity data from the team management section. This is
        useful for tracking contributions and generating team performance reports.
      </p>

      <h2>Export Summary</h2>
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">Platform</th>
              <th className="border border-border px-4 py-2 text-left">Data Type</th>
              <th className="border border-border px-4 py-2 text-left">Format</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">Mobile App</td>
              <td className="border border-border px-4 py-2">Single Intervention</td>
              <td className="border border-border px-4 py-2">GeoJSON</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Web Dashboard</td>
              <td className="border border-border px-4 py-2">All Interventions</td>
              <td className="border border-border px-4 py-2">Excel</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Web Dashboard</td>
              <td className="border border-border px-4 py-2">Species Data</td>
              <td className="border border-border px-4 py-2">Excel</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Web Dashboard</td>
              <td className="border border-border px-4 py-2">Team Data</td>
              <td className="border border-border px-4 py-2">Excel</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Use Cases</h2>
      <ul>
        <li>
          <strong>GIS Analysis</strong>: Export GeoJSON from mobile and import into ArcGIS, QGIS,
          or other mapping platforms for advanced spatial analysis
        </li>
        <li>
          <strong>Reporting</strong>: Export Excel data from the web dashboard to create custom
          reports for stakeholders
        </li>
        <li>
          <strong>Data Backup</strong>: Regularly export your data as a backup or for archival
          purposes
        </li>
        <li>
          <strong>Integration</strong>: Use exported data to integrate with other data management
          or reporting systems
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/web/reports">Reports & Analytics</Link>
        </li>
        <li>
          <Link href="/docs/web/species-management">Species Management</Link>
        </li>
        <li>
          <Link href="/docs/web/team-management">Team Management</Link>
        </li>
      </ul>
    </DocPage>
  );
}
