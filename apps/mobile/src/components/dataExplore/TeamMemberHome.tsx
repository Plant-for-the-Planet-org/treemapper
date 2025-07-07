import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { FlashList } from '@shopify/flash-list';
// import avatar from 'animal-avatar-generator'; // Uncomment when available

// Types
interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  role: string;
  lastActive: string | null;
  joinedDate: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  invitedBy: string | null;
  type: 'member' | 'invitation';
  avatar?: string;
  token?: string;
}

interface SortConfig {
  key: keyof User;
  direction: 'asc' | 'desc';
}

interface TeamHomeProps {
  users?: User[];
  loading?: boolean;
  onRefresh?: () => void;
}

// Dummy data for demonstration
const dummyUsers: User[] = [
  {
    uid: 'user1',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    role: 'Admin',
    lastActive: '2025-01-06T10:30:00Z',
    joinedDate: '2024-12-01T08:00:00Z',
    status: 'Active',
    invitedBy: null,
    type: 'member',
  },
  {
    uid: 'user2',
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane.smith@example.com',
    role: 'Manager',
    lastActive: '2025-01-05T15:45:00Z',
    joinedDate: '2024-11-15T09:00:00Z',
    status: 'Active',
    invitedBy: null,
    type: 'member',
  },
  {
    uid: 'user3',
    name: 'Bob Wilson',
    username: 'bobwilson',
    email: 'bob.wilson@example.com',
    role: 'Contributor',
    lastActive: null,
    joinedDate: '2024-12-20T14:00:00Z',
    status: 'Inactive',
    invitedBy: null,
    type: 'member',
  },
  {
    uid: 'user4',
    name: 'sarah.jones',
    username: 'sarah.jones',
    email: 'sarah.jones@example.com',
    role: 'Contributor',
    lastActive: null,
    joinedDate: '2025-01-05T12:00:00Z',
    status: 'Pending',
    invitedBy: 'John Doe',
    type: 'invitation',
  },
];

// Utility Functions
const transformData = (data: any) => {
  // Your existing transformation logic
  const members = data.members.map((member: any) => ({
    uid: member.user.uid,
    name: member.user.name || member.user.authName,
    username: member.user.name || member.user.authName,
    email: member.user.email,
    role: capitalize(member.role),
    lastActive: member.user.isActive ? member.joinedAt : null,
    joinedDate: member.joinedAt,
    status: member.user.isActive ? 'Active' : 'Inactive',
    invitedBy: null,
    type: 'member',
    avatar: member.user.avatar,
  }));

  const invitations = data.invitations.map((invite: any) => ({
    uid: invite.uid,
    name: invite.email.split('@')[0],
    username: invite.email.split('@')[0],
    email: invite.email,
    role: capitalize(invite.role),
    lastActive: null,
    joinedDate: invite.createdAt,
    status: capitalize(invite.status),
    invitedBy: invite.invitedBy?.displayName || invite.invitedBy?.name || 'Unknown',
    type: 'invitation',
    token: invite.token,
  }));

  return [...members, ...invitations];
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Avatar Component
const UserAvatar: React.FC<{ user: User; size?: number }> = ({ user, size = 40 }) => {
  // For now, using a placeholder. Implement animal-avatar-generator here
  // const avatarSvg = avatar(user.uid, { size });

  const fallbackAvatar = `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#E5E7EB"/>
    <path d="M20 20C22.7614 20 25 17.7614 25 15C25 12.2386 22.7614 10 20 10C17.2386 10 15 12.2386 15 15C15 17.7614 17.2386 20 20 20Z" fill="#9CA3AF"/>
    <path d="M20 22C15.5817 22 12 25.5817 12 30V32H28V30C28 25.5817 24.4183 22 20 22Z" fill="#9CA3AF"/>
  </svg>`;

  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <SvgXml xml={fallbackAvatar} width={size} height={size} />
    </View>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Active':
        return { backgroundColor: '#DCFCE7', color: '#166534' }; // green
      case 'Suspended':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' }; // red
      case 'Pending':
        return { backgroundColor: '#FEF3C7', color: '#D97706' }; // yellow
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' }; // gray
    }
  };

  const colors = getStatusColor();

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.statusText, { color: colors.color }]}>{status}</Text>
    </View>
  );
};

