import { DocPage } from '@/components/doc-page';
import { PlaceholderImage } from '@/components/placeholder-image';
import Link from 'next/link';

export default function TeamManagementPage() {
  return (
    <DocPage
      title="Team Management"
      description="Learn how to manage team members and permissions in the TreeMapper web dashboard."
      pageId="team-management"
    >
      <h2>Overview</h2>
      <p>
        The Team Management section allows you to invite collaborators, assign roles, and manage
        access to your restoration project. Effective team management ensures the right people have
        appropriate access to contribute to and view project data.
      </p>

      <h2>Team Member List</h2>
      <p>
        The team page displays all members and pending invitations in a table view:
      </p>

      <PlaceholderImage
        title="Team List"
        description="Screenshot showing the team member list"
      />

      <h3>Member Information</h3>
      <p>For each team member, you can see:</p>
      <ul>
        <li>
          <strong>Avatar</strong>: Profile picture or generated avatar
        </li>
        <li>
          <strong>Name</strong>: Display name of the team member
        </li>
        <li>
          <strong>Email</strong>: Contact email address
        </li>
        <li>
          <strong>Role</strong>: Assigned project role (Owner, Admin, Contributor, Observer)
        </li>
        <li>
          <strong>Last Active</strong>: When they last used the platform (Today, Yesterday, X days
          ago)
        </li>
        <li>
          <strong>Joined Date</strong>: When they joined the project
        </li>
        <li>
          <strong>Status</strong>: Current status (Active, Inactive, Pending)
        </li>
      </ul>

      <h2>Search and Filter</h2>
      <p>Find team members quickly using search and sorting:</p>
      <ul>
        <li>
          <strong>Full-text search</strong>: Search by name or email address
        </li>
        <li>
          <strong>Sortable columns</strong>: Sort by Role, Last Active, Joined Date, or Status
        </li>
        <li>
          <strong>Sort direction</strong>: Toggle ascending/descending order
        </li>
      </ul>

      <h2>Team Roles</h2>
      <p>
        TreeMapper uses role-based access control to manage permissions:
      </p>

      <h3>Owner</h3>
      <p>Full control over the project including:</p>
      <ul>
        <li>All Admin permissions</li>
        <li>Transfer project ownership</li>
        <li>Delete the project</li>
        <li>Manage billing and subscription (if applicable)</li>
      </ul>

      <h3>Admin</h3>
      <p>Project management capabilities:</p>
      <ul>
        <li>Invite and remove team members</li>
        <li>Assign roles to team members</li>
        <li>Create and manage sites</li>
        <li>Configure project settings</li>
        <li>Access all data and reports</li>
        <li>Export data</li>
      </ul>

      <h3>Contributor</h3>
      <p>Data collection and contribution:</p>
      <ul>
        <li>Create interventions and record data</li>
        <li>Add and edit their own entries</li>
        <li>View assigned sites</li>
        <li>Access leaderboard and map</li>
        <li>Limited dashboard analytics</li>
      </ul>

      <h3>Observer</h3>
      <p>Read-only access:</p>
      <ul>
        <li>View project data</li>
        <li>Access leaderboard and map</li>
        <li>Cannot create or modify data</li>
        <li>Useful for stakeholders and reviewers</li>
      </ul>

      <PlaceholderImage
        title="Role Permissions"
        description="Diagram showing role hierarchy and permissions"
      />

      <h2>Inviting Team Members</h2>

      <h3>Single Invitation</h3>
      <p>To invite an individual team member:</p>
      <ol>
        <li>Click the "Invite" button</li>
        <li>Enter the person's email address</li>
        <li>Select their role</li>
        <li>Send the invitation</li>
      </ol>
      <p>
        The invitee receives an email with a link to join your project. They'll need to create a
        TreeMapper account if they don't have one.
      </p>

      <h3>Bulk Invitation</h3>
      <p>To invite multiple people at once:</p>
      <ol>
        <li>Click the bulk invitation option</li>
        <li>Upload a CSV file with email addresses and roles</li>
        <li>Review the list of invitations</li>
        <li>Send all invitations</li>
      </ol>

      <PlaceholderImage
        title="Invitation Modal"
        description="Screenshot showing the invitation modal"
      />

      <h2>Managing Invitations</h2>
      <p>Pending invitations appear in the team list with a "Pending" status:</p>
      <ul>
        <li>
          <strong>Invited by</strong>: Shows who sent the invitation
        </li>
        <li>
          <strong>Invitation date</strong>: When the invitation was sent
        </li>
        <li>
          <strong>Status</strong>: Pending until accepted
        </li>
      </ul>
      <p>
        Once an invitation is accepted, the member's status changes to Active and they can access
        the project according to their assigned role.
      </p>

      <h2>Member Actions</h2>

      <h3>View Details</h3>
      <p>
        Click on a team member to view their full profile including contact information, activity
        history, and contributions.
      </p>

      <h3>Edit Permissions</h3>
      <p>
        Admins and Owners can change a team member's role. This immediately updates their access
        permissions.
      </p>

      <h3>Remove from Project</h3>
      <p>To remove a team member:</p>
      <ol>
        <li>Click the remove option</li>
        <li>Confirm the removal in the dialog</li>
        <li>The member loses access immediately</li>
      </ol>
      <p>
        <strong>Note:</strong> Removing a member doesn't delete their contributions. All
        interventions and data they created remain in the project.
      </p>

      <h2>Data Export</h2>
      <p>Export your team member list for reporting or record-keeping:</p>
      <ul>
        <li>Click the export option</li>
        <li>Download a CSV file with all team member information</li>
        <li>Includes names, emails, roles, status, and dates</li>
      </ul>

      <h2>Best Practices</h2>

      <h3>Role Assignment</h3>
      <ul>
        <li>
          <strong>Principle of least privilege</strong>: Assign the minimum role needed for each
          person's tasks
        </li>
        <li>
          <strong>Limit Admins</strong>: Keep the number of Admins small to maintain control
        </li>
        <li>
          <strong>Use Observer wisely</strong>: Great for stakeholders who need to see progress but
          not modify data
        </li>
      </ul>

      <h3>Team Organization</h3>
      <ul>
        <li>
          <strong>Regular review</strong>: Periodically review team membership and remove inactive
          users
        </li>
        <li>
          <strong>Document roles</strong>: Keep clear records of who has what access and why
        </li>
        <li>
          <strong>Onboarding</strong>: Brief new members on their responsibilities and app usage
        </li>
      </ul>

      <h3>Security</h3>
      <ul>
        <li>
          <strong>Verify emails</strong>: Double-check email addresses before sending invitations
        </li>
        <li>
          <strong>Prompt removal</strong>: Remove members quickly when they leave the project or
          organization
        </li>
        <li>
          <strong>Audit access</strong>: Review who has access when project needs change
        </li>
      </ul>

      <h2>Related Topics</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/team-collaboration">Team Collaboration Tutorial</Link>
        </li>
        <li>
          <Link href="/docs/web/sites-management">Managing Sites</Link>
        </li>
        <li>
          <Link href="/docs/web/reports">Reports & Analytics</Link>
        </li>
      </ul>
    </DocPage>
  );
}
