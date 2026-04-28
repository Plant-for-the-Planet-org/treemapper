import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';
import Image from 'next/image';

export default function WebSetupPage() {
  return (
    <DocPage
      title="Web Dashboard Setup"
      description="Learn how to access and configure the TreeMapper web dashboard for analytics, team management, and reporting."
      pageId="web-setup"
    >
      <h2>Accessing the Web Dashboard</h2>
      <p>
        The TreeMapper web dashboard provides a powerful interface for managing your projects,
        viewing analytics, and coordinating team activities. Access it through your web browser
        on any desktop and tablet device.
      </p>

      <h2>System Requirements</h2>
      <ul>
        <li><strong>Browser</strong>: Chrome, Firefox, Safari, or Edge (latest versions)</li>
        <li><strong>Screen</strong>: Works on all screen sizes, optimized for desktop</li>
        <li><strong>Internet</strong>: Active internet connection required</li>
        <li><strong>Account</strong>: TreeMapper account with appropriate permissions</li>
      </ul>

      <h2>Getting Started</h2>

      <h3>1. Navigate to the Dashboard</h3>
      <p>
        Open your web browser and go to the TreeMapper dashboard URL:{' '}
        <code>https://dash.treemapper.app</code>
      </p>

      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768800335452-Screenshot_2026-01-19_at_10.55.29___AM.png"
            alt="Navigate to the Dashboard"
            width={1920}
            height={1080}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
        </div>
      </div>

      <h3>2. Sign In</h3>
      <p>Sign in using one of these methods:</p>
      <ul>
        <li><strong>Email & Password</strong>: Use your TreeMapper credentials</li>
        <li><strong>SSO</strong>: Single sign-on if configured by your organization</li>
        <li><strong>Social Login</strong>: Google or other providers if enabled</li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Tip</h4>
        <p className="mb-0">
          Use the same credentials as your mobile app to sync data seamlessly between
          devices. If you don't have an account yet, contact your project administrator
          for an invitation.
        </p>
      </div>

      <h3>3. Select Your Project</h3>
      <p>
        After logging in, you'll see a list of projects you have access to. Select the
        project you want to work with.
      </p>

      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768800733949-Screenshot_2026-01-19_at_11.02.08___AM.png"
            alt="Project Selection"
            width={1920}
            height={1080}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
        </div>
      </div>

      <h2>Dashboard Overview</h2>

      <h3>Main Navigation</h3>
      <p>The dashboard is organized into several main sections:</p>

      <ul>
        <li>
          <strong>Overview</strong>: Key metrics, charts, and recent activity
        </li>
        <li>
          <strong>Sites</strong>: Manage geographic locations within your project
        </li>
        <li>
          <strong>Interventions</strong>: View and manage all tree planting activities
        </li>
        <li>
          <strong>Species</strong>: Curate your tree species catalog
        </li>
        <li>
          <strong>Team</strong>: Manage users, roles, and permissions
        </li>
        <li>
          <strong>Reports</strong>: Generate and export custom reports
        </li>
      </ul>

      <h3>Overview Page</h3>
      <p>The Overview page provides at-a-glance insights:</p>
      <ul>
        <li><strong>Total Trees Planted</strong>: Cumulative count across all interventions</li>
        <li><strong>Active Sites</strong>: Number of sites with recent activity</li>
        <li><strong>Team Members</strong>: Total users in your project</li>
        <li><strong>Planting Trends</strong>: Charts showing progress over time</li>
        <li><strong>Species Distribution</strong>: Breakdown by tree species</li>
        <li><strong>Recent Activity</strong>: Latest interventions and updates</li>
      </ul>

      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768800820384-Screenshot_2026-01-19_at_11.03.35___AM.png"
            alt="Overview Dashboard"
            width={1920}
            height={1080}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
        </div>
      </div>

      <h2>User Profile Setup</h2>

      <h3>Update Your Profile</h3>
      <ol>
        <li>Click your profile icon in the top-right corner</li>
        <li>Select <strong>Profile Settings</strong></li>
        <li>Update your information:
          <ul>
            <li>Name and display photo</li>
            <li>Email preferences</li>
            <li>Language preference</li>
            <li>Notification settings</li>
          </ul>
        </li>
        <li>Click <strong>Save Changes</strong></li>
      </ol>

      <h2>Key Features</h2>

      <h3>Interactive Map</h3>
      <p>
        The web dashboard includes an interactive map view that displays all interventions,
        sites, and monitoring plots. You can:
      </p>
      <ul>
        <li>Toggle between satellite and map views</li>
        <li>Filter by intervention type, date range, or species</li>
        <li>Click on markers to view detailed information</li>
        <li>Draw custom boundaries for new sites</li>
      </ul>

      <h3>Data Export</h3>
      <p>
        Export your data in multiple formats for external analysis:
      </p>
      <ul>
        <li><strong>CSV</strong>: Spreadsheet format for Excel or Google Sheets</li>
        <li><strong>GeoJSON</strong>: Geographic data for GIS software</li>
        <li><strong>PDF Reports</strong>: Formatted reports for sharing</li>
      </ul>

      <h3>Bulk Operations</h3>
      <p>
        Perform actions on multiple items at once:
      </p>
      <ul>
        <li>Bulk upload interventions via CSV</li>
        <li>Transfer ownership of multiple interventions</li>
        <li>Batch edit species information</li>
        <li>Mass invite team members</li>
      </ul>

      <h2>Permissions & Roles</h2>

      <p>The dashboard uses role-based access control:</p>

      <h3>Admin</h3>
      <ul>
        <li>Full access to all features</li>
        <li>Manage team members and roles</li>
        <li>Configure project settings</li>
        <li>Delete or modify any data</li>
      </ul>

      <h3>Manager</h3>
      <ul>
        <li>View all project data</li>
        <li>Edit interventions and sites</li>
        <li>Generate reports</li>
        <li>Cannot manage team or delete data</li>
      </ul>

      <h3>Contributor</h3>
      <ul>
        <li>View project data</li>
        <li>Edit own interventions</li>
        <li>Limited access to team features</li>
      </ul>

      <h3>Viewer</h3>
      <ul>
        <li>Read-only access</li>
        <li>View reports and analytics</li>
        <li>Cannot edit or create data</li>
      </ul>

      <h2>Mobile vs Web</h2>

      <div className="overflow-x-auto my-6">
        <table className="w-full">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Mobile App</th>
              <th>Web Dashboard</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Field Data Collection</td>
              <td>✅ Primary use</td>
              <td>❌ Not available</td>
            </tr>
            <tr>
              <td>Offline Mode</td>
              <td>✅ Full support</td>
              <td>❌ Requires internet</td>
            </tr>
            <tr>
              <td>GPS Tracking</td>
              <td>✅ Built-in</td>
              <td>❌ Desktop only</td>
            </tr>
            <tr>
              <td>Analytics & Reports</td>
              <td>⚠️ Basic view</td>
              <td>✅ Full features</td>
            </tr>
            <tr>
              <td>Bulk Operations</td>
              <td>❌ Not available</td>
              <td>✅ Full support</td>
            </tr>
            <tr>
              <td>Team Management</td>
              <td>❌ Limited</td>
              <td>✅ Full control</td>
            </tr>
            <tr>
              <td>Data Export</td>
              <td>❌ Not available</td>
              <td>✅ Multiple formats</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Next Steps</h2>
      <p>Now that you're set up on the web dashboard:</p>
      <ul>
        <li>
          <Link href="/docs/web/overview">Explore the dashboard overview</Link> to understand
          key metrics
        </li>
        <li>
          <Link href="/docs/web/team-management">Invite team members</Link> to collaborate
        </li>
        <li>
          <Link href="/docs/web/reports">Generate your first report</Link> to analyze progress
        </li>
        <li>
          <Link href="/docs/web/sites-management">Create sites</Link> to organize your work
        </li>
      </ul>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
        <h3 className="mt-0 text-primary">Need Help?</h3>
        <p className="mb-0">
          If you encounter issues accessing the dashboard, check our{' '}
          <Link href="/docs/troubleshooting">troubleshooting guide</Link> or{' '}
          <Link href="/docs/contact-support">contact support</Link>.
        </p>
      </div>
    </DocPage>
  );
}
