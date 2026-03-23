'use client';

import { useState } from 'react';
import { Activity, Clock, Download, RefreshCw } from 'lucide-react';
import { mockAuditLogs } from '../mocks';
import type { AuditLogEntry } from '../types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectItem } from './workspace-ui';

export function ActivityAuditSection() {
  const [auditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    dateRange: '7'
  });

  const refreshLogs = () => {
    console.log('Refreshing audit logs with filters:', filters);
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
                    {log.user && <span>by {log.user.displayName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {auditLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">No audit logs found for the selected filters.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
