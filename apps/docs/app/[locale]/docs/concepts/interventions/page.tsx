import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function InterventionsPage() {
  return (
    <DocPage
      title="Understanding Interventions"
      description="Learn about interventions, the core concept in TreeMapper for documenting forestry actions."
      pageId="interventions"
    >
      <h2>What is an Intervention?</h2>
      <p>
        An <strong>intervention</strong> is any documented forestry action or activity in TreeMapper.
        It represents work performed at a specific location and time, such as planting trees,
        removing invasive species, maintaining existing forests, or conducting observations.
      </p>

      <p>
        Every intervention contains key information including location, date, type, species involved,
        photos, and measurements—creating a comprehensive record of your forestry work.
      </p>

      <PlaceholderImage
        title="Intervention Example"
        description="Visual representation of an intervention with all its components"
      />

      <h2>Intervention Types</h2>
      <p>TreeMapper supports multiple intervention types to cover various forestry activities:</p>

      <h3>Planting Interventions</h3>
      <ul>
        <li>
          <strong>Single Tree</strong>: Planting one tree at a specific point location
        </li>
        <li>
          <strong>Multi-Tree</strong>: Planting multiple trees within a defined area (polygon)
        </li>
        <li>
          <strong>Regeneration</strong>: Documenting natural forest regeneration or assisted
          regeneration efforts
        </li>
      </ul>

      <h3>Maintenance Interventions</h3>
      <ul>
        <li>
          <strong>Maintenance</strong>: General tree care activities like pruning, watering,
          or mulching
        </li>
        <li>
          <strong>Fire Suppression</strong>: Firebreak creation or fire prevention measures
        </li>
        <li>
          <strong>Fencing</strong>: Installing protective barriers around planted areas
        </li>
      </ul>

      <h3>Removal Interventions</h3>
      <ul>
        <li>
          <strong>Invasive Species Removal</strong>: Clearing non-native or harmful vegetation
        </li>
        <li>
          <strong>Dead Tree Removal</strong>: Removing deceased trees for safety or land management
        </li>
      </ul>

      <h3>Monitoring Interventions</h3>
      <ul>
        <li>
          <strong>Observation</strong>: Recording observations without physical work (wildlife,
          disease, etc.)
        </li>
        <li>
          <strong>Remeasurement</strong>: Follow-up measurements to track tree growth over time
        </li>
      </ul>

      <h2>Anatomy of an Intervention</h2>

      <h3>Required Fields</h3>
      <p>Every intervention must have these essential components:</p>
      <ul>
        <li><strong>Location</strong>: GPS coordinates (point) or boundary (polygon)</li>
        <li><strong>Type</strong>: The kind of intervention (planting, maintenance, etc.)</li>
        <li><strong>Date</strong>: When the intervention was performed</li>
        <li><strong>Project</strong>: Which project this intervention belongs to</li>
      </ul>

      <h3>Optional but Recommended</h3>
      <ul>
        <li><strong>Photos</strong>: Visual documentation of the intervention site</li>
        <li><strong>Species</strong>: Tree species involved (especially for planting)</li>
        <li><strong>Tree Count</strong>: Number of trees planted or affected</li>
        <li><strong>Measurements</strong>: Height, diameter, or other dimensions</li>
        <li><strong>Notes</strong>: Observations, conditions, or special circumstances</li>
        <li><strong>Site</strong>: Specific location within the project</li>
      </ul>

      <h3>Metadata (Automatic)</h3>
      <p>TreeMapper automatically captures:</p>
      <ul>
        <li><strong>Creator</strong>: User who recorded the intervention</li>
        <li><strong>Creation Time</strong>: Exact timestamp of record creation</li>
        <li><strong>Device Info</strong>: Mobile device details</li>
        <li><strong>Sync Status</strong>: Whether data has been uploaded to the server</li>
        <li><strong>GPS Accuracy</strong>: Precision of location data</li>
      </ul>

      <h2>Intervention Workflow</h2>

      <div className="space-y-4 my-8">
        <WorkflowStep
          number={1}
          title="Create"
          description="Open the app, navigate to the location, and start a new intervention"
        />
        <WorkflowStep
          number={2}
          title="Document"
          description="Add photos, select species, enter measurements, and record details"
        />
        <WorkflowStep
          number={3}
          title="Save Locally"
          description="Intervention is saved on your device, even without internet"
        />
        <WorkflowStep
          number={4}
          title="Sync"
          description="When online, data automatically syncs to the server"
        />
        <WorkflowStep
          number={5}
          title="Analyze"
          description="View intervention data on the web dashboard for reporting and analytics"
        />
      </div>

      <h2>Point vs Polygon Interventions</h2>

      <h3>Point Interventions</h3>
      <p>Best for:</p>
      <ul>
        <li>Single tree planting</li>
        <li>Individual tree observations</li>
        <li>Specific location markers</li>
      </ul>
      <p>
        Point interventions are marked with a single GPS coordinate representing the exact
        location of a tree or feature.
      </p>

      <h3>Polygon Interventions</h3>
      <p>Best for:</p>
      <ul>
        <li>Multi-tree planting over an area</li>
        <li>Forest restoration zones</li>
        <li>Maintenance areas</li>
        <li>Removal projects</li>
      </ul>
      <p>
        Polygon interventions define a boundary by walking the perimeter and recording GPS
        points. TreeMapper automatically calculates the area and displays it on maps.
      </p>

      <PlaceholderImage
        title="Point vs Polygon"
        description="Visual comparison showing point marker and polygon boundary on map"
      />

      <h2>Intervention Status</h2>

      <h3>Incomplete</h3>
      <p>
        Interventions saved as drafts without all required information. You can return to
        complete them later.
      </p>

      <h3>Pending Sync (Unsync)</h3>
      <p>
        Complete interventions stored locally but not yet uploaded to the server. They'll
        sync automatically when internet is available.
      </p>

      <h3>Synced</h3>
      <p>
        Interventions successfully uploaded to the server. Data is backed up and visible
        in the web dashboard.
      </p>

      <h3>Sync Failed</h3>
      <p>
        Interventions that encountered errors during sync. Usually due to server issues or
        connectivity problems. You can retry syncing from the Interventions tab.
      </p>

      <h2>Best Practices</h2>

      <h3>Accuracy</h3>
      <ul>
        <li>Wait for strong GPS signal (accuracy &lt; 10 meters) before marking locations</li>
        <li>Stand at the tree or center of planting area for point interventions</li>
        <li>Walk the actual perimeter slowly for polygon interventions</li>
      </ul>

      <h3>Documentation</h3>
      <ul>
        <li>Take photos from multiple angles (overview, close-up, context)</li>
        <li>Include people or objects for scale reference</li>
        <li>Capture "before" and "after" photos when possible</li>
        <li>Add descriptive notes about site conditions</li>
      </ul>

      <h3>Organization</h3>
      <ul>
        <li>Use consistent naming conventions for sites</li>
        <li>Tag interventions with relevant labels for easy filtering</li>
        <li>Record interventions promptly while details are fresh</li>
        <li>Sync data regularly to prevent loss</li>
      </ul>

      <h2>Common Questions</h2>

      <h3>Can I edit an intervention after syncing?</h3>
      <p>
        Yes, but with some limitations. You can edit most fields like notes, species, and
        measurements. However, changing the location or intervention type may require
        administrator approval depending on your project settings.
      </p>

      <h3>What happens to interventions if I delete the app?</h3>
      <p>
        Synced interventions are safe on the server. Unsynced interventions will be lost unless
        you sync before deleting. Always sync your data before uninstalling the app or
        switching devices.
      </p>

      <h3>How many interventions can I create offline?</h3>
      <p>
        There's no practical limit. You can create hundreds of interventions offline, limited
        only by your device storage (primarily photos). Each intervention is small (~1KB of data
        without photos).
      </p>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/first-intervention">Creating your first intervention</Link>
        </li>
        <li>
          <Link href="/docs/mobile/creating-interventions">Intervention creation guide</Link>
        </li>
        <li>
          <Link href="/docs/concepts/sync-offline">Understanding sync and offline mode</Link>
        </li>
      </ul>
    </DocPage>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold mt-0 mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-0">{description}</p>
      </div>
    </div>
  );
}
