import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function SitesManagementPage() {
  return (
    <DocPage
      title="Managing Sites"
      description="Learn how to create and manage restoration sites in the TreeMapper web dashboard."
      pageId="sites-management"
    >
      <h2>Overview</h2>
      <p>
        Sites are geographic areas within your project where restoration activities take place. The
        web dashboard provides comprehensive tools for creating, viewing, editing, and managing
        sites.
      </p>

      <h2>Viewing Sites</h2>
      <p>
        The Sites page displays all sites within your current project. You can switch between
        different view modes:
      </p>

      <h3>Grid View</h3>
      <p>
        Visual card-based layout showing site previews with key information at a glance.
      </p>

      <h3>List View</h3>
      <p>
        Tabular layout with sortable columns for detailed comparison and management.
      </p>

      <PlaceholderImage
        title="Sites List"
        description="Screenshot showing the sites list view"
      />

      <h2>Site Information</h2>
      <p>Each site displays the following information:</p>
      <ul>
        <li>
          <strong>Site name</strong>: Descriptive name for the site
        </li>
        <li>
          <strong>Description</strong>: Details about the site and its purpose
        </li>
        <li>
          <strong>Creation date</strong>: When the site was created
        </li>
        <li>
          <strong>Creator</strong>: Team member who created the site
        </li>
        <li>
          <strong>Last updated</strong>: Most recent modification timestamp
        </li>
        <li>
          <strong>Area</strong>: Size in hectares calculated from the GeoJSON boundary
        </li>
        <li>
          <strong>Status</strong>: Current site status (active, etc.)
        </li>
        <li>
          <strong>Members</strong>: Team members assigned to the site
        </li>
      </ul>

      <h2>Searching and Filtering</h2>
      <p>Find specific sites using the search and filter options:</p>
      <ul>
        <li>
          <strong>Search by name</strong>: Type to filter sites by name
        </li>
        <li>
          <strong>Status filter</strong>: Show all sites or filter by status
        </li>
        <li>
          <strong>Sortable columns</strong>: Click column headers to sort by name, creation date,
          etc.
        </li>
      </ul>

      <h2>Creating a New Site</h2>
      <p>
        To create a new site, click the "Create Site" button to navigate to the site creation page.
      </p>

      <h3>Site Details</h3>
      <p>Provide the following information:</p>
      <ul>
        <li>
          <strong>Site name</strong>: A unique, descriptive name
        </li>
        <li>
          <strong>Description</strong>: Optional details about the site
        </li>
        <li>
          <strong>Site type</strong>: Category of the site (Planting, Planted, Barren,
          Reforestation)
        </li>
      </ul>

      <h3>Defining Site Boundaries</h3>
      <p>Site boundaries can be defined in two ways:</p>

      <h4>Draw on Map</h4>
      <p>
        Use the interactive map to draw a polygon boundary around your site. Click to add points and
        close the polygon to complete the boundary.
      </p>

      <h4>Upload GeoJSON</h4>
      <p>
        If you have existing GIS data, upload a GeoJSON file containing the site boundary polygon.
        The system will validate and import the geometry.
      </p>

      <PlaceholderImage
        title="Site Creation"
        description="Screenshot showing the site creation interface with map drawing"
      />

      <h3>Area Calculation</h3>
      <p>
        Once the boundary is defined, TreeMapper automatically calculates the site area in hectares
        based on the GeoJSON geometry.
      </p>

      <h2>Editing Sites</h2>
      <p>
        You can edit existing sites to update their information:
      </p>

      <h3>Editable Fields</h3>
      <ul>
        <li>Site name</li>
        <li>Description</li>
        <li>GeoJSON geometry (boundary)</li>
      </ul>

      <h3>In-Place Editing</h3>
      <p>
        Click the edit button on a site to modify its details. Changes are saved when you confirm,
        or cancelled if you dismiss the edit mode.
      </p>

      <h3>Geometry Updates</h3>
      <p>
        When you update the site boundary, the area is automatically recalculated to reflect the new
        geometry.
      </p>

      <h2>Site Access Control</h2>
      <p>
        Manage who can access and work within each site. This is useful for large projects with
        multiple teams working in different areas.
      </p>

      <h3>Managing Access</h3>
      <ol>
        <li>Open the site access modal</li>
        <li>Add or remove team members from the site</li>
        <li>Save changes to update access permissions</li>
      </ol>

      <h3>Access Levels</h3>
      <p>
        Site access works in conjunction with project-level roles. Team members with site access can
        work within that site according to their project role.
      </p>

      <PlaceholderImage
        title="Site Access"
        description="Screenshot showing the site access management modal"
      />

      <h2>Deleting Sites</h2>
      <p>
        Sites can be deleted if they're no longer needed:
      </p>
      <ol>
        <li>Click the delete option on the site</li>
        <li>Confirm deletion in the modal dialog</li>
        <li>The site and its associations are removed</li>
      </ol>
      <p>
        <strong>Note:</strong> Deleting a site does not delete interventions recorded within it, but
        those interventions will no longer be associated with a site.
      </p>

      <h2>Site Types</h2>
      <p>TreeMapper supports different site types to categorize your restoration areas:</p>

      <h3>Planting</h3>
      <p>Areas actively designated for tree planting activities.</p>

      <h3>Planted</h3>
      <p>Areas where planting has been completed.</p>

      <h3>Barren</h3>
      <p>Cleared or empty areas awaiting restoration.</p>

      <h3>Reforestation</h3>
      <p>Areas undergoing reforestation efforts, possibly including natural regeneration.</p>

      <h2>Best Practices</h2>

      <h3>Naming Conventions</h3>
      <ul>
        <li>Use descriptive, consistent names across sites</li>
        <li>Include location references when helpful</li>
        <li>Avoid special characters that may cause issues</li>
      </ul>

      <h3>Boundary Accuracy</h3>
      <ul>
        <li>Use GeoJSON files from surveyed data when available</li>
        <li>Draw boundaries carefully, following actual site perimeters</li>
        <li>Update boundaries if site areas change</li>
      </ul>

      <h3>Access Management</h3>
      <ul>
        <li>Assign only necessary team members to each site</li>
        <li>Review access periodically as team composition changes</li>
        <li>Use site-level access for larger projects with distinct teams</li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/concepts/projects-sites">Projects vs Sites</Link>
        </li>
        <li>
          <Link href="/docs/tutorials/site-creation">Site Creation Tutorial</Link>
        </li>
        <li>
          <Link href="/docs/web/team-management">Team Management</Link>
        </li>
      </ul>
    </DocPage>
  );
}
