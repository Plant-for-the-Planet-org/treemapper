import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function FirstInterventionPage() {
  return (
    <DocPage
      title="Creating Your First Intervention"
      description="Step-by-step guide to recording your first tree planting intervention in TreeMapper."
      pageId="first-intervention"
    >
      <p>
        An <strong>intervention</strong> in TreeMapper is any forestry action you document—such as
        planting trees, removing invasive species, or maintaining existing forests. This tutorial
        will walk you through creating your first tree planting intervention.
      </p>

      <h2>Before You Begin</h2>
      <p>Make sure you have:</p>
      <ul>
        <li>Installed and set up the TreeMapper mobile app</li>
        <li>Granted location permissions</li>
        <li>GPS signal (you should see your location on the map)</li>
        <li>Selected an active project (optional - only if you're signed in and want to upload to server)</li>
      </ul>

      <h2>Step 1: Navigate to the Map</h2>
      <p>
        Open the TreeMapper app and tap on the <strong>Map</strong> tab at the bottom of the screen.
        You should see an interactive map centered on your current location.
      </p>

      <PlaceholderImage
        title="Map View"
        description="Screenshot of the TreeMapper map interface showing user location"
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Tip</h4>
        <p className="mb-0">
          If you don't see your location, make sure GPS is enabled and you have location
          permissions granted. It may take a few seconds to acquire a GPS signal.
        </p>
      </div>

      <h2>Step 2: Start a New Intervention</h2>
      <p>Tap the large <strong>+ (plus)</strong> button at the bottom center of the screen to create a new intervention.</p>

      <PlaceholderImage
        title="Add Button"
        description="Screenshot highlighting the + button to create new intervention"
        aspectRatio="portrait"
      />

      <h2>Step 3: Select Intervention Type</h2>
      <p>
        Choose the type of intervention you want to create. TreeMapper supports multiple types:
      </p>
      <ul>
        <li><strong>Single Tree</strong>: For planting individual trees</li>
        <li><strong>Multi-Tree</strong>: For planting multiple trees in an area</li>
        <li><strong>Regeneration</strong>: Natural forest regeneration</li>
        <li><strong>Maintenance</strong>: Tree care and maintenance activities</li>
        <li><strong>Removal</strong>: Removing invasive species or dead trees</li>
      </ul>

      <PlaceholderImage
        title="Intervention Types"
        description="Screenshot showing intervention type selection screen"
        aspectRatio="portrait"
      />

      <h2>Step 4: Mark the Location</h2>
      <p>
        After selecting the intervention type, mark where the intervention is taking place:
      </p>

      <h3>Point Location (Single Tree)</h3>
      <p>
        For a single tree, simply tap on the map where the tree is located. A marker will appear
        at that location.
      </p>

      <h3>Polygon Area (Multi-Tree)</h3>
      <p>
        For planting multiple trees over an area:
      </p>
      <ol>
        <li>Walk to the first corner of your planting area</li>
        <li>Tap to place the first point</li>
        <li>Walk to each corner, tapping to place additional points</li>
        <li>Tap the first point again to close the polygon</li>
      </ol>

      <PlaceholderImage
        title="Drawing Polygon"
        description="Screenshot showing polygon drawing on map for multi-tree intervention"
        aspectRatio="portrait"
      />

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-green-600 dark:text-green-500">Pro Tip</h4>
        <p className="mb-0">
          For accurate polygon mapping, walk slowly around the perimeter of your planting area.
          The app will track your GPS position automatically. You can edit the polygon later
          if needed.
        </p>
      </div>

      <h2>Step 5: Select Species (If Intervention Supports)</h2>
      <p>
        If your intervention type supports species selection (like Single Tree or Multi-Tree),
        specify which tree species you're planting:
      </p>
      <ol>
        <li>Tap on <strong>"Add Species"</strong></li>
        <li>Search for the species by common or scientific name</li>
        <li>Select the species from the results</li>
        <li>Enter the number of trees being planted (for multi-tree interventions)</li>
      </ol>

      <PlaceholderImage
        title="Species Selection"
        description="Screenshot of species search and selection interface"
        aspectRatio="portrait"
      />

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-yellow-600 dark:text-yellow-500">Note</h4>
        <p className="mb-0">
          If you can't find your species in the database, you can add a custom species or
          contact your project administrator. Learn more in the{' '}
          <Link href="/docs/tutorials/managing-species">Managing Species guide</Link>.
        </p>
      </div>

      <h2>Step 6: Capture Photo (For Single Tree/Multi-Tree)</h2>
      <p>
        <strong>Note:</strong> Photo capture is only available for interventions that support tree planting
        (Single Tree or Multi-Tree) after you've selected the location.
      </p>
      <p>
        Photo documentation is crucial for monitoring progress over time. Take at least one photo
        of your intervention site:
      </p>
      <ol>
        <li>Tap the <strong>camera icon</strong></li>
        <li>Take a photo of the planting area or tree</li>
        <li>Review and confirm the photo</li>
        <li>Add more photos if desired (recommended: before, during, and after shots)</li>
      </ol>

      <PlaceholderImage
        title="Photo Capture"
        description="Screenshot of camera interface for taking intervention photos"
        aspectRatio="portrait"
      />

      <h2>Step 7: Add Measurements (For Trees)</h2>
      <p>
        For tree planting interventions, you can add measurements to track growth over time:
      </p>
      <ul>
        <li><strong>Tree Height</strong>: Height of the tree or sapling</li>
        <li><strong>Diameter</strong>: Trunk diameter measurements (DBH - Diameter at Breast Height)</li>
        <li><strong>Planting Date</strong>: When the trees were planted (defaults to today)</li>
        <li><strong>Other Measurements</strong>: Additional scientific data as needed</li>
      </ul>

      <PlaceholderImage
        title="Measurements"
        description="Screenshot showing measurement input fields"
        aspectRatio="portrait"
      />

      <h2>Step 8: Add Optional Tags</h2>
      <p>
        You can add custom tags to categorize and organize your interventions:
      </p>
      <ul>
        <li><strong>Tags</strong>: Custom labels for categorization (e.g., "monitoring plot", "restoration zone")</li>
        <li><strong>Notes</strong>: Any observations or special conditions</li>
      </ul>

      <PlaceholderImage
        title="Intervention Details"
        description="Screenshot of the intervention details form with tags and notes"
        aspectRatio="portrait"
      />

      <h2>Understanding Sample Trees (Multi-Tree Interventions)</h2>
      <p>
        For <strong>Multi-Tree</strong> interventions, TreeMapper supports the concept of <strong>sample trees</strong>.
        Sample trees are random tree data points within your planted location that you can register for
        long-term monitoring.
      </p>
      
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Example</h4>
        <p className="mb-0">
          If you've planted 2000 trees in a multi-tree plantation with different species, you can register
          random sample trees (preferably of different species) from the location. Over time, you can
          monitor and remeasure these sample trees to assess the impact and growth of your restoration efforts.
        </p>
      </div>

      <p>Benefits of sample trees:</p>
      <ul>
        <li>Representative monitoring without measuring every single tree</li>
        <li>Track growth and survival rates over time</li>
        <li>Compare performance across different species</li>
        <li>Scientific data collection for impact assessment</li>
      </ul>

      <p>
        To add sample trees in a multi-tree intervention, select individual trees within your planted
        area and register them with specific measurements and photos. These sample trees will be marked
        for future monitoring visits.
      </p>

      <h2>Step 9: Register Intervention</h2>
      <p>
        Once you've completed all the steps, your intervention is registered. You have two options:
      </p>

      <h3>Option 1: Export Data</h3>
      <p>
        You can export your intervention data directly from the app without signing in. This allows
        you to share or backup your data locally.
      </p>

      <h3>Option 2: Save and Upload to Server</h3>
      <p>
        If you're signed in, you can save the intervention and upload it to the server for:
      </p>
      <ul>
        <li>Cloud backup and synchronization</li>
        <li>Access from multiple devices</li>
        <li>Viewing on the web dashboard</li>
        <li>Team collaboration and project management</li>
      </ul>

      <p>
        Before saving, review all the information you've entered:
      </p>
      <ol>
        <li>Check the location is correct on the map</li>
        <li>Verify species selection and tree count (if applicable)</li>
        <li>Ensure photos are clear and relevant (for tree planting interventions)</li>
        <li>Review measurements and tags</li>
        <li>Tap <strong>"Save"</strong> or <strong>"Register"</strong></li>
      </ol>

      <PlaceholderImage
        title="Review Screen"
        description="Screenshot of intervention preview before registration"
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Offline Mode</h4>
        <p className="mb-0">
          TreeMapper works fully offline! You can create dozens of interventions in the field
          without internet. Your data is saved locally and can be exported or synced when you
          reconnect. Learn more about{' '}
          <Link href="/docs/tutorials/working-offline">working offline</Link>.
        </p>
      </div>

      <h2>What's Next?</h2>
      <p>Congratulations! You've created your first intervention. Here's what to explore next:</p>
      <ul>
        <li>
          <Link href="/docs/tutorials/monitoring-plots">Set up monitoring plots</Link> to track
          tree growth over time
        </li>
        <li>
          <Link href="/docs/mobile/measurements">Learn about taking measurements</Link> for
          scientific data collection
        </li>
        <li>
          <Link href="/docs/web/overview">View your intervention on the web dashboard</Link> to
          see analytics and reports
        </li>
      </ul>

      <h2>Common Questions</h2>

      <h3>Can I edit an intervention after creating it?</h3>
      <p>
        Yes! Navigate to the Interventions tab, find your intervention, and tap to edit it.
        You can modify details, add more photos, or adjust the location.
      </p>

      <h3>What if I make a mistake?</h3>
      <p>
        Don't worry—interventions can be edited or deleted. If you've already synced, contact
        your project administrator for help with deletions.
      </p>

      <h3>How do I know if my intervention synced?</h3>
      <p>
        Check the Interventions tab. Synced interventions show a green checkmark, while
        unsynced ones show an orange cloud icon with "Pending Upload."
      </p>
    </DocPage>
  );
}
