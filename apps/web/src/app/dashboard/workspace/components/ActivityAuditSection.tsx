'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  ChevronDown,
  Clock,
  Download,
  FolderOpen,
  LogIn,
  MapPin,
  RefreshCw,
  Shield,
  Sprout,
  Trash2,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { getWorkspaceAuditLogs } from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import type { AuditAction, AuditLogsResponse, WorkspaceAuditLog } from '../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Select, SelectItem } from './workspace-ui';

// ─── Config ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  soft_delete: 'Soft Deleted',
  restore: 'Restored',
  login: 'Login',
  logout: 'Logout',
  invite: 'Invited',
  accept_invite: 'Accepted Invite',
  decline_invite: 'Declined Invite',
  role_change: 'Role Changed',
  permission_change: 'Permission Changed',
  export: 'Exported',
  import: 'Imported',
  archive: 'Archived',
  unarchive: 'Restored from archive',
  impersonation: 'Impersonation',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  soft_delete: 'bg-red-100 text-red-700',
  restore: 'bg-teal-100 text-teal-800',
  login: 'bg-gray-100 text-gray-700',
  logout: 'bg-gray-100 text-gray-700',
  invite: 'bg-purple-100 text-purple-800',
  accept_invite: 'bg-purple-100 text-purple-800',
  decline_invite: 'bg-orange-100 text-orange-800',
  role_change: 'bg-amber-100 text-amber-800',
  permission_change: 'bg-amber-100 text-amber-800',
  export: 'bg-indigo-100 text-indigo-800',
  import: 'bg-indigo-100 text-indigo-800',
  archive: 'bg-gray-100 text-gray-700',
  unarchive: 'bg-gray-100 text-gray-700',
  impersonation: 'bg-yellow-100 text-yellow-800',
};

const ENTITY_LABELS: Record<string, string> = {
  user: 'User',
  workspace: 'Workspace',
  workspace_member: 'Member',
  project: 'Project',
  project_member: 'Project Member',
  site: 'Site',
  intervention: 'Intervention',
  tree: 'Tree',
  tree_record: 'Tree Record',
  scientific_species: 'Species',
  project_species: 'Project Species',
  species_request: 'Species Request',
  project_invite: 'Invite',
  bulk_invite: 'Bulk Invite',
  image: 'Image',
  notification: 'Notification',
  migration: 'Migration',
};

