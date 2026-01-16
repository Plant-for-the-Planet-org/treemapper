import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function AnalyticsReportingPage() {
  return (
    <DocPage
      title="Analytics & Reporting"
      description="Learn how to use TreeMapper's web dashboard for advanced project analysis, reporting, and data visualization."
      pageId="analytics-reporting"
    >
      <p>
        Web dashboard supports advanced analysis of the project. One can use it via the web
        dashboard. Please note there is ongoing development going on and you can expect more
        analysis features coming including AI integration for better understanding of your
        restoration.
      </p>

      <PlaceholderImage
        title="Analytics Dashboard"
        description="Screenshot showing the analytics dashboard overview"
        aspectRatio="landscape"
      />

      <h2>Overview Dashboard</h2>
      <p>
        The analytics dashboard provides a comprehensive overview of your restoration project's
        progress and performance.
      </p>

      <p>Currently, it gives an overview of:</p>
      <ul>
        <li><strong>Species Planted</strong>: How many species have been planted</li>
        <li><strong>Area Coverage</strong>: Total area covered over time</li>
        <li><strong>Number of Contributors</strong>: Active team members contributing to the project</li>
        <li><strong>Trees Planted</strong>: Total number of trees planted in the project</li>
      </ul>

      <PlaceholderImage
        title="Project Overview"
        description="Screenshot showing species, area, contributors, and trees planted statistics"
        aspectRatio="landscape"
      />

      <h2>Bar Graph Representation</h2>
      <p>
        The dashboard includes a bar graph representation of tree plantation over time. This
        visualization helps you understand:
      </p>
      <ul>
        <li>Planting trends over different time periods</li>
        <li>Peak planting seasons or periods</li>
        <li>Progress comparison across months or years</li>
        <li>Growth patterns of your restoration efforts</li>
      </ul>

      <PlaceholderImage
        title="Tree Plantation Bar Graph"
        description="Screenshot showing bar graph of tree plantation over time"
        aspectRatio="landscape"
      />

      <h2>Recent Activity</h2>
      <p>
        Recent activity by your team is displayed here. Everything is displayed in this section,
        including:
      </p>
      <ul>
        <li>New interventions created</li>
        <li>Monitoring plot updates</li>
        <li>Plant measurements recorded</li>
        <li>Team member contributions</li>
        <li>Photo uploads and documentation</li>
        <li>Data synchronization events</li>
      </ul>

      <p>
        This real-time activity feed helps you stay informed about what's happening in your project
        and track team engagement.
      </p>

      <PlaceholderImage
        title="Recent Activity Feed"
        description="Screenshot showing recent team activity timeline"
        aspectRatio="portrait"
      />

      <h2>Target Tracker</h2>
      <p>
        If you have set up a target, it is available here. The target tracker helps you:
      </p>
      <ul>
        <li>Monitor progress toward your restoration goals</li>
        <li>Compare actual achievements against targets</li>
        <li>Visualize completion percentage</li>
        <li>Identify areas that need more attention</li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Setting Targets</h4>
        <p className="mb-0">
          You can set targets for trees planted, area covered, or other metrics from the project
          settings. Once set, they will appear in the analytics dashboard for easy tracking.
        </p>
      </div>

      <PlaceholderImage
        title="Target Tracker"
        description="Screenshot showing target progress tracking"
        aspectRatio="landscape"
      />

      <h2>Download Reports</h2>
      <p>
        You can download reports from this section in Excel format. It will export all the data
        related to your project, including:
      </p>
      <ul>
        <li>All interventions and their details</li>
        <li>Monitoring plot data</li>
        <li>Plant measurements and observations</li>
        <li>Species information</li>
        <li>Team member contributions</li>
        <li>Geographic data and locations</li>
        <li>Timestamps and activity logs</li>
      </ul>

      <p>To download a report:</p>
      <ol>
        <li>Navigate to the Analytics & Reporting section</li>
        <li>Click on <strong>"Download Report"</strong> or <strong>"Export"</strong></li>
        <li>Select the date range and data types you want to include</li>
        <li>Choose Excel format (.xlsx)</li>
        <li>Click <strong>"Download"</strong></li>
      </ol>

      <PlaceholderImage
        title="Report Download"
        description="Screenshot showing report download options and Excel export"
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">Report Uses</h4>
        <p className="mb-0">
          Excel reports can be used for external analysis, sharing with stakeholders, creating
          presentations, or importing into other data analysis tools. All project data is included
          for comprehensive reporting.
        </p>
      </div>

      <h2>Upcoming Features</h2>
      <p>
        TreeMapper's analytics capabilities are continuously being enhanced. You can expect more
        analysis features coming, including:
      </p>
      <ul>
        <li><strong>AI Integration</strong>: Advanced AI-powered insights for better understanding
        of your restoration progress</li>
        <li>More visualization options and chart types</li>
        <li>Customizable dashboard widgets</li>
        <li>Advanced filtering and data segmentation</li>
        <li>Predictive analytics and trend forecasting</li>
        <li>Comparative analysis across multiple projects</li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">Stay Updated</h4>
        <p className="mb-0">
          Keep an eye on TreeMapper updates to access new analytics features as they become
          available. The platform is actively being developed to provide more powerful insights
          into your restoration efforts.
        </p>
      </div>

      <h2>What's Next?</h2>
      <p>Now that you understand analytics and reporting, explore these guides:</p>
      <ul>
        <li>
          <Link href="/docs/web-setup">Set up the web dashboard</Link> to access analytics
          features
        </li>
        <li>
          <Link href="/docs/tutorials/team-collaboration">Learn about team collaboration</Link> to
          see how team activity appears in analytics
        </li>
        <li>
          <Link href="/docs/tutorials/monitoring-plots">Set up monitoring plots</Link> to track
          long-term data for analysis
        </li>
      </ul>
    </DocPage>
  );
}
