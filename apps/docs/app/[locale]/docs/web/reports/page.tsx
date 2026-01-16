import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <DocPage
      title="Reports & Analytics"
      description="Learn how to use reports and analytics features in the TreeMapper web dashboard."
      pageId="reports"
    >
      <h2>Overview</h2>
      <p>
        TreeMapper provides comprehensive reporting and analytics tools to help you track progress,
        measure impact, and share results with stakeholders. From team leaderboards to geographic
        visualizations, you can gain insights into your restoration work.
      </p>

      <h2>Forest Champions Leaderboard</h2>
      <p>
        The leaderboard ranks team members based on their contributions to the project:
      </p>

      <PlaceholderImage
        title="Leaderboard"
        description="Screenshot showing the forest champions leaderboard"
      />

      <h3>Ranking Metrics</h3>
      <p>Team members are ranked primarily by trees planted, with additional metrics available:</p>
      <ul>
        <li>
          <strong>Trees Planted</strong>: Total number of trees planted by the member
        </li>
        <li>
          <strong>Interventions</strong>: Number of interventions conducted
        </li>
        <li>
          <strong>Species Count</strong>: Unique species planted
        </li>
      </ul>

      <h3>Member Information</h3>
      <p>Each leaderboard entry shows:</p>
      <ul>
        <li>Rank position with visual badges (crown for 1st, medal for 2nd, award for 3rd)</li>
        <li>Member avatar and display name</li>
        <li>Role badge (color-coded by role)</li>
        <li>Member since date</li>
        <li>Primary metric (trees planted)</li>
      </ul>

      <h3>Expandable Details</h3>
      <p>
        Click on a leaderboard entry to expand and see additional contribution details including
        intervention counts and species diversity.
      </p>

      <h3>Time-Based Filtering</h3>
      <p>View rankings for different time periods:</p>
      <ul>
        <li>
          <strong>All-time</strong>: Complete project history
        </li>
        <li>
          <strong>This year</strong>: Current calendar year
        </li>
        <li>
          <strong>This month</strong>: Current month only
        </li>
      </ul>
      <p>
        Filtering allows you to recognize recent contributors and track ongoing performance.
      </p>

      <h2>Geographic Analytics</h2>
      <p>
        The map view provides geographic visualization of your restoration work:
      </p>

      <h3>Map Features</h3>
      <ul>
        <li>
          <strong>Site locations</strong>: View all project sites on an interactive map
        </li>
        <li>
          <strong>Area coverage</strong>: See the geographic extent of your work
        </li>
        <li>
          <strong>Intervention distribution</strong>: Understand where activities are concentrated
        </li>
      </ul>

      <h3>Map Controls</h3>
      <ul>
        <li>Zoom and pan to explore different areas</li>
        <li>Toggle between map and satellite views</li>
        <li>Click on features for detailed information</li>
      </ul>

      <PlaceholderImage
        title="Geographic Map"
        description="Screenshot showing the geographic analytics map"
      />

      <h2>Dashboard Analytics</h2>
      <p>
        The main dashboard (for Admins and Owners) provides comprehensive analytics:
      </p>

      <h3>Key Metrics</h3>
      <ul>
        <li>Trees planted with trend indicators</li>
        <li>Species diversity metrics</li>
        <li>Area covered in hectares</li>
        <li>Active team member count</li>
      </ul>

      <h3>Progress Tracking</h3>
      <ul>
        <li>Progress toward planting targets</li>
        <li>Monthly planting trends</li>
        <li>Recent activity summaries</li>
      </ul>

      <h3>Time Series Charts</h3>
      <p>
        Visualize planting activity over time with interactive charts showing monthly or daily
        trends.
      </p>

      <h2>Data Export</h2>
      <p>
        Export your data for external analysis and reporting:
      </p>

      <h3>Export Options</h3>
      <ul>
        <li>
          <strong>Intervention data</strong>: All interventions with full details
        </li>
        <li>
          <strong>Date filtering</strong>: Export specific time periods
        </li>
        <li>
          <strong>CSV format</strong>: Compatible with Excel and other tools
        </li>
      </ul>

      <h3>What's Included</h3>
      <p>Exported data includes:</p>
      <ul>
        <li>Intervention details (type, date, location)</li>
        <li>Species and tree counts</li>
        <li>Team member information</li>
        <li>Geographic coordinates</li>
        <li>Custom metadata fields</li>
      </ul>

      <PlaceholderImage
        title="Export Options"
        description="Screenshot showing the data export interface"
      />

      <h2>Report Generation</h2>
      <p>
        Generate reports for stakeholders and organizational needs:
      </p>

      <h3>Date Range Selection</h3>
      <p>
        Use the date picker to select the reporting period. Predefined options include last month,
        last quarter, this year, and custom ranges.
      </p>

      <h3>Report Contents</h3>
      <p>Reports typically include:</p>
      <ul>
        <li>Summary statistics for the period</li>
        <li>Intervention breakdown by type</li>
        <li>Species distribution</li>
        <li>Team contributions</li>
        <li>Geographic distribution</li>
      </ul>

      <h2>Infinite Scroll</h2>
      <p>
        For large datasets like the leaderboard, TreeMapper uses infinite scroll:
      </p>
      <ul>
        <li>Initial load shows top contributors</li>
        <li>Scroll to load more entries</li>
        <li>Loading indicators show when fetching data</li>
        <li>Pagination handled automatically</li>
      </ul>

      <h2>Role-Based Access</h2>
      <p>Analytics access varies by role:</p>

      <h3>Admin / Owner</h3>
      <ul>
        <li>Full dashboard analytics</li>
        <li>All export options</li>
        <li>Complete reporting features</li>
      </ul>

      <h3>Contributor / Observer</h3>
      <ul>
        <li>Leaderboard access</li>
        <li>Map visualization</li>
        <li>Limited analytics (no detailed dashboard)</li>
      </ul>

      <h2>Using Analytics Effectively</h2>

      <h3>Progress Monitoring</h3>
      <ul>
        <li>Check dashboard regularly to track progress toward goals</li>
        <li>Use time filters to compare periods</li>
        <li>Identify trends early to address issues</li>
      </ul>

      <h3>Team Motivation</h3>
      <ul>
        <li>Share leaderboard rankings with the team</li>
        <li>Recognize top contributors</li>
        <li>Use monthly views to highlight recent achievements</li>
      </ul>

      <h3>Stakeholder Reporting</h3>
      <ul>
        <li>Export data for external reports</li>
        <li>Use date filtering for specific reporting periods</li>
        <li>Include geographic visualizations for impact communication</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Regular Review</h3>
      <ul>
        <li>
          <strong>Weekly check-ins</strong>: Monitor recent activity and address any data quality
          issues
        </li>
        <li>
          <strong>Monthly reviews</strong>: Analyze trends and progress toward targets
        </li>
        <li>
          <strong>Quarterly reports</strong>: Generate comprehensive reports for stakeholders
        </li>
      </ul>

      <h3>Data Quality</h3>
      <ul>
        <li>
          <strong>Verify entries</strong>: Spot-check interventions for accuracy
        </li>
        <li>
          <strong>Complete records</strong>: Ensure species and measurements are recorded
        </li>
        <li>
          <strong>Sync regularly</strong>: Remind team to sync mobile data for accurate analytics
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/web/overview">Dashboard Overview</Link>
        </li>
        <li>
          <Link href="/docs/concepts/data-export">Data Export</Link>
        </li>
        <li>
          <Link href="/docs/web/team-management">Team Management</Link>
        </li>
        <li>
          <Link href="/docs/tutorials/analytics-reporting">Analytics Tutorial</Link>
        </li>
      </ul>
    </DocPage>
  );
}
