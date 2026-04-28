import type {
  AuditLogEntry,
  ImpersonationRecord,
  Project,
  User,
  Workspace,
  WorkspaceMember
} from './types';

export const mockWorkspace: Workspace = {
  id: 1,
  uid: 'ws-1',
  name: 'Forest Conservation Initiative',
  slug: 'forest-conservation',
  type: 'premium',
  description: 'Working towards sustainable forest management and conservation',
  image: null,
  primaryColor: '#007A49',
  secondaryColor: '#F5F5F5',
  email: 'contact@forestconservation.org',
  phone: '+1-555-0123',
  website: 'https://forestconservation.org',
  address: '123 Green St, Forest City, FC 12345',
  isActive: true
};

export const mockMembers: WorkspaceMember[] = [
  {
    id: 1,
    uid: 'wm-1',
    userId: 1,
    user: {
      id: 1,
      uid: 'user-1',
      email: 'john.doe@example.com',
      firstname: 'John',
      lastname: 'Doe',
      displayName: 'John Doe',
      image: undefined,
      slug: 'john-doe',
      type: 'individual',
      isActive: true,
      projectCount: 5
    },
    role: 'owner',
    status: 'active',
    joinedAt: '2024-01-15T10:00:00Z',
    lastActiveAt: '2024-07-30T15:30:00Z'
  },
  {
    id: 2,
    uid: 'wm-2',
    userId: 2,
    user: {
      id: 2,
      uid: 'user-2',
      email: 'jane.smith@example.com',
      firstname: 'Jane',
      lastname: 'Smith',
      displayName: 'Jane Smith',
      image: undefined,
      slug: 'jane-smith',
      type: 'tpo',
      isActive: true,
      projectCount: 3
    },
    role: 'admin',
    status: 'active',
    joinedAt: '2024-02-01T09:00:00Z',
    lastActiveAt: '2024-07-31T12:00:00Z'
  }
];

export const mockProjects: Project[] = [
  {
    id: 1,
    uid: 'proj-1',
    projectName: 'Amazon Reforestation',
    slug: 'amazon-reforestation',
    isPublic: true,
    isActive: true,
    memberCount: 12,
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 2,
    uid: 'proj-2',
    projectName: 'Urban Forest Management',
    slug: 'urban-forest',
    isPublic: false,
    isActive: true,
    memberCount: 8,
    createdAt: '2024-04-15T00:00:00Z'
  }
];

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 1,
    uid: 'audit-1',
    action: 'create',
    entityType: 'project',
    entityId: 'proj-1',
    userId: 1,
    user: mockMembers[0].user,
    description: 'Created new project "Amazon Reforestation"',
    occurredAt: '2024-07-31T10:00:00Z'
  },
  {
    id: 2,
    uid: 'audit-2',
    action: 'invite',
    entityType: 'workspace_member',
    entityId: 'wm-3',
    userId: 2,
    user: mockMembers[1].user,
    description: 'Invited new member to workspace',
    occurredAt: '2024-07-31T09:30:00Z'
  }
];

export const mockUsers: User[] = [
  ...mockMembers.map((m) => m.user),
  {
    id: 3,
    uid: 'user-3',
    email: 'mike.wilson@example.com',
    firstname: 'Mike',
    lastname: 'Wilson',
    displayName: 'Mike Wilson',
    image: undefined,
    slug: 'mike-wilson',
    type: 'individual',
    isActive: true,
    projectCount: 2
  }
];

export const mockImpersonationHistory: ImpersonationRecord[] = [
  {
    id: 1,
    targetUser: mockUsers[2],
    adminUser: mockMembers[1].user,
    startedAt: '2024-07-30T14:00:00Z',
    endedAt: '2024-07-30T14:30:00Z',
    duration: '30 minutes'
  }
];
