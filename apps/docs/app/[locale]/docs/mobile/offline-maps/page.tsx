import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function OfflineMapsPage() {
  return (
    <DocPage
      title="Offline Maps"
      description="Learn how to download and use offline maps in the TreeMapper mobile app."
      pageId="offline-maps"
    >
      <h2>Overview</h2>
      <p>
        TreeMapper allows you to download map tiles for offline use, ensuring you can navigate and
        record data even in areas without internet connectivity. This is essential for fieldwork in
        remote restoration sites.
      </p>

      <h2>How Offline Maps Work</h2>
      <p>
        Offline maps use MapLibre's offline pack system to store map tiles directly on your device.
        When you download an area:
      </p>
      <ul>
        <li>Map tiles for multiple zoom levels are saved to your device</li>
        <li>The area name is determined automatically via reverse geocoding</li>
        <li>Maps remain available until you delete them</li>
        <li>You can have multiple offline maps for different regions</li>
      </ul>

      <h2>Downloading Offline Maps</h2>

      <h3>Step 1: Select the Area</h3>
      <p>
        Navigate to the Offline Maps section and tap to add a new offline map. The map view opens
        where you can pan and zoom to select the area you want to download.
      </p>

      <PlaceholderImage
        title="Area Selection"
        description="Screenshot showing map area selection for offline download"
      />

      <h3>Step 2: Confirm Selection</h3>
      <p>
        Position the map view to show the area you need. The visible map bounds will determine what
        gets downloaded. Consider:
      </p>
      <ul>
        <li>Include all your restoration sites within the view</li>
        <li>Add some buffer around the edges for navigation</li>
        <li>Larger areas require more storage space</li>
      </ul>

      <h3>Step 3: Download</h3>
      <p>
        Tap "Save Area" to begin the download. The app will show a progress indicator while
        downloading:
      </p>
      <ul>
        <li>Download progress percentage</li>
        <li>Estimated tile count</li>
        <li>Download size</li>
      </ul>

      <PlaceholderImage
        title="Download Progress"
        description="Screenshot showing offline map download progress"
      />

      <h3>Step 4: Completion</h3>
      <p>
        When the download completes, the offline map is saved with metadata including the area name
        and file size. You'll see a confirmation notification and the map will appear in your
        offline maps list.
      </p>

      <h2>Download Specifications</h2>
      <p>TreeMapper downloads map tiles with the following specifications:</p>

      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">Setting</th>
              <th className="border border-border px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-border px-4 py-2">Minimum Zoom Level</td>
              <td className="border border-border px-4 py-2">14</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Maximum Zoom Level</td>
              <td className="border border-border px-4 py-2">20</td>
            </tr>
            <tr>
              <td className="border border-border px-4 py-2">Map Style</td>
              <td className="border border-border px-4 py-2">Configured via environment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The zoom levels ensure you have detailed maps for precise work while keeping download sizes
        manageable.
      </p>

      <h2>Managing Offline Maps</h2>

      <h3>Viewing Downloaded Maps</h3>
      <p>Access your offline maps from the Offline Maps screen. Each map shows:</p>
      <ul>
        <li>
          <strong>Map name</strong>: Auto-generated identifier with timestamp
        </li>
        <li>
          <strong>Area name</strong>: Geographic location name from reverse geocoding
        </li>
        <li>
          <strong>Size</strong>: Storage space used by the map tiles
        </li>
      </ul>

      <PlaceholderImage
        title="Offline Maps List"
        description="Screenshot showing the list of downloaded offline maps"
      />

      <h3>Deleting Offline Maps</h3>
      <p>To free up device storage, you can delete offline maps you no longer need:</p>
      <ul>
        <li>Open the Offline Maps screen</li>
        <li>Find the map you want to delete</li>
        <li>Tap the delete option</li>
        <li>Confirm deletion in the modal</li>
      </ul>
      <p>
        Deleted maps are completely removed from your device. You can re-download the area later if
        needed.
      </p>

      <h2>Using Offline Maps</h2>
      <p>
        Once downloaded, offline maps are automatically used when you're in the corresponding area
        without internet connectivity:
      </p>
      <ul>
        <li>
          <strong>Map navigation</strong>: Browse and navigate the map as usual
        </li>
        <li>
          <strong>Creating interventions</strong>: Mark locations on the offline map
        </li>
        <li>
          <strong>Plot management</strong>: Create and view plots using offline tiles
        </li>
        <li>
          <strong>Location tracking</strong>: GPS continues to work independently of map tiles
        </li>
      </ul>

      <p>
        When online maps aren't available and you don't have offline maps for an area, you'll see a
        basic map or no map tiles at all. GPS functionality remains available.
      </p>

      <h2>Storage Considerations</h2>

      <h3>Estimating Download Size</h3>
      <p>Offline map size depends on:</p>
      <ul>
        <li>
          <strong>Area size</strong>: Larger areas require more tiles
        </li>
        <li>
          <strong>Map detail</strong>: Areas with more features have larger tiles
        </li>
        <li>
          <strong>Zoom levels</strong>: More zoom levels mean more tiles
        </li>
      </ul>
      <p>
        A typical restoration site area might require 50-200 MB of storage, while larger regions
        could require several hundred MB.
      </p>

      <h3>Managing Device Storage</h3>
      <ul>
        <li>Download only the areas you need for upcoming fieldwork</li>
        <li>Delete maps after completing work in an area</li>
        <li>Monitor your device storage regularly</li>
        <li>Keep some buffer storage for photos and intervention data</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Before Fieldwork</h3>
      <ul>
        <li>
          <strong>Download in advance</strong>: Download maps while you have good WiFi connection
        </li>
        <li>
          <strong>Verify coverage</strong>: Check that your downloaded area covers all planned work
          sites
        </li>
        <li>
          <strong>Check storage</strong>: Ensure you have enough space for maps and new data
        </li>
      </ul>

      <h3>In the Field</h3>
      <ul>
        <li>
          <strong>Test before going remote</strong>: Verify offline maps work before losing
          connectivity
        </li>
        <li>
          <strong>Use GPS wisely</strong>: GPS accuracy may vary; wait for good signal
        </li>
        <li>
          <strong>Conserve battery</strong>: Offline map use consumes less battery than streaming
          tiles
        </li>
      </ul>

      <h3>After Fieldwork</h3>
      <ul>
        <li>
          <strong>Sync data</strong>: Upload collected data when back online
        </li>
        <li>
          <strong>Clean up</strong>: Delete offline maps if no longer needed
        </li>
        <li>
          <strong>Download updates</strong>: Re-download areas if map data has changed
          significantly
        </li>
      </ul>

      <h2>Troubleshooting</h2>

      <h3>Download Fails</h3>
      <ul>
        <li>Check your internet connection stability</li>
        <li>Try a smaller area first</li>
        <li>Ensure you have sufficient device storage</li>
        <li>Restart the app and try again</li>
      </ul>

      <h3>Maps Not Displaying Offline</h3>
      <ul>
        <li>Verify the offline map covers your current location</li>
        <li>Check that the map wasn't accidentally deleted</li>
        <li>Zoom to a level within the downloaded range (14-20)</li>
      </ul>

      <h3>Slow Download</h3>
      <ul>
        <li>Large areas take longer to download</li>
        <li>Use WiFi instead of cellular data for faster downloads</li>
        <li>Download during off-peak hours if possible</li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/mobile/map-navigation">Map Navigation</Link>
        </li>
        <li>
          <Link href="/docs/concepts/sync-offline">Sync & Offline Mode</Link>
        </li>
        <li>
          <Link href="/docs/mobile/creating-interventions">Creating Interventions</Link>
        </li>
      </ul>
    </DocPage>
  );
}
