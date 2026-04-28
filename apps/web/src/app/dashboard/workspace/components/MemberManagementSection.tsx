'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FolderOpen, Globe, Mail, MapPin, Search, User as UserIcon } from 'lucide-react';
import { getWorkspaceMembersApi } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { useUserStore } from '@shared-core/store/useUserStore';
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, Input } from './workspace-ui';

interface UserDetail {
  userUid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  image: string | null;
  slug: string;
  type: string;
  country: string | null;
  isActive: boolean;
  locale: string | null;
  primaryWorkspaceUid: string | null;
  primaryProjectUid: string | null;
  workspaceName: string | null;
  primaryProjectName: string | null;
}

const getUserTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    individual: 'Individual',
    tpo: 'TPO',
    organization: 'Organization',
    school: 'School',
    superadmin: 'Super Admin',
    other: 'Other',
  };
  return map[type] ?? type;
};

function UserRow({ user }: { user: UserDetail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="p-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.image ?? undefined}
              alt={user.displayName}
              fallback={user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              className="h-9 w-9"
            />
            <div>
              <div className="font-medium text-gray-900">{user.displayName}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-gray-600">{getUserTypeLabel(user.type)}</td>
        <td className="p-3">
          <Badge variant={user.isActive ? 'success' : 'destructive'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </td>
        <td className="p-3 text-sm text-gray-600">
          {user.workspaceName ? (
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-gray-400" />
              {user.workspaceName}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
        <td className="p-3 text-sm text-gray-600">
          {user.primaryProjectName ? (
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
              {user.primaryProjectName}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
        <td className="p-3 text-right">
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 ml-auto" /> : <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50 border-b">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-400">Type:</span>
                <span className="text-gray-800">{getUserTypeLabel(user.type)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-800">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-400">Slug:</span>
                <span className="text-gray-800">@{user.slug}</span>
              </div>
              {user.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">Country:</span>
                  <span className="text-gray-800 uppercase">{user.country}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-400">Workspace:</span>
                <span className="text-gray-800">{user.workspaceName ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-400">Primary project:</span>
                <span className="text-gray-800">{user.primaryProjectName ?? '—'}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function MemberManagementSection() {
  const { accessToken } = useToken();
  const currentUser = useUserStore((state) => state.user);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken || !currentUser?.primaryWorkspaceUid) return;
    setIsLoading(true);
    getWorkspaceMembersApi(accessToken, currentUser.primaryWorkspaceUid)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list)) setUsers(list);
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, currentUser?.primaryWorkspaceUid]);

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.slug.toLowerCase().includes(q) ||
          (u.primaryProjectName ?? '').toLowerCase().includes(q)
        );
      })
    : users;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Members</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email…"
              className="pl-8"
            />
          </div>
          <span className="text-sm text-gray-500 shrink-0">{filtered.length} of {users.length}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">{users.length === 0 ? 'No members found.' : 'No results match your search.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Workspace</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Primary Project</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.userUid} user={u} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
