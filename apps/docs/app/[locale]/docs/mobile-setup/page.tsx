import { DocPage } from '@/components/doc-page';
import { SignInGallery } from '@/components/sign-in-gallery';
import Link from 'next/link';
import Image from 'next/image';

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

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-4 sm:p-8 text-center my-6">
        <div className="relative w-full max-w-[391px]">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768790904166-IMG_2433.PNG"
            alt="Screenshot of TreeMapper in the iOS App Store"
            width={391}
            height={786}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, 391px"
          />
        </div>
        <h3 className="font-semibold text-lg mb-2 mt-4">iOS App Store</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Screenshot of TreeMapper in the iOS App Store</p>
      </div>

      <h3>Android</h3>
      <ol>
        <li>Open the <strong>Google Play Store</strong></li>
        <li>Search for "TreeMapper"</li>
        <li>Tap <strong>Install</strong></li>
        <li>Wait for the download and installation to complete</li>
      </ol>

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-4 sm:p-8 text-center my-6">
        <div className="relative w-full max-w-[391px]">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768790298811-playstore_android.png"
            alt="Screenshot of TreeMapper in the Google Play Store"
            width={391}
            height={786}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, 391px"
          />
        </div>
        <h3 className="font-semibold text-lg mb-2 mt-4">Google Play Store</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Screenshot of TreeMapper in the Google Play Store</p>
      </div>

      <h2>First Launch</h2>
      <p>When you first open TreeMapper, you'll need to complete these steps (sign-in is optional):</p>

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

      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-4 sm:p-8 text-center my-6">
        <div className="relative w-full max-w-[391px]">
          <Image
            src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799330873-IMG_2434.PNG"
            alt="Location permission screenshot"
            width={391}
            height={786}
            className="rounded-lg w-full h-auto"
            sizes="(max-width: 768px) 100vw, 391px"
          />
        </div>
        <h3 className="font-semibold text-lg mb-2 mt-4">Location Permission</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Screenshot showing the location permission dialog</p>
      </div>

      <h3>2. Sign In (Optional)</h3>
      <p>
        <strong>TreeMapper can be used completely without signing in.</strong> You can collect data,
        take photos, and export your data directly from the app without any account.
      </p>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">Using TreeMapper Without Sign-In</h4>
        <p className="mb-0">
          You can use TreeMapper fully offline to collect tree planting data, take measurements,
          document with photos, and export your data. No account or internet connection required
          for data collection.
        </p>
      </div>

      <p>
        However, signing in unlocks additional features:
      </p>
      <ul>
        <li>
          <strong>Cloud Backup</strong>: Upload your data to secure cloud storage for backup and
          access from multiple devices
        </li>
        <li>
          <strong>Project Management</strong>: Create and manage projects, collaborate with team
          members, and organize your restoration activities
        </li>
        <li>
          <strong>Web Dashboard Access</strong>: View and analyze your data on the web dashboard
          with advanced analytics, reporting, and visualization tools
        </li>
        <li>
          <strong>Team Collaboration</strong>: Share data with your organization and work together
          on restoration projects
        </li>
      </ul>

      <p>If you choose to sign in, you have two options:</p>
      <ul>
        <li>
          <strong>Sign In</strong>: If your organization has already created an account for you,
          use your credentials to sign in
        </li>
        <li>
          <strong>Create Account</strong>: Register a new account with your email address
        </li>
      </ul>

      <SignInGallery
        images={[
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799599331-IMG_2437.PNG',
            alt: 'Login button screen',
            title: 'Login Button',
          },
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799599332-IMG_2438.PNG',
            alt: 'Login page screen',
            title: 'Login Page',
          },
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799599332-IMG_2439.PNG',
            alt: 'Sidebar after successful sign-in',
            title: 'Sidebar After Sign-In',
          },
        ]}
      />

      <h3>3. Select or Create a Project (If Signed In)</h3>
      <p>
        If you signed in, you'll need to select or create a project to work on. Projects are
        organizational units that group your tree planting and monitoring activities.
      </p>
      <ul>
        <li>If you were invited to a project, select it from the list</li>
        <li>If you're starting fresh, create a new project by tapping "Create Project"</li>
      </ul>
      <p className="text-muted-foreground">
        <em>Note: If you're using TreeMapper without signing in, you can skip this step and start
        collecting data immediately.</em>
      </p>

      <SignInGallery
        images={[
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799960521-IMG_2442.PNG',
            alt: 'No project found',
            title: 'No project found',
          },
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799960521-IMG_2441.PNG',
            alt: 'Create Project Page',
            title: 'Create Project Page',
          },
          {
            src: 'https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768799960520-IMG_2443.PNG',
            alt: 'Select Project for intervention',
            title: 'Select Project for intervention',
          },
        ]}
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
