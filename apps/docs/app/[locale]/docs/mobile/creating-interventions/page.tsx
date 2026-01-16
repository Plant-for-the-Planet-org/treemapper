import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function CreatingInterventionsPage() {
  return (
    <DocPage
      title="Creating Interventions"
      description="Step-by-step guide to creating interventions in the TreeMapper mobile app."
      pageId="creating-interventions"
    >
      <h2>Overview</h2>
      <p>
        Creating an intervention in TreeMapper is a multi-step process that guides you through
        selecting the intervention type, marking the location, adding species information, and
        capturing photos and measurements. This comprehensive workflow ensures all necessary data is
        collected for each restoration activity.
      </p>

      <h2>Intervention Types</h2>
      <p>TreeMapper supports over 13 intervention types to cover various restoration activities:</p>

      <h3>Planting Interventions</h3>
      <ul>
        <li>
          <strong>Single Tree Planting</strong>: Plant one tree at a specific point location
        </li>
        <li>
          <strong>Multi-Tree Planting</strong>: Plant multiple trees within a defined polygon area
        </li>
        <li>
          <strong>Assisted Regeneration</strong>: Document areas where natural regeneration is being
          supported
        </li>
      </ul>

      <h3>Maintenance Interventions</h3>
      <ul>
        <li>
          <strong>Maintenance</strong>: General tree care like pruning, watering, or mulching
        </li>
        <li>
          <strong>Fire Suppression</strong>: Creating firebreaks or fire prevention measures
        </li>
        <li>
          <strong>Fire Patrol</strong>: Monitoring and patrolling for fire risks
        </li>
        <li>
          <strong>Fencing</strong>: Installing protective barriers
        </li>
      </ul>

      <h3>Removal and Other</h3>
      <ul>
        <li>
          <strong>Invasive Removal</strong>: Clearing non-native or harmful vegetation
        </li>
        <li>
          <strong>Grass Suppression</strong>: Managing grass competition
        </li>
        <li>
          <strong>Marking Regenerant</strong>: Identifying and marking natural seedlings
        </li>
        <li>
          <strong>Soil Improvement</strong>: Enhancing soil conditions for planting
        </li>
        <li>
          <strong>Stop Harvesting</strong>: Designating areas protected from harvesting
        </li>
        <li>
          <strong>Direct Seeding</strong>: Broadcasting seeds in restoration areas
        </li>
        <li>
          <strong>Other</strong>: Custom intervention types
        </li>
      </ul>

      <h2>Step-by-Step Creation Process</h2>

      <h3>Step 1: Start New Intervention</h3>
      <p>
        From the main map screen, tap the add button to start creating a new intervention. This
        opens the intervention form where you'll enter the basic details.
      </p>

      <PlaceholderImage
        title="New Intervention Form"
        description="Screenshot of the initial intervention form"
      />

      <h3>Step 2: Select Intervention Type</h3>
      <p>
        Choose the type of intervention you're performing from the list of available types. The
        selected type determines what additional information you'll need to provide.
      </p>

      <h3>Step 3: Choose Project and Site</h3>
      <p>Select which project this intervention belongs to. You can also optionally select a specific site within the project. For site-wide interventions, you can enable the "Entire Site" toggle to apply the intervention to the whole site.</p>

      <h3>Step 4: Set Intervention Date</h3>
      <p>
        The date picker allows you to set when the intervention was performed. By default, it's set
        to today's date, but you can adjust it if you're recording past activities.
      </p>

      <h3>Step 5: Add Location Name (Optional)</h3>
      <p>
        You can provide a descriptive location name and any additional information about the
        intervention site. This helps identify the intervention later.
      </p>

      <h2>Marking the Location</h2>
      <p>
        After completing the initial form, you'll mark the intervention location on the map. The app
        supports two location types:
      </p>

      <h3>Point Location</h3>
      <p>Best for single trees or specific spot interventions:</p>
      <ul>
        <li>The map opens with your current GPS location</li>
        <li>Tap on the map to place the marker at the exact intervention location</li>
        <li>The GPS accuracy indicator helps ensure precise placement</li>
        <li>You can drag the marker to adjust the position</li>
      </ul>

      <PlaceholderImage
        title="Point Marker"
        description="Screenshot showing point marker placement on the map"
      />

      <h3>Polygon Location</h3>
      <p>Best for area-based interventions like multi-tree planting:</p>
      <ul>
        <li>Tap points on the map to define the boundary corners</li>
        <li>Points are labeled alphabetically (A, B, C, etc.) for reference</li>
        <li>Lines connect the points to show the polygon shape</li>
        <li>Close the polygon by connecting back to the first point</li>
      </ul>

      <h4>GPS Polygon Tracking</h4>
      <p>
        For accurate polygon mapping, use the GPS tracking feature to walk the perimeter of the
        area:
      </p>
      <ul>
        <li>Enable the polygon tracker to automatically record your path</li>
        <li>Walk slowly along the boundary of the intervention area</li>
        <li>The app records GPS points as you move</li>
        <li>Stop tracking when you return to the starting point</li>
      </ul>

      <PlaceholderImage
        title="Polygon Tracking"
        description="Screenshot showing polygon boundary creation with GPS tracking"
      />

      <h2>Adding Species Information</h2>
      <p>
        For planting interventions, you'll be prompted to add species information. This can include:
      </p>
      <ul>
        <li>
          <strong>Species selection</strong>: Choose from your project's species list or search the
          database
        </li>
        <li>
          <strong>Tree count</strong>: Number of trees planted for each species
        </li>
        <li>
          <strong>Sample trees</strong>: Mark individual trees for detailed tracking
        </li>
      </ul>

      <h3>Registering Sample Trees</h3>
      <p>Sample trees are individual trees you want to track over time. For each sample tree:</p>
      <ul>
        <li>Mark the exact location on the map</li>
        <li>Add measurements (height, diameter)</li>
        <li>Take a photo of the tree</li>
        <li>Optionally assign a tree tag ID</li>
      </ul>

      <h2>Local and Dynamic Forms</h2>
      <p>
        Depending on the intervention type, you may see additional form screens for specific data
        collection:
      </p>
      <ul>
        <li>
          <strong>Local forms</strong>: Project-specific fields configured by your organization
        </li>
        <li>
          <strong>Dynamic forms</strong>: Intervention-type-specific fields for detailed data
          capture
        </li>
      </ul>

      <h2>Completing the Intervention</h2>
      <p>
        After filling in all required information, you'll see a preview screen showing all the
        collected data. Review the information and tap to complete the intervention. The
        intervention will be:
      </p>
      <ul>
        <li>Saved to your device immediately</li>
        <li>Synced to the server when you have internet connectivity</li>
        <li>Visible on the map and in your intervention list</li>
      </ul>

      <h2>Intervention Status</h2>
      <p>As you create an intervention, it progresses through these statuses:</p>
      <ul>
        <li>
          <strong>Initialized</strong>: Basic form started
        </li>
        <li>
          <strong>Location</strong>: Location marked
        </li>
        <li>
          <strong>Species</strong>: Species added (if required)
        </li>
        <li>
          <strong>Tree Details</strong>: Sample trees registered
        </li>
        <li>
          <strong>Local Form</strong>: Local form completed
        </li>
        <li>
          <strong>Dynamic Form</strong>: Dynamic form completed
        </li>
        <li>
          <strong>Complete</strong>: Ready for sync
        </li>
      </ul>

      <h2>Tips for Creating Interventions</h2>
      <ul>
        <li>
          <strong>Check GPS accuracy</strong>: Wait for high accuracy before marking locations
        </li>
        <li>
          <strong>Take clear photos</strong>: Capture the intervention site from multiple angles
        </li>
        <li>
          <strong>Be precise with polygons</strong>: Walk slowly when using GPS tracking for
          accurate boundaries
        </li>
        <li>
          <strong>Save often</strong>: The app saves progress automatically, but complete
          interventions when possible
        </li>
        <li>
          <strong>Work offline</strong>: You can create interventions without internet - they'll
          sync later
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/interventions">Understanding Interventions</Link>
        </li>
        <li>
          <Link href="/docs/mobile/measurements">Taking Measurements</Link>
        </li>
        <li>
          <Link href="/docs/mobile/photo-documentation">Photo Documentation</Link>
        </li>
        <li>
          <Link href="/docs/mobile/map-navigation">Map Navigation</Link>
        </li>
      </ul>
    </DocPage>
  );
}