// User Card Component
const UserCard: React.FC<{ user: User; onViewUser: (user: User) => void }> = ({ user, onViewUser }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <TouchableOpacity style={styles.userCard} onPress={() => onViewUser(user)} activeOpacity={0.7}>
      {/* Header with Avatar and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.cardUserInfo}>
          <UserAvatar user={user} size={48} />
          <View style={styles.cardUserDetails}>
            <Text style={styles.cardUserName} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.cardUserEmail} numberOfLines={1}>{user.email}</Text>
            <Text style={styles.cardUserRole}>{user.role}</Text>
          </View>
        </View>

        <View style={styles.cardHeaderRight}>
          <StatusBadge status={user.status} />
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={() => onViewUser(user)}
          >
            <Ionicons name="eye-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <View style={styles.cardDetailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.cardDetailLabel}>Last Active</Text>
          </View>
          <Text style={styles.cardDetailValue}>{getTimeSince(user.lastActive)}</Text>
        </View>

        <View style={styles.cardDetailRow}>
          <View style={styles.cardDetailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.cardDetailLabel}>Joined</Text>
          </View>
          <Text style={styles.cardDetailValue}>
            {user.status === 'Pending' ? 'Pending invitation' : formatDate(user.joinedDate)}
          </Text>
        </View>

        {user.invitedBy && (
          <View style={styles.cardDetailRow}>
            <View style={styles.cardDetailItem}>
              <Ionicons name="person-outline" size={14} color="#6B7280" />
              <Text style={styles.cardDetailLabel}>Invited by</Text>
            </View>
            <Text style={styles.cardDetailValue}>{user.invitedBy}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Placeholder Modal Components
const InviteUserModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Invite User</Text>
        <Text style={styles.modalText}>Invite user modal will be implemented here</Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const UserDetailsModal: React.FC<{ visible: boolean; onClose: () => void; user: User | null }> = ({ visible, onClose, user }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>User Details</Text>
        <Text style={styles.modalText}>User details for {user?.name} will be shown here</Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const BulkInvitationModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Bulk Invitation</Text>
        <Text style={styles.modalText}>Bulk invitation modal will be implemented here</Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Main TeamHome Component
const TeamHome: React.FC<TeamHomeProps> = ({ users = dummyUsers, loading = false, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'joinedDate',
    direction: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [users, searchTerm, sortConfig]);

  const handleSort = (key: keyof User) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportUsers = () => {
    Alert.alert('Export Users', 'Export functionality will be implemented here');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const renderSortIcon = (key: keyof User) => {
    if (sortConfig.key !== key) return null;
    return (
      <Ionicons
        name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={16}
        color="#6B7280"
        style={styles.sortIcon}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007A49" />
        <Text style={styles.loadingText}>Loading team members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}



      <FlashList
        data={filteredAndSortedUsers}
        renderItem={({ item }) => (<UserCard key={item.uid} user={item} onViewUser={handleViewUser} />)}
        keyExtractor={(item) => item.uid}
        estimatedItemSize={280}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={styles.footer} />}
        ListEmptyComponent={<View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptyText}>No users match your search criteria.</Text>
        </View>}
        ListHeaderComponent={<>
          <View style={styles.header}>
            {/* <Text style={styles.title}>Team Members</Text> */}

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, styles.inviteLinkButton]}
                onPress={() => setShowBulkModal(true)}
              >
                <Ionicons name="link-outline" size={18} color="#3B82F6" />
                <Text style={[styles.buttonText, { color: '#3B82F6' }]}>Invite Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerButton, styles.inviteUserButton]}
                onPress={() => setShowInviteModal(true)}
              >
                <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Invite User</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.controlsTop}>
              <View style={styles.controlsLeft}>
                <Text style={styles.totalText}>Total Users: {users.length}</Text>
                <TouchableOpacity onPress={handleExportUsers} style={styles.exportButton}>
                  <Ionicons name="download-outline" size={16} color="#6B7280" />
                  <Text style={styles.exportText}>Export All</Text>
                </TouchableOpacity>
              </View>

              {/* <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View> */}
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'role', label: 'Role' },
                  { key: 'lastActive', label: 'Last Active' },
                  { key: 'joinedDate', label: 'Joined Date' },
                  { key: 'status', label: 'Status' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      sortConfig.key === option.key && styles.sortOptionActive
                    ]}
                    onPress={() => handleSort(option.key as keyof User)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      sortConfig.key === option.key && styles.sortOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                    {sortConfig.key === option.key && (
                      <Ionicons
                        name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                ))}


              </ScrollView>
            </View>
          </View></>}
      />
      {/* Modals */}
      <InviteUserModal visible={showInviteModal} onClose={() => setShowInviteModal(false)} />
      <UserDetailsModal visible={showUserModal} onClose={() => setShowUserModal(false)} user={selectedUser} />
      <BulkInvitationModal visible={showBulkModal} onClose={() => setShowBulkModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginVertical: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  inviteLinkButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  inviteUserButton: {
    backgroundColor: '#007A49',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  controls: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  controlsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footer: {
    height: 200,
    width: '100%',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    width: 280,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 4,
  },
  sortOptionActive: {
    backgroundColor: '#007A49',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
  cardsContainer: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    borderRadius: 24,
    marginRight: 12,
  },
  cardUserDetails: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardUserEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardUserRole: {
    fontSize: 12,
    color: '#007A49',
    fontWeight: '500',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  cardDetails: {
    gap: 8,
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardDetailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#007A49',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TeamHome;