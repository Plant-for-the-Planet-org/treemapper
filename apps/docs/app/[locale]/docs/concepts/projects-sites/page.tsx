import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function ProjectsSitesPage() {
  return (
    <DocPage
      title="Projects vs Sites"
      description="Understand the difference between projects and sites in TreeMapper and how they work together to organize your restoration work."
      pageId="projects-sites"
    >
      <h2>What Is a Project?</h2>
      <p>
        A <strong>project</strong> is the core container for restoration in TreeMapper. It
        represents a restoration initiative or program where all related activities are grouped
        together—interventions, sites, monitoring plots, team members, and analytics.
      </p>

      <p>
        When you sign in to the mobile app or start using the web dashboard, you will be asked to
        create or select a project so that all your restoration efforts are linked to the right
        context. You can create as many projects as you need.
      </p>

      <PlaceholderImage
        title="Project Overview"
        description="Screenshot showing project overview in the web dashboard"
      />

      <h3>Project Details</h3>
      <p>When creating a project, you typically provide:</p>
      <ul>
        <li>
          <strong>Name</strong>: The name of the restoration project
        </li>
        <li>
          <strong>Project Type</strong>: For example, organizational or{' '}
          <strong>personal</strong> (if it’s only for personal use)
        </li>
        <li>
          <strong>Location</strong>: Optional geographic location or region for the project,
          selected on the map
        </li>
      </ul>

      <p>
        Once saved, the project is created and you can start using other features such as team
        management, site creation, interventions, monitoring plots, and analytics. Project details
        can always be edited later from the project edit section.
      </p>

      <p>
        Projects can be created from both the <strong>mobile app</strong> and the{' '}
        <strong>web dashboard</strong> with the same options.
      </p>

      <h2>What Is a Site?</h2>
      <p>
        A <strong>site</strong> is a specific polygon area within a project where tree planting and
        other restoration activities take place. While a project defines the overall initiative,
        sites define the actual geographic areas on the map.
      </p>

      <p>
        A single project can have <strong>many sites</strong>. This allows you to represent
        multiple planting areas, farms, reserves, or landscape units under the same project.
      </p>

      <PlaceholderImage
        title="Sites on Map"
        description="Screenshot showing multiple sites within a single project"
      />

      <h3>Site Details</h3>
      <p>When creating a site, you typically provide:</p>
      <ul>
        <li>
          <strong>Name</strong>: The site name
        </li>
        <li>
          <strong>Site Type</strong>: The type/category of the site
        </li>
        <li>
          <strong>Boundary</strong>: A polygon defining the site area
        </li>
      </ul>

      <h3>Defining Site Boundaries</h3>
      <p>You can define site boundaries in multiple ways:</p>
      <ul>
        <li>
          <strong>Draw Polygon on Map</strong>: Manually draw the boundary over the map to mark the
          site
        </li>
        <li>
          <strong>Upload GeoJSON</strong>: Upload an existing GIS file if you already have an
          accurate site boundary
        </li>
        <li>
          <strong>Trace with Mobile GPS</strong>: In the mobile app, walk along the border of the
          site and trace the boundary using GPS when no accurate GeoJSON is available
        </li>
      </ul>

      <PlaceholderImage
        title="Site Boundary Methods"
        description="Diagram showing drawing, uploading GeoJSON, and tracing with GPS for site boundaries"
      />

      <h2>Access and Permissions</h2>
      <p>
        Projects and sites both play a role in access management, but at different levels of
        granularity.
      </p>

      <h3>Project-Level Access</h3>
      <p>
        At the project level, access is managed via{' '}
        <Link href="/docs/tutorials/team-collaboration">team collaboration and roles</Link>:
      </p>
      <ul>
        <li>
          <strong>Owner</strong> and <strong>Admin</strong>: Full project management, including
          team, sites, and settings
        </li>
        <li>
          <strong>Contributor</strong>: Can contribute data to the project (interventions,
          monitoring, etc.)
        </li>
        <li>
          <strong>Observer</strong>: Read-only access to project data for analysis and validation
        </li>
      </ul>

      <h3>Site-Level Access</h3>
      <p>
        Sites also have access management so you can give limited access to specific sites for
        certain team members. This is useful when:
      </p>
      <ul>
        <li>Different teams work on different areas within the same project</li>
        <li>You want to restrict contributors to only some sites</li>
        <li>External partners are involved in only part of the project area</li>
      </ul>

      <PlaceholderImage
        title="Project and Site Access"
        description="Screenshot showing project-level and site-level access settings"
      />

      <h2>How Projects and Sites Work Together</h2>
      <p>In summary:</p>
      <ul>
        <li>
          A <strong>project</strong> defines the overall restoration initiative (who, why, and
          high-level where)
        </li>
        <li>
          <strong>Sites</strong> define the specific geographic areas (exact where) where
          restoration happens
        </li>
        <li>
          Interventions, monitoring plots, and plant data are associated with sites and projects
        </li>
        <li>
          Analytics and reporting aggregate data across sites within a project
        </li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Quick Comparison</h4>
        <ul className="mb-0">
          <li>
            <strong>Project</strong>: Who is involved, what the initiative is, and overall scope
          </li>
          <li>
            <strong>Site</strong>: Where exactly restoration takes place on the map
          </li>
          <li>
            One project → many sites; each site belongs to a single project
          </li>
          <li>
            Project-level roles manage overall access; site-level access refines who can work where
          </li>
        </ul>
      </div>

      <h2>What's Next?</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/project-creation">Create your first project</Link> to start a
          new restoration initiative
        </li>
        <li>
          <Link href="/docs/tutorials/site-creation">Create sites</Link> within your project to
          define restoration areas
        </li>
        <li>
          <Link href="/docs/concepts/plots">Learn about plots & plot groups</Link> for detailed
          long-term monitoring inside sites
        </li>
      </ul>
    </DocPage>
  );
}

