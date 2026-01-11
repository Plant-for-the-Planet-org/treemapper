import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function MobileSetupPage() {
  return (
    <DocPage
      title="Mobile App Setup"
      description="Learn how to install and configure the TreeMapper mobile app on your iOS or Android device."
      pageId="mobile-setup"
    >
      <h2>System Requirements</h2>
      <ul>
        <li><strong>iOS</strong>: iOS 13.0 or later, iPhone 6s or newer</li>
        <li><strong>Android</strong>: Android 6.0 (API level 23) or higher</li>
        <li><strong>Storage</strong>: At least 200MB of free space</li>
        <li><strong>GPS</strong>: Device with GPS capabilities</li>
        <li><strong>Camera</strong>: For photo documentation</li>
      </ul>

      <h2>Installation</h2>

      <h3>iOS (iPhone/iPad)</h3>
      <ol>
        <li>Open the <strong>App Store</strong> on your device</li>
        <li>Search for "TreeMapper"</li>
        <li>Tap <strong>Get</strong> or the download icon</li>
        <li>Authenticate with Face ID, Touch ID, or your Apple ID password</li>
        <li>Wait for the download and installation to complete</li>
      </ol>

      <PlaceholderImage
        title="iOS App Store"
        description="Screenshot of TreeMapper in the iOS App Store"
        aspectRatio="portrait"
      />

      <h3>Android</h3>
      <ol>
        <li>Open the <strong>Google Play Store</strong></li>
        <li>Search for "TreeMapper"</li>
        <li>Tap <strong>Install</strong></li>
        <li>Wait for the download and installation to complete</li>
      </ol>

      <PlaceholderImage
        title="Google Play Store"
        description="Screenshot of TreeMapper in the Google Play Store"
        aspectRatio="portrait"
      />

      <h2>First Launch</h2>
      <p>When you first open TreeMapper, you'll need to complete these steps:</p>

      <h3>1. Grant Permissions</h3>
      <p>TreeMapper will request the following permissions:</p>
      <ul>
        <li><strong>Location</strong>: Required for GPS tracking and mapping interventions</li>
        <li><strong>Camera</strong>: Needed to take photos of trees and sites</li>
        <li><strong>Storage</strong>: To save photos and offline map data</li>
        <li><strong>Notifications</strong>: Optional, for sync status and reminders</li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">Important</h4>
        <p className="mb-0">
          Location permission is <strong>required</strong> for TreeMapper to function properly.
          Without it, you won't be able to map tree locations or create interventions.
        </p>
      </div>

      <PlaceholderImage
        title="Permission Requests"
        description="Screenshot showing permission dialogs"
        aspectRatio="portrait"
      />

      <h3>2. Sign In or Create Account</h3>
      <p>You have two options:</p>
      <ul>
        <li>
          <strong>Sign In</strong>: If your organization has already created an account for you,
          use your credentials to sign in
        </li>
        <li>
          <strong>Create Account</strong>: Register a new account with your email address
        </li>
      </ul>

      <PlaceholderImage
        title="Sign In Screen"
        description="Screenshot of the login/signup screen"
        aspectRatio="portrait"
      />

      <h3>3. Select or Create a Project</h3>
      <p>
        After signing in, you'll need to select a project to work on. Projects are organizational
        units that group your tree planting and monitoring activities.
      </p>
      <ul>
        <li>If you were invited to a project, select it from the list</li>
        <li>If you're starting fresh, create a new project by tapping "Create Project"</li>
      </ul>

      <PlaceholderImage
        title="Project Selection"
        description="Screenshot of the project selection screen"
        aspectRatio="portrait"
      />

      <h2>Initial Configuration</h2>

      <h3>Download Offline Maps (Recommended)</h3>
      <p>
        For the best experience when working in areas with poor connectivity, download offline
        maps before heading to the field:
      </p>
      <ol>
        <li>Open the sidebar menu (tap the ☰ icon)</li>
        <li>Go to <strong>Offline Maps</strong></li>
        <li>Select your region on the map</li>
        <li>Tap <strong>Download</strong></li>
        <li>Wait for the download to complete</li>
      </ol>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Tip</h4>
        <p className="mb-0">
          Download maps while connected to Wi-Fi to avoid using mobile data. Map tiles can be
          several hundred megabytes depending on the area size.
        </p>
      </div>

      <h3>Sync Species Database</h3>
      <p>
        The app will automatically download the tree species database on first launch.
        This database includes thousands of tree species with scientific names and details.
      </p>

      <h2>What's Next?</h2>
      <p>Now that your app is set up, you're ready to start using TreeMapper:</p>
      <ul>
        <li>
          <Link href="/docs/tutorials/first-intervention">Create your first intervention</Link>
        </li>
        <li>
          <Link href="/docs/mobile/map-navigation">Learn map navigation</Link>
        </li>
        <li>
          <Link href="/docs/tutorials/working-offline">Understand offline mode</Link>
        </li>
      </ul>
    </DocPage>
  );
}
