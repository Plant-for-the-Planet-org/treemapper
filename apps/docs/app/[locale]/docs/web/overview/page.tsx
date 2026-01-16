import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  return (
    <DocPage
      title="Dashboard Overview"
      description="Learn about the TreeMapper web dashboard and its key features for managing restoration projects."
      pageId="dashboard-overview"
    >
      <h2>Overview</h2>
      <p>
        The TreeMapper web dashboard is your central hub for managing restoration projects, viewing
        analytics, and collaborating with your team. It provides comprehensive tools for data
        visualization, project management, and reporting.
      </p>

      <PlaceholderImage
        title="Dashboard Home"
        description="Screenshot of the main dashboard view"
      />

      <h2>Dashboard Statistics</h2>
      <p>
        The dashboard displays key performance indicators (KPIs) as cards at the top of the screen,
        giving you an instant overview of your project's progress:
      </p>

      <h3>Trees Planted</h3>
      <p>
        Total number of trees planted across all interventions. Includes month-over-month comparison
        showing growth or decline trends.
      </p>

      <h3>Species Planted</h3>
      <p>
        Count of unique tree species used in your restoration work. Tracks biodiversity in your
        planting efforts.
      </p>

      <h3>Area Covered</h3>
      <p>
        Total area of restoration interventions measured in hectares. Calculated from polygon
        interventions and site boundaries.
      </p>

      <h3>Field Data Collectors</h3>
      <p>
        Number of team members actively contributing data to the project. Shows team engagement and
        capacity.
      </p>

      <h3>Trend Indicators</h3>
      <p>Each metric includes trend indicators showing:</p>
      <ul>
        <li>
          <strong>Percentage change</strong>: Comparison with the previous month
        </li>
        <li>
          <strong>Direction</strong>: Visual indicator showing increase or decrease
        </li>
      </ul>

      <PlaceholderImage
        title="Statistics Cards"
        description="Screenshot showing the KPI statistics cards"
      />

      <h2>Date Range Filtering</h2>
      <p>
        Filter all dashboard data by date range using the advanced date picker. Available presets
        include:
      </p>
      <ul>
        <li>Today / Yesterday</li>
        <li>Last 7 days / Last 30 days</li>
        <li>This month / Last month</li>
        <li>Last 3 months / Last 6 months</li>
        <li>This year</li>
        <li>All time</li>
        <li>Custom date range selection</li>
      </ul>
      <p>
        The date filter applies to all dashboard components, allowing you to analyze data from
        specific time periods.
      </p>

      <h2>Forest Progress</h2>
      <p>
        The forest progress component visualizes your progress toward planting targets:
      </p>
      <ul>
        <li>
          <strong>Progress bar</strong>: Visual representation of trees planted vs target
        </li>
        <li>
          <strong>Current count</strong>: Number of trees planted so far
        </li>
        <li>
          <strong>Target goal</strong>: Your project's tree planting target
        </li>
        <li>
          <strong>Percentage complete</strong>: How close you are to reaching your goal
        </li>
      </ul>

      <PlaceholderImage
        title="Forest Progress"
        description="Screenshot showing the forest progress tracker"
      />

      <h2>Tree Planting Chart</h2>
      <p>
        The time-series chart visualizes tree planting trends over time:
      </p>
      <ul>
        <li>
          <strong>Monthly view</strong>: Trees planted per month
        </li>
        <li>
          <strong>Historical data</strong>: Compare current performance to past periods
        </li>
        <li>
          <strong>Interactive tooltips</strong>: Hover for detailed numbers
        </li>
      </ul>

      <h2>Recent Additions</h2>
      <p>
        The recent additions component shows the latest activity in your project:
      </p>
      <ul>
        <li>Recently added trees and interventions</li>
        <li>Latest project updates</li>
        <li>Recent team activity</li>
      </ul>
      <p>This keeps you informed about ongoing work without having to dig through data.</p>

      <h2>Dashboard Tabs</h2>
      <p>The dashboard includes multiple views accessible via tabs:</p>

      <h3>Overview Tab</h3>
      <p>
        The main analytics view with statistics, charts, and progress tracking. This is the default
        view when you open the dashboard.
      </p>

      <h3>Leaderboard Tab</h3>
      <p>
        Shows team member rankings based on contribution metrics. See who's planted the most trees
        and contributed the most interventions.
      </p>

      <h3>Map Tab</h3>
      <p>
        Geographic visualization of your project showing sites, interventions, and planted areas on
        an interactive map.
      </p>

      <PlaceholderImage
        title="Dashboard Tabs"
        description="Screenshot showing the dashboard tab navigation"
      />

      <h2>Role-Based Access</h2>
      <p>
        Dashboard views vary based on your role in the project:
      </p>

      <h3>Admin / Owner</h3>
      <p>Full access to all dashboard features including:</p>
      <ul>
        <li>Complete analytics and statistics</li>
        <li>Data export functionality</li>
        <li>All management features</li>
        <li>Project settings access</li>
      </ul>

      <h3>Contributor</h3>
      <p>Limited view focused on:</p>
      <ul>
        <li>Leaderboard rankings</li>
        <li>Map visualization</li>
        <li>Personal contribution metrics</li>
      </ul>

      <h3>Observer</h3>
      <p>Read-only access to:</p>
      <ul>
        <li>Leaderboard data</li>
        <li>Map visualization</li>
        <li>Basic project information</li>
      </ul>

      <h2>Data Export</h2>
      <p>
        From the dashboard, you can export your project data:
      </p>
      <ul>
        <li>
          <strong>CSV reports</strong>: Download intervention data in spreadsheet format
        </li>
        <li>
          <strong>Date filtering</strong>: Export data from specific time periods
        </li>
        <li>
          <strong>Project statistics</strong>: Include summary metrics in exports
        </li>
      </ul>
      <p>
        See <Link href="/docs/concepts/data-export">Data Export</Link> for more details on export
        options.
      </p>

      <h2>Navigation</h2>
      <p>
        The dashboard sidebar provides quick access to all major sections:
      </p>
      <ul>
        <li>
          <strong>Overview</strong>: Main dashboard with analytics
        </li>
        <li>
          <strong>Sites</strong>: Manage restoration sites
        </li>
        <li>
          <strong>Interventions</strong>: View and manage interventions
        </li>
        <li>
          <strong>Species</strong>: Manage tree species
        </li>
        <li>
          <strong>Team</strong>: Manage team members
        </li>
        <li>
          <strong>Reports</strong>: Generate and view reports
        </li>
        <li>
          <strong>Settings</strong>: Project configuration
        </li>
      </ul>

      <h2>Getting Started</h2>
      <p>When you first access the dashboard:</p>
      <ol>
        <li>Select or create a project to work with</li>
        <li>Review your dashboard statistics to understand current status</li>
        <li>Set your planting target if not already configured</li>
        <li>Invite team members to collaborate</li>
        <li>Begin creating sites and recording interventions</li>
      </ol>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/web/sites-management">Managing Sites</Link>
        </li>
        <li>
          <Link href="/docs/web/team-management">Team Management</Link>
        </li>
        <li>
          <Link href="/docs/web/reports">Reports & Analytics</Link>
        </li>
        <li>
          <Link href="/docs/concepts/data-export">Data Export</Link>
        </li>
      </ul>
    </DocPage>
  );
}
