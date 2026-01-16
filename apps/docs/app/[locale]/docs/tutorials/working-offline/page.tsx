import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function WorkingOfflinePage() {
  return (
    <DocPage
      title="Working Offline"
      description="Learn how TreeMapper works completely offline, enabling data collection in remote locations without internet connectivity."
      pageId="working-offline"
    >
      <p>
        TreeMapper app works completely offline. This is to make sure that recording and other
        things work the same way in remote locations.
      </p>

      <p>
        All core functionality is available without an internet connection, allowing you to collect
        data, take photos, and manage your restoration activities even in the most remote areas.
        The only time internet is required is when you want to upload data to the server for backup
        and use the web dashboard for better management and analysis.
      </p>

      <PlaceholderImage
        title="Offline Mode"
        description="Screenshot showing TreeMapper working offline"
        aspectRatio="portrait"
      />

      <h2>1. Offline Maps</h2>
      <p>
        User can download the maps for the area where they plan to do the restoration ahead of time.
        This will make sure map is available to use while recording trees at the time of restoration.
      </p>

      <p>To download offline maps:</p>
      <ol>
        <li>Navigate to <strong>Offline Maps</strong> from the sidebar</li>
        <li>Enter the name of the location</li>
        <li>Download the area</li>
      </ol>

      <p>
        TreeMapper supports many locations to be downloaded offline, so you can prepare multiple
        restoration sites before heading to the field.
      </p>

      <PlaceholderImage
        title="Offline Maps Download"
        description="Screenshot showing offline map download interface"
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Tip</h4>
        <p className="mb-0">
          Download maps while connected to Wi-Fi to avoid using mobile data. Map tiles can be
          several hundred megabytes depending on the area size.
        </p>
      </div>

      <h2>2. Offline Species Available (60K+)</h2>
      <p>
        During the first time of app launch, TreeMapper would automatically download the species
        database which consists of 60K+ species. You can then manage it from the{' '}
        <Link href="/docs/tutorials/managing-species">Manage Species</Link> section for the database.
      </p>

      <p>
        You can always refetch/refresh the species by clicking on the refresh icon from the species
        database. This ensures you have the latest species information when you have internet
        connectivity.
      </p>

      <PlaceholderImage
        title="Species Database"
        description="Screenshot showing offline species database with 60K+ species"
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">Important</h4>
        <p className="mb-0">
          Once downloaded, the species database is always available offline. You can search, filter,
          and use all 60K+ species without any internet connection.
        </p>
      </div>

      <h2>3. Image Collection</h2>
      <p>
        For the image capture of the trees, it's available offline and is stored locally. You can
        take photos of trees, interventions, and monitoring plots without any internet connection.
      </p>

      <p>All photos are:</p>
      <ul>
        <li>Captured using your device's camera</li>
        <li>Stored locally on your device</li>
        <li>Available for viewing and editing offline</li>
        <li>Automatically synced when you upload data to the server (if signed in)</li>
      </ul>

      <PlaceholderImage
        title="Offline Photo Capture"
        description="Screenshot showing camera interface for offline photo capture"
        aspectRatio="portrait"
      />

      <h2>4. Export Data</h2>
      <p>
        After successful registration of trees, the data can be exported to GeoJSON format so it
        can be used in any ArcGIS supported device or other GIS software.
      </p>

      <p>Export functionality allows you to:</p>
      <ul>
        <li>Export all your collected data without internet connection</li>
        <li>Share data with other tools and platforms</li>
        <li>Create backups of your work</li>
        <li>Use data in external analysis tools</li>
      </ul>

      <PlaceholderImage
        title="Data Export"
        description="Screenshot showing data export options including GeoJSON format"
        aspectRatio="portrait"
      />

      <h2>5. Monitoring Plot</h2>
      <p>
        The component monitoring plot is offline based. Everything recorded is stored offline.
      </p>

      <p>You can fully use monitoring plots offline, including:</p>
      <ul>
        <li>Creating new monitoring plots</li>
        <li>Adding plants to plots</li>
        <li>Recording measurements and observations</li>
        <li>Viewing plot data and timelines</li>
        <li>Editing plot information</li>
      </ul>

      <p>
        All monitoring plot data is stored locally and will sync to the server when you upload
        your data (if signed in).
      </p>

      <PlaceholderImage
        title="Offline Monitoring Plot"
        description="Screenshot showing monitoring plot functionality available offline"
        aspectRatio="portrait"
      />

      <h2>When Internet Is Required</h2>
      <p>
        The only time TreeMapper requires internet is when you want to upload the data to the
        server to have a backup of it and use this data to better manage it using the web dashboard
        and also for analysis.
      </p>

      <p>Internet connectivity enables:</p>
      <ul>
        <li>
          <strong>Cloud Backup</strong>: Upload your data to secure cloud storage for backup and
          access from multiple devices
        </li>
        <li>
          <strong>Web Dashboard Access</strong>: View and analyze your data on the web dashboard
          with advanced analytics, reporting, and visualization tools
        </li>
        <li>
          <strong>Team Collaboration</strong>: Share data with your organization and work together
          on restoration projects
        </li>
        <li>
          <strong>Species Database Updates</strong>: Refresh the species database to get the
          latest additions
        </li>
        <li>
          <strong>Offline Map Downloads</strong>: Download new map areas for future field work
        </li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">Note</h4>
        <p className="mb-0">
          You can work completely offline and export your data without ever signing in. Internet
          connectivity is only needed if you want to use cloud backup and web dashboard features.
        </p>
      </div>

      <h2>What's Next?</h2>
      <p>Now that you understand offline functionality, explore these guides:</p>
      <ul>
        <li>
          <Link href="/docs/tutorials/first-intervention">Create your first intervention</Link> -
          works completely offline
        </li>
        <li>
          <Link href="/docs/tutorials/monitoring-plots">Set up monitoring plots</Link> - all
          functionality available offline
        </li>
        <li>
          <Link href="/docs/mobile-setup">Learn about mobile app setup</Link> including offline
          map downloads
        </li>
      </ul>
    </DocPage>
  );
}
