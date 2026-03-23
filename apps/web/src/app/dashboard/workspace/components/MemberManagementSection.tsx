'use client';

import { useState } from 'react';
import { Crown, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { mockMembers } from '../mocks';
import type { WorkspaceMember } from '../types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmationModal,
  Input,
  Modal,
  Select,
  SelectItem
} from './workspace-ui';

export function MemberManagementSection() {
  const [members] = useState<WorkspaceMember[]>(mockMembers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    type: 'remove' | 'suspend' | 'role_change' | 'activate' | null;
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

  const handleMemberAction = (
    action: 'remove' | 'suspend' | 'role_change' | 'activate',
    member: WorkspaceMember,
    newRole?: string
  ) => {
    setShowConfirmModal({
      isOpen: true,
      type: action,
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
      case 'owner':
        return 'success' as const;
      case 'admin':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success' as const;
      case 'suspended':
        return 'destructive' as const;
      case 'pending':
        return 'warning' as const;
      default:
        return 'default' as const;
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
                        fallback={member.user.displayName.split(' ').map((n) => n[0]).join('')}
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
                  <td className="p-2 text-sm text-gray-600">{new Date(member.joinedAt).toLocaleDateString()}</td>
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
                            <Button variant="ghost" size="sm" onClick={() => handleMemberAction('suspend', member)}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleMemberAction('activate', member)}>
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleMemberAction('remove', member)}>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <Input
              type="email"
              placeholder="member@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Select value={inviteRole} onValueChange={setInviteRole} placeholder="Select role">
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>Send Invite</Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showConfirmModal.isOpen}
        onClose={() => setShowConfirmModal({ isOpen: false, type: null, member: null })}
        onConfirm={confirmMemberAction}
        title={`${showConfirmModal.type?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Member`}
        description={`Are you sure you want to ${showConfirmModal.type?.replace('_', ' ')} ${showConfirmModal.member?.user.displayName}?`}
        isDestructive={showConfirmModal.type === 'remove'}
      />
    </Card>
  );
}
