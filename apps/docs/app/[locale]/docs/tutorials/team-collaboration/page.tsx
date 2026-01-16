import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function TeamCollaborationPage() {
  return (
    <DocPage
      title="Team Collaboration"
      description="Learn how to manage your team, assign roles, and collaborate effectively on restoration projects using TreeMapper."
      pageId="team-collaboration"
    >
      <p>
        With the recent update, TreeMapper now supports Role management. Now you can create your
        team for the project with different roles so to better control the project.
      </p>

      <PlaceholderImage
        title="Team Management"
        description="Screenshot showing team management interface"
        aspectRatio="portrait"
      />

      <h2>Role Management</h2>
      <p>
        TreeMapper provides a flexible role-based access control system that allows project owners
        and administrators to manage team members with appropriate permissions. This ensures that
        each team member has the right level of access for their responsibilities.
      </p>

      <h2>Available Roles</h2>
      <p>TreeMapper has the following roles:</p>

      <h3>Owner</h3>
      <p>
        <strong>Highest level.</strong> The one who owns/created the project. They have access to
        every feature without any restriction, including the ability to update the project details.
      </p>
      <ul>
        <li>Full access to all project features</li>
        <li>Can update project details</li>
        <li>Can manage all team members and roles</li>
        <li>Can delete the project</li>
      </ul>

      <PlaceholderImage
        title="Owner Role"
        description="Screenshot showing owner role permissions"
        aspectRatio="portrait"
      />

      <h3>Admin</h3>
      <p>
        <strong>Next to owner</strong> with some limitations. They cannot remove other admins, but
        have the same access as owner for most features.
      </p>
      <ul>
        <li>Full access to project features (same as owner)</li>
        <li>Can manage team members and roles</li>
        <li>Cannot remove other admins</li>
        <li>Cannot delete the project</li>
      </ul>

      <PlaceholderImage
        title="Admin Role"
        description="Screenshot showing admin role permissions"
        aspectRatio="portrait"
      />

      <h3>Contributor</h3>
      <p>
        <strong>This role is the most important</strong> as they have the necessary rights to
        contribute to the project using the TreeMapper app. They don't have permission as
        admin/owner to manage the project.
      </p>
      <ul>
        <li>Can create interventions and monitoring plots</li>
        <li>Can collect data using the mobile app</li>
        <li>Can add plants, measurements, and observations</li>
        <li>Cannot manage team members or project settings</li>
        <li>Cannot delete project data</li>
      </ul>

      <PlaceholderImage
        title="Contributor Role"
        description="Screenshot showing contributor role permissions"
        aspectRatio="portrait"
      />

      <h3>Observer</h3>
      <p>
        They have <strong>read-only access</strong> to the project. They can be anyone (scientist/researcher)
        who needs to access the project to use analysis or validate the project.
      </p>
      <ul>
        <li>Can view all project data</li>
        <li>Can access analytics and reports</li>
        <li>Cannot create or edit data</li>
        <li>Cannot manage team members</li>
        <li>Perfect for researchers and external validators</li>
      </ul>

      <PlaceholderImage
        title="Observer Role"
        description="Screenshot showing observer role permissions"
        aspectRatio="portrait"
      />

      <h2>Managing Team Members</h2>
      <p>
        Role management can be done using the dashboard with the team section. Admin/owner can send
        invitations to others via email or by creating a bulk invite functionality.
      </p>

      <h3>Sending Invitations</h3>
      <p>There are two ways to invite team members:</p>

      <h4>Email Invitation</h4>
      <ol>
        <li>Navigate to the <strong>Team</strong> section in the web dashboard</li>
        <li>Click <strong>"Invite Member"</strong></li>
        <li>Enter the email address of the person you want to invite</li>
        <li>Select the role (Contributor, Observer, or Admin)</li>
        <li>Send the invitation</li>
      </ol>

      <h4>Bulk Invite</h4>
      <p>
        For inviting multiple team members at once, use the bulk invite functionality:
      </p>
      <ol>
        <li>Go to the <strong>Team</strong> section</li>
        <li>Click <strong>"Bulk Invite"</strong></li>
        <li>Upload a CSV file with email addresses and roles, or enter multiple emails</li>
        <li>Select roles for each invitee</li>
        <li>Send all invitations at once</li>
      </ol>

      <PlaceholderImage
        title="Team Invitations"
        description="Screenshot showing email and bulk invite options"
        aspectRatio="portrait"
      />

      <h3>Managing Invitations and Roles</h3>
      <p>
        Admin/owner can delete any invitation or update any existing roles as well.
      </p>

      <p>You can:</p>
      <ul>
        <li><strong>View pending invitations</strong>: See who has been invited but not yet joined</li>
        <li><strong>Resend invitations</strong>: Send reminder emails to pending invitees</li>
        <li><strong>Cancel invitations</strong>: Delete invitations that are no longer needed</li>
        <li><strong>Update roles</strong>: Change a team member's role at any time</li>
        <li><strong>Remove team members</strong>: Remove users from the project (owner/admin only)</li>
      </ul>

      <PlaceholderImage
        title="Managing Team"
        description="Screenshot showing team management options"
        aspectRatio="portrait"
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 my-6">
        <h4 className="mt-0 text-blue-600 dark:text-blue-500">Best Practices</h4>
        <ul className="mb-0">
          <li>Assign the Owner role only to project creators or primary stakeholders</li>
          <li>Use Admin role for project managers who need full management capabilities</li>
          <li>Most field team members should be Contributors</li>
          <li>Use Observer role for external researchers, funders, or validators</li>
          <li>Regularly review team members and remove inactive users</li>
        </ul>
      </div>

      <h2>What's Next?</h2>
      <p>Now that you understand team collaboration, explore these guides:</p>
      <ul>
        <li>
          <Link href="/docs/web-setup">Set up the web dashboard</Link> to access team management
          features
        </li>
        <li>
          <Link href="/docs/tutorials/first-intervention">Learn about creating interventions</Link> -
          Contributors can do this from the mobile app
        </li>
        <li>
          <Link href="/docs/web/overview">Explore web dashboard features</Link> for analytics and
          reporting
        </li>
      </ul>
    </DocPage>
  );
}
