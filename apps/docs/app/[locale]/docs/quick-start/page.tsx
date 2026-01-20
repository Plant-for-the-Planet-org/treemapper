import { DocPage } from '@/components/doc-page';
import Link from 'next/link';

export default function QuickStartPage() {
  return (
    <DocPage
      title="Quick Start Guide"
      description="Get up and running with TreeMapper in 5 minutes."
      pageId="quick-start"
    >
      <p>
        This guide will get you started with TreeMapper quickly. Follow these steps to begin
        tracking your tree planting and forest monitoring activities.
      </p>

      <div className="grid md:grid-cols-2 gap-8 my-8">
        <div>
          <h2>5-Minute Setup</h2>
          <div className="space-y-6">
        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">Step 1: Install the Mobile App (2 minutes)</h3>
          <ul className="mb-0">
            <li>Download TreeMapper from the App Store (iOS) or Play Store (Android)</li>
            <li>Open the app and grant location and camera permissions</li>
            <li>Sign in or create a new account</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            <Link href="/docs/mobile-setup">Detailed mobile setup guide →</Link>
          </p>
        </div>

        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">Step 2: Create or Join a Project (1 minute)</h3>
          <ul className="mb-0">
            <li>If invited to a project, select it from the list</li>
            <li>Otherwise, tap "Create Project" and fill in the details</li>
            <li>Give your project a name and select your region</li>
          </ul>
        </div>

        <div className="border-l-4 border-primary pl-6">
          <h3 className="mt-0">Step 3: Create Your First Intervention (2 minutes)</h3>
          <ul className="mb-0">
            <li>Navigate to the Map tab</li>
            <li>Tap the + button to start a new intervention</li>
            <li>Choose "Tree Planting" as the intervention type</li>
            <li>Mark the location on the map</li>
            <li>Add a photo (optional but recommended)</li>
            <li>Select tree species and enter count</li>
            <li>Tap Save</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            <Link href="/docs/tutorials/first-intervention">Detailed intervention tutorial →</Link>
          </p>
        </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
            <video
              controls
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-[9/16] bg-black"
              poster="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/treemapper_quickstart_poster.jpg"
            >
              <source
                src="https://pub-261389c3bd084eb3a62686b2f08ce42b.r2.dev/docs/1768802057156-output.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      <h2>Essential Concepts</h2>

      <h3>Interventions</h3>
      <p>
        Interventions are any forestry actions you document—tree planting, removal, maintenance,
        or monitoring. Each intervention has a location, type, date, and associated data like
        species and photos.
      </p>
      <p>
        <Link href="/docs/concepts/interventions">Learn more about interventions →</Link>
      </p>

      <h3>Offline Mode</h3>
      <p>
        TreeMapper works completely offline. All data is stored on your device and syncs
        automatically when you reconnect to the internet. This makes it perfect for remote
        field work.
      </p>
      <p>
        <Link href="/docs/tutorials/working-offline">Learn more about offline mode →</Link>
      </p>

      <h3>Projects and Sites</h3>
      <p>
        Projects are top-level organizational units. Sites are specific geographic locations
        within a project where interventions take place. You can have multiple sites per project.
      </p>
      <p>
        <Link href="/docs/concepts/projects-sites">Learn more about projects and sites →</Link>
      </p>

      <h2>Common Tasks</h2>

      <div className="grid md:grid-cols-2 gap-4 my-8">
        <TaskCard
          title="Plant Trees"
          description="Create a tree planting intervention with location and species data"
          href="/docs/tutorials/first-intervention"
        />
        <TaskCard
          title="Set Up Monitoring Plot"
          description="Establish a standardized plot for long-term forest research"
          href="/docs/tutorials/monitoring-plots"
        />
        <TaskCard
          title="Take Measurements"
          description="Record tree height, diameter, and other scientific data"
          href="/docs/mobile/measurements"
        />
        <TaskCard
          title="View Analytics"
          description="Access the web dashboard to see progress charts and reports"
          href="/docs/web/overview"
        />
      </div>

      <h2>Tips for Success</h2>

      <ul>
        <li>
          <strong>Download offline maps</strong> before heading to the field to ensure map
          visibility without internet
        </li>
        <li>
          <strong>Take clear photos</strong> from multiple angles to document your work properly
        </li>
        <li>
          <strong>Be accurate with GPS</strong> by waiting for a strong signal before marking
          locations
        </li>
        <li>
          <strong>Sync regularly</strong> when you have Wi-Fi to back up your data
        </li>
        <li>
          <strong>Use consistent naming</strong> for projects and sites to stay organized
        </li>
      </ul>

      <h2>What's Next?</h2>

      <p>Now that you understand the basics, explore these guides:</p>
      <ul>
        <li>
          <Link href="/docs/mobile/map-navigation">Master map navigation</Link> to efficiently
          locate and visualize interventions
        </li>
        <li>
          <Link href="/docs/tutorials/managing-species">Manage tree species</Link> to customize
          your species catalog
        </li>
        <li>
          <Link href="/docs/web/team-management">Set up your team</Link> to collaborate with
          other users
        </li>
      </ul>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 my-8">
        <h3 className="mt-0 text-primary">Need Help?</h3>
        <p className="mb-0">
          Visit our <Link href="/docs/faq">FAQ</Link> for answers to common questions, or{' '}
          <Link href="/docs/contact-support">contact support</Link> if you need assistance.
        </p>
      </div>
    </DocPage>
  );
}

function TaskCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-lg border hover:border-primary transition-colors"
    >
      <h4 className="font-semibold mb-2 mt-0">{title}</h4>
      <p className="text-sm text-muted-foreground mb-0">{description}</p>
    </Link>
  );
}
