'use client';

import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Search, UserCheck } from 'lucide-react';
import { getWorkspaceMembers, startImpersonationWork } from '@shared-core/fetchApi/api.fetch';
import { mockImpersonationHistory } from '../mocks';
import type { ImpersonationRecord, User } from '../types';
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, ConfirmationModal, Input } from './workspace-ui';

function impersonationTargetId(user: User): string {
  return user.userUid ?? user.uid;
}

export function ImpersonationSection({ token, goHome }: { token: string; goHome: () => void }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [impersonationHistory] = useState<ImpersonationRecord[]>(mockImpersonationHistory);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [, setError] = useState('');

  useEffect(() => {
    void fetchWorkspaceUsers();
  }, [token]);

  const fetchWorkspaceUsers = async () => {
    setIsLoadingUsers(true);
    setError('');
    try {
      const resp = await getWorkspaceMembers(token);
      if (resp.statusCode === 200) {
        const data = resp.data;
        setWorkspaceUsers(Array.isArray(data) ? data : []);
      } else {
        setError('Not able to fetch users');
      }
    } catch {
      setError('Not able to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const searchUsers = (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    const results = workspaceUsers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const startImpersonation = async () => {
    if (!selectedUser) return;
    setShowConfirmModal(false);
    const target = selectedUser;
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoadingUsers(true);
    try {
      const resp = await startImpersonationWork(token, impersonationTargetId(target));
      if (resp.statusCode === 200) {
        goHome();
      }
    } finally {
      setIsLoadingUsers(false);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoadingUsers && (
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
                      fallback={user.displayName.split(' ').map((n) => n[0]).join('')}
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
                      <div className="text-xs text-gray-500 mt-1">{user.projectCount} projects</div>
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
              <div className="text-center py-8 text-gray-500">No impersonation history found.</div>
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
}
