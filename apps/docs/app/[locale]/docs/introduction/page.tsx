import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function IntroductionPage() {
  return (
    <DocPage
      title="Introduction to TreeMapper"
      description="Welcome to the TreeMapper documentation. Learn how to use our powerful forest monitoring and tree planting management platform."
      pageId="introduction"
    >
      <p>
        TreeMapper is a comprehensive platform designed to help environmental organizations,
        forestry projects, and conservation teams track, monitor, and document tree-related
        interventions and activities. Whether you're planting trees, monitoring forest health,
        or managing restoration projects, TreeMapper provides the tools you need.
      </p>

      <PlaceholderImage
        title="TreeMapper Overview"
        description="Screenshot showing the TreeMapper mobile app and web dashboard"
      />

      <h2>What is TreeMapper?</h2>
      <p>
        TreeMapper is built by <a href="https://www.plant-for-the-planet.org" target="_blank" rel="noopener noreferrer">Plant-for-the-Planet</a> and consists of two main components:
      </p>
      <ul>
        <li>
          <strong>Mobile App</strong>: A React Native/Expo application for iOS and Android that
          enables field teams to collect data offline, map tree locations, and document
          interventions with photos and measurements.
        </li>
        <li>
          <strong>Web Dashboard</strong>: A Next.js web application providing analytics,
          team management, bulk data operations, and comprehensive reporting tools.
        </li>
      </ul>

      <h2>Key Features</h2>

      <h3>For Mobile Users</h3>
      <ul>
        <li><strong>Offline-First Architecture</strong>: Work anywhere without internet connectivity</li>
        <li><strong>GPS-Based Mapping</strong>: Accurately plot tree locations and intervention areas</li>
        <li><strong>Photo Documentation</strong>: Capture and attach images to your data</li>
        <li><strong>Species Database</strong>: Access thousands of tree species with search and filtering</li>
        <li><strong>Monitoring Plots</strong>: Set up standardized research plots for long-term tracking</li>
        <li><strong>Automatic Sync</strong>: Data automatically syncs when you're back online</li>
      </ul>

      <h3>For Web Users</h3>
      <ul>
        <li><strong>Analytics Dashboard</strong>: View real-time progress and KPIs</li>
        <li><strong>Team Management</strong>: Invite users and manage permissions</li>
        <li><strong>Bulk Data Upload</strong>: Import large datasets via CSV or GeoJSON</li>
        <li><strong>Site Management</strong>: Organize projects by geographic locations</li>
        <li><strong>Advanced Reporting</strong>: Generate and export custom reports</li>
        <li><strong>Species Curation</strong>: Manage your organization's tree species catalog</li>
      </ul>

      <h2>Who Should Use This Documentation?</h2>
      <p>This documentation is designed for:</p>
      <ul>
        <li><strong>Field Teams</strong>: Learn how to use the mobile app for data collection</li>
        <li><strong>Project Managers</strong>: Master the web dashboard for oversight and reporting</li>
        <li><strong>Team Leaders</strong>: Understand workflows for coordinating field operations</li>
        <li><strong>Data Analysts</strong>: Explore data export and analysis capabilities</li>
      </ul>

      <h2>Getting Started</h2>
      <p>Ready to begin? Here's what to do next:</p>
      <ol>
        <li>
          <Link href="/docs/mobile-setup">Set up the mobile app</Link> on your iOS or Android device
        </li>
        <li>
          <Link href="/docs/web-setup">Access the web dashboard</Link> and create your account
        </li>
        <li>
          <Link href="/docs/quick-start">Follow the quick start guide</Link> to create your first intervention
        </li>
      </ol>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
        <h3 className="mt-0 text-primary">Need Help?</h3>
        <p className="mb-0">
          If you have questions or run into issues, check out our{' '}
          <Link href="/docs/faq">FAQ</Link> or{' '}
          <Link href="/docs/troubleshooting">troubleshooting guide</Link>. You can also{' '}
          <Link href="/docs/contact-support">contact our support team</Link>.
        </p>
      </div>
    </DocPage>
  );
}
