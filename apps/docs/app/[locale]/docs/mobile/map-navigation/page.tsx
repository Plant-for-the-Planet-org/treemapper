import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function MapNavigationPage() {
  return (
    <DocPage
      title="Map Navigation"
      description="Learn how to navigate and interact with maps in the TreeMapper mobile app."
      pageId="map-navigation"
    >
      <h2>Overview</h2>
      <p>
        The TreeMapper mobile app uses an interactive map as the primary interface for viewing and
        managing your restoration work. The map displays all your interventions, sites, and trees,
        allowing you to navigate to specific locations and record new data in the field.
      </p>

      <PlaceholderImage
        title="Map Interface"
        description="Screenshot of the main map view showing interventions and sites"
      />

      <h2>Map Views</h2>
      <p>TreeMapper offers two map view options to suit different needs:</p>

      <h3>Standard Map View</h3>
      <p>
        The default map view shows roads, terrain, and landmarks. This view is useful for general
        navigation and understanding the landscape context of your restoration sites.
      </p>

      <h3>Satellite View</h3>
      <p>
        Toggle to satellite view for aerial imagery of your sites. This is particularly helpful for:
      </p>
      <ul>
        <li>Identifying vegetation cover and land use patterns</li>
        <li>Verifying site boundaries against actual terrain</li>
        <li>Planning new planting areas based on existing vegetation</li>
        <li>Assessing forest density and gaps</li>
      </ul>
      <p>
        Tap the satellite icon in the map controls to switch between standard and satellite views.
      </p>

      <h2>Map Elements</h2>

      <h3>Interventions</h3>
      <p>
        Interventions appear on the map as markers (for point interventions) or shaded areas (for
        polygon interventions). The map uses clustering to group nearby interventions when zoomed
        out, making it easier to see the overall distribution of your work.
      </p>
      <ul>
        <li>
          <strong>Clustered markers</strong>: When zoomed out, nearby interventions are grouped into
          clusters showing the count of interventions in that area
        </li>
        <li>
          <strong>Individual markers</strong>: Zoom in to see individual intervention markers
        </li>
        <li>
          <strong>Polygon shapes</strong>: Area-based interventions display as outlined polygons on
          the map
        </li>
      </ul>

      <h3>Sites</h3>
      <p>
        Project sites appear as polygon boundaries on the map, showing the defined areas where
        restoration activities take place. Sites help you understand the geographic scope of your
        project.
      </p>

      <h3>Sample Trees</h3>
      <p>
        When viewing a specific intervention, individual sample trees appear as markers within the
        intervention area. This allows you to see the distribution of planted trees and navigate to
        specific trees for remeasurement.
      </p>

      <PlaceholderImage
        title="Sample Trees on Map"
        description="Screenshot showing individual tree markers within an intervention"
      />

      <h2>Interacting with the Map</h2>

      <h3>Selecting Interventions</h3>
      <p>
        Tap on any intervention marker or polygon to select it. When selected, the intervention
        details appear in a carousel at the bottom of the screen, showing:
      </p>
      <ul>
        <li>Intervention type and date</li>
        <li>Number of trees planted</li>
        <li>Species information</li>
        <li>Sync status</li>
      </ul>
      <p>Tap on the carousel card to open the full intervention details.</p>

      <h3>User Location</h3>
      <p>
        Your current location is shown on the map with a location marker. The app also displays GPS
        accuracy information, helping you understand the precision of your location data. For best
        results when recording interventions, wait for the GPS accuracy indicator to show high
        accuracy (under 10 meters).
      </p>

      <h3>Zoom and Pan</h3>
      <ul>
        <li>
          <strong>Pinch to zoom</strong>: Use two fingers to zoom in and out
        </li>
        <li>
          <strong>Drag to pan</strong>: Slide one finger to move around the map
        </li>
        <li>
          <strong>Double-tap</strong>: Quickly zoom in on a location
        </li>
        <li>
          <strong>Zoom scale</strong>: A scale indicator shows the current zoom level for context
        </li>
      </ul>

      <h2>Filtering Interventions</h2>
      <p>
        The map includes powerful filtering options to help you find specific interventions:
      </p>

      <h3>Filter by Type</h3>
      <p>
        Show only specific intervention types such as planting, maintenance, or monitoring
        interventions.
      </p>

      <h3>Filter by Date</h3>
      <p>Set a date range to display interventions from a specific time period.</p>

      <h3>Filter by Status</h3>
      <p>Filter by completion status to find incomplete interventions that need attention.</p>

      <h3>Remeasurement Filter</h3>
      <p>
        Show only trees that are due for remeasurement. Trees requiring remeasurement appear in red
        on the map, making them easy to identify and navigate to.
      </p>

      <PlaceholderImage
        title="Map Filters"
        description="Screenshot showing the filter options panel"
      />

      <h2>GPS Accuracy</h2>
      <p>
        TreeMapper displays GPS accuracy information to help you collect precise location data. The
        accuracy indicator shows:
      </p>
      <ul>
        <li>
          <strong>High accuracy (green)</strong>: Under 10 meters - ideal for recording
          interventions
        </li>
        <li>
          <strong>Medium accuracy (yellow)</strong>: 10-25 meters - acceptable for most purposes
        </li>
        <li>
          <strong>Low accuracy (red)</strong>: Over 25 meters - consider waiting for better signal
        </li>
      </ul>
      <p>
        For best results, ensure you have a clear view of the sky and wait for the accuracy to
        improve before marking locations.
      </p>

      <h2>Tips for Effective Navigation</h2>
      <ul>
        <li>
          <strong>Download offline maps</strong>: Before going to areas with poor connectivity,
          download offline maps to ensure you can navigate even without internet
        </li>
        <li>
          <strong>Use satellite view</strong>: Switch to satellite view to better identify terrain
          features and existing vegetation
        </li>
        <li>
          <strong>Check GPS accuracy</strong>: Always verify GPS accuracy before recording
          intervention locations
        </li>
        <li>
          <strong>Use filters</strong>: When working on specific tasks, use filters to reduce map
          clutter and focus on relevant interventions
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/mobile/creating-interventions">Creating Interventions</Link>
        </li>
        <li>
          <Link href="/docs/mobile/offline-maps">Offline Maps</Link>
        </li>
        <li>
          <Link href="/docs/concepts/remeasurement">Remeasurement</Link>
        </li>
      </ul>
    </DocPage>
  );
}
