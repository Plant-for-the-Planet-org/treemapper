import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function ProjectCreationPage() {
  return (
    <DocPage
      title="Creating a Project"
      description="Learn how to create a project in TreeMapper so all restoration activities are organized in one place."
      pageId="project-creation"
    >
      <p>
        A <strong>project</strong> is the core of restoration in TreeMapper. It’s where all your
        restoration effort is organized—interventions, sites, monitoring plots, team members, and
        analytics.
      </p>

      <p>
        You will be asked to create a project if you <strong>sign in</strong> in the mobile app or
        start using the web dashboard. This ensures your work is linked to the right project. You
        can create as many projects as you want.
      </p>

      <PlaceholderImage
        title="Create Project"
        description="Screenshot showing the create project flow"
        aspectRatio="portrait"
      />

      <h2>Project Creation (Required Details)</h2>
      <p>When creating a project, you’ll provide basic details such as:</p>
      <ul>
        <li>
          <strong>Name</strong>: The project name
        </li>
        <li>
          <strong>Project Type</strong>: Select what type of project it is (choose{' '}
          <strong>Personal</strong> if it’s only for personal use)
        </li>
        <li>
          <strong>Location</strong>: Optionally set the project location by selecting it on the map
        </li>
      </ul>

      <PlaceholderImage
        title="Project Details"
        description="Screenshot showing project name, type, and location selection"
        aspectRatio="portrait"
      />

      <h2>After You Create a Project</h2>
      <p>
        Once saved, your project is created and you can start using other features like:
      </p>
      <ul>
        <li>
          <Link href="/docs/tutorials/team-collaboration">Team management</Link> (invite members and
          assign roles)
        </li>
        <li>
          <Link href="/docs/tutorials/site-creation">Sites</Link> (define where restoration happens)
        </li>
        <li>
          <Link href="/docs/tutorials/first-intervention">Interventions</Link> (record restoration
          work)
        </li>
      </ul>

      <h2>Editing Project Details</h2>
      <p>
        Project details can always be edited later from the <strong>Project Edit</strong> section.
      </p>

      <h2>Mobile App vs Web Dashboard</h2>
      <p>
        Projects can be created from both the <strong>mobile app</strong> and the{' '}
        <strong>web dashboard</strong>, with the same options.
      </p>

      <h2>What's Next?</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/site-creation">Create your first site</Link> to define the
          restoration area
        </li>
        <li>
          <Link href="/docs/tutorials/team-collaboration">Add your team</Link> and assign roles
        </li>
      </ul>
    </DocPage>
  );
}

