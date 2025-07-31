'use client'

const ImpersonationSection = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [impersonationHistory] = useState<ImpersonationRecord[]>(mockImpersonationHistory);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const searchUsers = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        const results = mockUsers.filter(user => 
          user.displayName.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const startImpersonation = () => {
    if (selectedUser) {
      console.log('Starting impersonation for user:', selectedUser);
      setShowConfirmModal(false);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impersonation Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e: any) => searchUsers(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isSearching && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowConfirmModal(true);
                    }}
                  >
                    <Avatar
                      src={user.image}
                      alt={user.displayName}
                      fallback={user.displayName.split(' ').map(n => n[0]).join('')}
                      className="h-8 w-8"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.displayName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {user.type}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.projectCount} projects
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Impersonation History</h4>
          <div className="space-y-3">
            {impersonationHistory.map((record) => (
              <div key={record.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{record.adminUser.displayName}</span>
                    <span className="text-gray-500 text-sm">impersonated</span>
                    <span className="font-medium text-sm">{record.targetUser.displayName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(record.startedAt).toLocaleString()}
                    </span>
                    <span>Duration: {record.duration}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {impersonationHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No impersonation history found.
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={startImpersonation}
        title="Start Impersonation"
        description={`Are you sure you want to impersonate ${selectedUser?.displayName}? This action will be logged for audit purposes.`}
        confirmText="Start Impersonation"
        isDestructive={false}
      />
    </Card>
  );
};

// Main Workspace Settings Component
const WorkspaceSettings = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [currentUser] = useState(mockMembers[1].user); // Current user is admin

  const sections = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'members', label: 'Member Management', icon: Users },
    { id: 'projects', label: 'Project Management', icon: FolderOpen },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity & Audit', icon: Activity },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'impersonation', label: 'Impersonation', icon: UserCheck }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettingsSection />;
      case 'members':
        return <MemberManagementSection />;
      case 'projects':
        return <ProjectManagementSection />;
      case 'security':
        return <SecurityAccessSection />;
      case 'notifications':
        return <NotificationsCommunicationSection />;
      case 'activity':
        return <ActivityAuditSection />;
      case 'data':
        return <DataManagementSection />;
      case 'impersonation':
        return <ImpersonationSection />;
      default:
        return <GeneralSettingsSection />;
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Workspace Settings</h1>
            <p className="text-sm text-gray-600 mt-1">{mockWorkspace.name}</p>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#007A49] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <Avatar
                src={currentUser.image}
                alt={currentUser.displayName}
                fallback={currentUser.displayName.split(' ').map(n => n[0]).join('')}
                className="h-8 w-8"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {currentUser.displayName}
                </div>
                <div className="text-xs text-gray-500">
                  Workspace Admin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
                      import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  FolderOpen, 
  Shield, 
  Bell, 
  Activity, 
  Database,
  UserCheck,
  Save,
  Trash2,
  Edit3,
  Plus,
  Search,
  Upload,
  Crown,
  UserX,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  Palette,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

// TypeScript Interfaces based on schema
interface User {
  id: number;
  uid: string;
  email: string;
  firstname: string;
  lastname: string;
  displayName: string;
  image?: string;
  slug: string;
  type: 'individual' | 'tpo' | 'organization' | 'other' | 'school' | 'superadmin';
  isActive: boolean;
  projectCount: number;
}

interface WorkspaceMember {
  id: number;
  uid: string;
  userId: number;
  user: User;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  joinedAt: string;
  lastActiveAt?: string;
}

interface Workspace {
  id: number;
  uid: string;
  name: string;
  slug: string;
  type: 'platform' | 'private' | 'development' | 'premium';
  description?: string;
  image?: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  isActive: boolean;
}

interface Project {
  id: number;
  uid: string;
  projectName: string;
  slug: string;
  isPublic: boolean;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

interface AuditLogEntry {
  id: number;
  uid: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: number;
  user?: User;
  description?: string;
  occurredAt: string;
  metadata?: any;
}

interface ImpersonationRecord {
  id: number;
  targetUser: User;
  adminUser: User;
  startedAt: string;
  endedAt?: string;
  duration?: string;
}

// Mock Data
const mockWorkspace: Workspace = {
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

const mockMembers: WorkspaceMember[] = [
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
      image: null,
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
      image: null,
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

const mockProjects: Project[] = [
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

const mockAuditLogs: AuditLogEntry[] = [
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

const mockUsers: User[] = [
  ...mockMembers.map(m => m.user),
  {
    id: 3,
    uid: 'user-3',
    email: 'mike.wilson@example.com',
    firstname: 'Mike',
    lastname: 'Wilson',
    displayName: 'Mike Wilson',
    image: null,
    slug: 'mike-wilson',
    type: 'individual',
    isActive: true,
    projectCount: 2
  }
];

const mockImpersonationHistory: ImpersonationRecord[] = [
  {
    id: 1,
    targetUser: mockUsers[2],
    adminUser: mockMembers[1].user,
    startedAt: '2024-07-30T14:00:00Z',
    endedAt: '2024-07-30T14:30:00Z',
    duration: '30 minutes'
  }
];

// Utility Components
const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled = false, type = 'button' }: any) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    primary: 'bg-[#007A49] text-white hover:bg-[#006039]'
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input = ({ className = '', type = 'text', placeholder, value, onChange, ...props }: any) => (
  <input
    type={type}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    {...props}
  />
);

const Textarea = ({ className = '', placeholder, value, onChange, rows = 3, ...props }: any) => (
  <textarea
    className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    {...props}
  />
);

const Select = ({ children, value, onValueChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
          {React.Children.map(children, (child) =>
            React.cloneElement(child, {
              onClick: () => {
                onValueChange(child.props.value);
                setIsOpen(false);
              }
            })
          )}
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ children, value, onClick }: any) => (
  <div
    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
    onClick={onClick}
  >
    {children}
  </div>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants = {
    default: 'bg-gray-100 text-gray-900',
    destructive: 'bg-red-100 text-red-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-yellow-100 text-yellow-900'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Avatar = ({ src, alt, fallback, className = '' }: any) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {src ? (
      <img src={src} alt={alt} className="aspect-square h-full w-full" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-600 text-sm font-medium">
        {fallback}
      </div>
    )}
  </div>
);

const Modal = ({ isOpen, onClose, children, title }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', isDestructive = false }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{description}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant={isDestructive ? 'destructive' : 'primary'} 
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

// Main Component Sections
const GeneralSettingsSection = () => {
  const [workspace, setWorkspace] = useState<Workspace>(mockWorkspace);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!workspace.name.trim()) {
      newErrors.name = 'Workspace name is required';
    }
    
    if (!workspace.slug.trim()) {
      newErrors.slug = 'Workspace slug is required';
    } else if (!/^[a-z0-9-]+$/.test(workspace.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (workspace.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workspace.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setShowSaveModal(true);
    }
  };

  const confirmSave = () => {
    console.log('Saving workspace settings:', workspace);
    setIsEditing(false);
    setShowSaveModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>General Settings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name *
            </label>
            <Input
              value={workspace.name}
              onChange={(e: any) => setWorkspace({ ...workspace, name: e.target.value })}
              disabled={!isEditing}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <Input
              value={workspace.slug}
              onChange={(e: any) => setWorkspace({ ...workspace, slug: e.target.value })}
              disabled={!isEditing}
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            value={workspace.description || ''}
            onChange={(e: any) => setWorkspace({ ...workspace, description: e.target.value })}
            disabled={!isEditing}
            placeholder="Describe your workspace..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <Input
              type="email"
              value={workspace.email || ''}
              onChange={(e: any) => setWorkspace({ ...workspace, email: e.target.value })}
              disabled={!isEditing}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone
            </label>
            <Input
              value={workspace.phone || ''}
              onChange={(e: any) => setWorkspace({ ...workspace, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Website
            </label>
            <Input
              value={workspace.website || ''}
              onChange={(e: any) => setWorkspace({ ...workspace, website: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Type
            </label>
            <Select
              value={workspace.type}
              onValueChange={(value: string) => setWorkspace({ ...workspace, type: value as any })}
              placeholder="Select type"
            >
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Address
          </label>
          <Textarea
            value={workspace.address || ''}
            onChange={(e: any) => setWorkspace({ ...workspace, address: e.target.value })}
            disabled={!isEditing}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="h-4 w-4 inline mr-1" />
              Primary Color
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={workspace.primaryColor || '#007A49'}
                onChange={(e: any) => setWorkspace({ ...workspace, primaryColor: e.target.value })}
                disabled={!isEditing}
                className="w-16 p-1 h-10"
              />
              <Input
                value={workspace.primaryColor || '#007A49'}
                onChange={(e: any) => setWorkspace({ ...workspace, primaryColor: e.target.value })}
                disabled={!isEditing}
                placeholder="#007A49"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={workspace.secondaryColor || '#F5F5F5'}
                onChange={(e: any) => setWorkspace({ ...workspace, secondaryColor: e.target.value })}
                disabled={!isEditing}
                className="w-16 p-1 h-10"
              />
              <Input
                value={workspace.secondaryColor || '#F5F5F5'}
                onChange={(e: any) => setWorkspace({ ...workspace, secondaryColor: e.target.value })}
                disabled={!isEditing}
                placeholder="#F5F5F5"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Changes"
        description="Are you sure you want to save these changes to your workspace settings?"
        confirmText="Save"
      />
    </Card>
  );
};

const MemberManagementSection = () => {
  const [members, setMembers] = useState<WorkspaceMember[]>(mockMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    type: 'remove' | 'suspend' | 'role_change' | null;
    member: WorkspaceMember | null;
    newRole?: string;
  }>({ isOpen: false, type: null, member: null });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const handleInviteMember = () => {
    if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      console.log('Inviting member:', { email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    }
  };

  const handleMemberAction = (action: string, member: WorkspaceMember, newRole?: string) => {
    setShowConfirmModal({
      isOpen: true,
      type: action as any,
      member,
      newRole
    });
  };

  const confirmMemberAction = () => {
    const { type, member, newRole } = showConfirmModal;
    console.log(`${type} action for member:`, member, newRole);
    setShowConfirmModal({ isOpen: false, type: null, member: null });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'success';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'destructive';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Member Management</CardTitle>
          <Button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium text-gray-700">Member</th>
                <th className="text-left p-2 font-medium text-gray-700">Role</th>
                <th className="text-left p-2 font-medium text-gray-700">Status</th>
                <th className="text-left p-2 font-medium text-gray-700">Joined</th>
                <th className="text-left p-2 font-medium text-gray-700">Last Active</th>
                <th className="text-left p-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.user.image}
                        alt={member.user.displayName}
                        fallback={member.user.displayName.split(' ').map(n => n[0]).join('')}
                      />
                      <div>
                        <div className="font-medium">{member.user.displayName}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-2 text-sm text-gray-600">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-sm text-gray-600">
                    {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      {member.role !== 'owner' && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => handleMemberAction('role_change', member, newRole)}
                            placeholder="Role"
                          >
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </Select>
                          {member.status === 'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMemberAction('suspend', member)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMemberAction('activate', member)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMemberAction('remove', member)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite New Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={inviteEmail}
              onChange={(e: any) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <Select
              value={inviteRole}
              onValueChange={setInviteRole}
              placeholder="Select role"
            >
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showConfirmModal.isOpen}
        onClose={() => setShowConfirmModal({ isOpen: false, type: null, member: null })}
        onConfirm={confirmMemberAction}
        title={`${showConfirmModal.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Member`}
        description={`Are you sure you want to ${showConfirmModal.type?.replace('_', ' ')} ${showConfirmModal.member?.user.displayName}?`}
        isDestructive={showConfirmModal.type === 'remove'}
      />
    </Card>
  );
};

const ProjectManagementSection = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'delete' | null;
    project: Project | null;
  }>({ isOpen: false, type: null, project: null });

  const handleProjectAction = (action: string, project: Project) => {
    setShowConfirmModal({
      isOpen: true,
      type: action as any,
      project
    });
  };

  const confirmProjectAction = () => {
    const { type, project } = showConfirmModal;
    console.log(`${type} action for project:`, project);
    setShowConfirmModal({ isOpen: false, type: null, project: null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Projects: {projects.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-700">Project</th>
                  <th className="text-left p-2 font-medium text-gray-700">Visibility</th>
                  <th className="text-left p-2 font-medium text-gray-700">Status</th>
                  <th className="text-left p-2 font-medium text-gray-700">Members</th>
                  <th className="text-left p-2 font-medium text-gray-700">Created</th>
                  <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-gray-500">/{project.slug}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={project.isPublic ? 'success' : 'default'}>
                        {project.isPublic ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant={project.isActive ? 'success' : 'default'}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {project.memberCount} members
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProjectAction('archive', project)}
                        >
                          <Database className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProjectAction('delete', project)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showConfirmModal.isOpen}
        onClose={() => setShowConfirmModal({ isOpen: false, type: null, project: null })}
        onConfirm={confirmProjectAction}
        title={`${showConfirmModal.type?.charAt(0).toUpperCase()}${showConfirmModal.type?.slice(1)} Project`}
        description={`Are you sure you want to ${showConfirmModal.type} "${showConfirmModal.project?.projectName}"?`}
        isDestructive={showConfirmModal.type === 'delete'}
      />
    </Card>
  );
};

const SecurityAccessSection = () => {
  const [settings, setSettings] = useState({
    workspacePrivate: false,
    requireInviteApproval: true,
    allowMemberInvites: false,
    defaultProjectVisibility: 'private',
    sessionTimeout: '24',
    twoFactorRequired: false
  });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    console.log('Saving security settings:', settings);
    setShowSaveModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Private Workspace</h4>
              <p className="text-sm text-gray-600">Make workspace invite-only</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.workspacePrivate}
              onChange={(e) => setSettings({ ...settings, workspacePrivate: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Require Invite Approval</h4>
              <p className="text-sm text-gray-600">Admin approval required for new invites</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.requireInviteApproval}
              onChange={(e) => setSettings({ ...settings, requireInviteApproval: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow Member Invites</h4>
              <p className="text-sm text-gray-600">Let members invite others to workspace</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.allowMemberInvites}
              onChange={(e) => setSettings({ ...settings, allowMemberInvites: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Two-Factor Authentication Required</h4>
              <p className="text-sm text-gray-600">Require 2FA for all workspace members</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.twoFactorRequired}
              onChange={(e) => setSettings({ ...settings, twoFactorRequired: e.target.checked })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Project Visibility
            </label>
            <Select
              value={settings.defaultProjectVisibility}
              onValueChange={(value) => setSettings({ ...settings, defaultProjectVisibility: value })}
            >
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (hours)
            </label>
            <Select
              value={settings.sessionTimeout}
              onValueChange={(value) => setSettings({ ...settings, sessionTimeout: value })}
            >
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="8">8 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="168">1 week</SelectItem>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Security Settings
          </Button>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Security Settings"
        description="Are you sure you want to update these security settings? This may affect all workspace members."
        confirmText="Save"
      />
    </Card>
  );
};

const NotificationsCommunicationSection = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    projectUpdates: true,
    memberActivity: false,
    systemAnnouncements: true,
    weeklyDigest: true,
    instantNotifications: false
  });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    console.log('Saving notification settings:', settings);
    setShowSaveModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications & Communication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Project Updates</h4>
              <p className="text-sm text-gray-600">Get notified about project changes</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.projectUpdates}
              onChange={(e) => setSettings({ ...settings, projectUpdates: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Member Activity</h4>
              <p className="text-sm text-gray-600">Notifications when members join/leave</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.memberActivity}
              onChange={(e) => setSettings({ ...settings, memberActivity: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">System Announcements</h4>
              <p className="text-sm text-gray-600">Important platform updates</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.systemAnnouncements}
              onChange={(e) => setSettings({ ...settings, systemAnnouncements: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Weekly Digest</h4>
              <p className="text-sm text-gray-600">Weekly summary of workspace activity</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.weeklyDigest}
              onChange={(e) => setSettings({ ...settings, weeklyDigest: e.target.checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Instant Notifications</h4>
              <p className="text-sm text-gray-600">Real-time browser notifications</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-[#007A49] focus:ring-[#007A49] border-gray-300 rounded"
              checked={settings.instantNotifications}
              onChange={(e) => setSettings({ ...settings, instantNotifications: e.target.checked })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Notification Settings
          </Button>
        </div>
      </CardContent>

      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={confirmSave}
        title="Save Notification Settings"
        description="Are you sure you want to update these notification preferences?"
        confirmText="Save"
      />
    </Card>
  );
};

const ActivityAuditSection = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    dateRange: '7'
  });

  const refreshLogs = () => {
    console.log('Refreshing audit logs with filters:', filters);
    // In real app, this would fetch new data
  };

  const exportLogs = () => {
    console.log('Exporting audit logs');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity & Audit</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters({ ...filters, action: value })}
              placeholder="Filter by action"
            >
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="invite">Invite</SelectItem>
            </Select>
            <Select
              value={filters.entityType}
              onValueChange={(value) => setFilters({ ...filters, entityType: value })}
              placeholder="Filter by entity"
            >
              <SelectItem value="">All Entities</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="workspace_member">Member</SelectItem>
              <SelectItem value="site">Site</SelectItem>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </Select>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <Activity className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="text-xs">
                      {log.action}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.entityType}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.occurredAt).toLocaleString()}
                    </span>
                    {log.user && (
                      <span>by {log.user.displayName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {auditLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found for the selected filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DataManagementSection = () => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [exportFormat, setExportFormat] = useState('json');

  const handleExport = () => {
    console.log('Exporting data:', { type: exportType, format: exportFormat });
    setShowExportModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Export Data</h4>
            <p className="text-sm text-gray-600">Download workspace data in various formats</p>
            <Button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Workspace Data
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Migration Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Projects</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>  
              <div className="flex items-center justify-between">
                <span className="text-sm">Members</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Images</span>
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Flagged Content Review</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">2 Projects flagged for review</p>
                  <p className="text-xs text-gray-600">Data quality issues detected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">1 User account flagged</p>
                  <p className="text-xs text-gray-600">Suspicious activity detected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Workspace Data">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type
            </label>
            <Select
              value={exportType}
              onValueChange={setExportType}
            >
              <SelectItem value="all">All Data</SelectItem>
              <SelectItem value="projects">Projects Only</SelectItem>
              <SelectItem value="members">Members Only</SelectItem>
              <SelectItem value="audit_logs">Audit Logs</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <Select
              value={exportFormat}
              onValueChange={setExportFormat}
            >
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              Export Data
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};