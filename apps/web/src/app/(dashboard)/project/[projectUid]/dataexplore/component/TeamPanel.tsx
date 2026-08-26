'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Users } from 'lucide-react'
import { getTeamMemebers } from '@shared-core/fetchApi/api.fetch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState, SectionCard, StatCard } from './primitives'
import { ChartToolbar } from './ChartToolbar'
import { downloadCsv } from '@/utils/spreadsheet'
import type { ApiResponse } from '../lib/api'
import { formatNumber, safeFileName } from '../lib/format'

interface Member {
  role?: string
  joinedAt?: string
  invitedAt?: string
  lastActiveAt?: string
  siteAccess?: string
  user?: { name?: string; email?: string }
}

// Pixel height, not "100%" -- see the recharts note in CLAUDE.md.
const CHART_HEIGHT = 220

const asDate = (value?: string) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export function TeamPanel({
  token,
  projectUid,
  projectName,
}: {
  token: string
  projectUid: string
  projectName: string
}) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!token || !projectUid) return
    let cancelled = false

    setLoading(true)
    getTeamMemebers(token, projectUid)
      .then((res: ApiResponse<{ members: Member[] }>) => {
        if (!cancelled && res?.statusCode === 200) setMembers(res.data?.members ?? [])
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, projectUid])

  const byRole = useMemo(() => {
    const counts: Record<string, number> = {}
    members.forEach((member) => {
      const role = member.role ?? 'member'
      counts[role] = (counts[role] ?? 0) + 1
    })
    return Object.entries(counts).map(([role, count]) => ({ role, count }))
  }, [members])

  const exportRows = useMemo(
    () =>
      members.map((member) => ({
        name: member.user?.name ?? '',
        email: member.user?.email ?? '',
        role: member.role ?? 'member',
        site_access: member.siteAccess ?? '',
        joined_at: asDate(member.joinedAt),
        invited_at: asDate(member.invitedAt),
        last_active_at: asDate(member.lastActiveAt),
      })),
    [members],
  )

  const fileBase = `${safeFileName(projectName)}__Team`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Members" value={formatNumber(members.length)} icon={Users} loading={loading} />
        <StatCard title="Roles" value={byRole.length} icon={Users} loading={loading} />
      </div>

      <SectionCard
        title="Members by Role"
        controls={<ChartToolbar containerRef={chartRef} filename={`${fileBase}__by-role`} rows={byRole} />}
      >
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : byRole.length === 0 ? (
          <EmptyState message="No team members yet" />
        ) : (
          <div ref={chartRef} className="w-full">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={byRole} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="role" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: 'var(--muted)' }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Members" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Team List"
        controls={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={members.length === 0}
            onClick={() => downloadCsv(exportRows, fileBase)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
        contentClassName="px-0"
      >
        {loading ? (
          <Skeleton className="h-52 w-full mx-6" />
        ) : members.length === 0 ? (
          <EmptyState message="No team members yet" />
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Name</TableHead>
                  <TableHead className="px-6">Email</TableHead>
                  <TableHead className="px-6">Role</TableHead>
                  <TableHead className="px-6">Joined</TableHead>
                  <TableHead className="px-6">Last active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member, index) => (
                  <TableRow key={member.user?.email ?? index}>
                    <TableCell className="px-6">{member.user?.name ?? 'Unknown'}</TableCell>
                    <TableCell className="px-6 text-muted-foreground">{member.user?.email ?? '-'}</TableCell>
                    <TableCell className="px-6">
                      <Badge variant="secondary" className="text-xs capitalize font-normal">
                        {member.role ?? 'member'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 text-muted-foreground">{asDate(member.joinedAt) || '-'}</TableCell>
                    <TableCell className="px-6 text-muted-foreground">
                      {asDate(member.lastActiveAt) || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