function entityIcon(entityType: string) {
  switch (entityType) {
    case 'project': return <FolderOpen className="h-3.5 w-3.5" />;
    case 'site': return <MapPin className="h-3.5 w-3.5" />;
    case 'intervention': return <Sprout className="h-3.5 w-3.5" />;
    case 'workspace_member':
    case 'project_member': return <Users className="h-3.5 w-3.5" />;
    case 'user': return <User className="h-3.5 w-3.5" />;
    case 'role_change':
    case 'permission_change': return <Shield className="h-3.5 w-3.5" />;
    case 'impersonation': return <UserCheck className="h-3.5 w-3.5" />;
    case 'login':
    case 'logout': return <LogIn className="h-3.5 w-3.5" />;
    case 'archive':
    case 'unarchive': return <Archive className="h-3.5 w-3.5" />;
    case 'delete':
    case 'soft_delete': return <Trash2 className="h-3.5 w-3.5" />;
    default: return <Activity className="h-3.5 w-3.5" />;
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function dateRangeToStartDate(days: string): string | undefined {
  if (!days) return undefined;
  const d = parseInt(days, 10);
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

function exportToCsv(logs: WorkspaceAuditLog[]) {
  const headers = ['Date', 'Action', 'Entity', 'Entity UID', 'Changed Fields', 'User', 'Source'];
  const rows = logs.map((l) => [
    new Date(l.occurredAt).toISOString(),
    l.action,
    l.entityType,
    l.entityUid ?? '',
    (l.changedFields ?? []).join('; '),
    l.userDisplayName ?? l.userEmail ?? '',
    l.source ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── User Avatar initials ───────────────────────────────────────────────────

function UserAvatar({ name, image }: { name: string | null; image: string | null }) {
  if (image) {
    return <img src={image} alt={name ?? ''} className="h-7 w-7 rounded-full object-cover" />;
  }
  const initials = (name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007A49]/15 text-[10px] font-semibold text-[#007A49]">
      {initials}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ActivityAuditSection() {
  const { accessToken } = useToken();
  const workspaceUid = useProjectStore((state) => state.selectedWorkspce?.uid);

  const [logs, setLogs] = useState<WorkspaceAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    dateRange: '7',
  });
  // ref so the fetch callback always sees the latest filters without re-creating itself
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchLogs = useCallback(
    async (pageNum: number, append = false) => {
      if (!accessToken || !workspaceUid) return;
      append ? setIsLoadingMore(true) : setIsLoading(true);
      setError(null);

      const f = filtersRef.current;
      const res = await getWorkspaceAuditLogs(accessToken, workspaceUid, {
        page: pageNum,
        limit: PAGE_SIZE,
        action: f.action || undefined,
        entityType: f.entityType || undefined,
        startDate: dateRangeToStartDate(f.dateRange),
      });

      append ? setIsLoadingMore(false) : setIsLoading(false);

      if (!res || res.error) {
        setError('Failed to load audit logs.');
        return;
      }

      const payload: AuditLogsResponse = res.data ?? res;
      setTotal(payload.total);
      setLogs((prev) => (append ? [...prev, ...payload.data] : payload.data));
    },
    [accessToken, workspaceUid],
  );

  // initial load + re-load when filters or the selected workspace change
  useEffect(() => {
    setPage(1);
    setLogs([]);
    fetchLogs(1, false);
  }, [fetchLogs, filters]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next, true);
  };

  const refresh = () => {
    setPage(1);
    fetchLogs(1, false);
  };

  const hasMore = logs.length < total;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity & Audit</CardTitle>
            {!isLoading && (
              <p className="mt-0.5 text-sm text-gray-500">
                {total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(logs)}
              disabled={logs.length === 0}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* ── Filters ──────────────────────────────────────────────── */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Select
            value={filters.action}
            onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}
            placeholder="All actions"
          >
            <SelectItem value="">All actions</SelectItem>
            <SelectItem value="create">Created</SelectItem>
            <SelectItem value="update">Updated</SelectItem>
            <SelectItem value="delete">Deleted</SelectItem>
            <SelectItem value="soft_delete">Soft deleted</SelectItem>
            <SelectItem value="invite">Invited</SelectItem>
            <SelectItem value="accept_invite">Accepted invite</SelectItem>
            <SelectItem value="decline_invite">Declined invite</SelectItem>
            <SelectItem value="role_change">Role changed</SelectItem>
            <SelectItem value="permission_change">Permission changed</SelectItem>
            <SelectItem value="impersonation">Impersonation</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="export">Export</SelectItem>
            <SelectItem value="archive">Archived</SelectItem>
          </Select>

          <Select
            value={filters.entityType}
            onValueChange={(v) => setFilters((f) => ({ ...f, entityType: v }))}
            placeholder="All entities"
          >
            <SelectItem value="">All entities</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="site">Site</SelectItem>
            <SelectItem value="intervention">Intervention</SelectItem>
            <SelectItem value="workspace_member">Member</SelectItem>
            <SelectItem value="project_member">Project member</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="tree">Tree</SelectItem>
            <SelectItem value="project_invite">Invite</SelectItem>
          </Select>

          <Select
            value={filters.dateRange}
            onValueChange={(v) => setFilters((f) => ({ ...f, dateRange: v }))}
          >
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </Select>
        </div>

        {/* ── Log list ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 rounded-lg bg-gray-50 p-3 animate-pulse">
                <div className="mt-0.5 h-7 w-7 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No activity found for the selected filters.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.uid}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
              >
                {/* User avatar */}
                <div className="mt-0.5 flex-shrink-0">
                  <UserAvatar name={log.userDisplayName} image={log.userImage} />
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Action badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {/* Entity badge */}
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
                      {entityIcon(log.entityType)}
                      {ENTITY_LABELS[log.entityType] ?? log.entityType}
                    </span>
                    {/* Entity UID pill */}
                    {log.entityUid && (
                      <span className="font-mono text-[11px] text-gray-400">
                        {log.entityUid}
                      </span>
                    )}
                  </div>

                  {/* Changed fields */}
                  {log.changedFields && log.changedFields.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {log.changedFields.map((f) => (
                        <span
                          key={f}
                          className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span title={new Date(log.occurredAt).toLocaleString()}>
                        {formatRelativeTime(log.occurredAt)}
                      </span>
                    </span>
                    {log.userDisplayName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userDisplayName}
                      </span>
                    )}
                    {log.source && log.source !== 'web' && (
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                        {log.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-3.5 w-3.5" />
                  )}
                  {isLoadingMore
                    ? 'Loading…'
                    : `Load more (${total - logs.length} remaining)`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
