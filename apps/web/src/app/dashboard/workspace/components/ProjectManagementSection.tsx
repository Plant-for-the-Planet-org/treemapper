'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Flag,
  FolderTree,
  Globe,
  Inbox,
  LogIn,
  Mail,
  MapPin,
  Search,
  Settings,
  Target,
  Trees,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { getAllWorkspacesApi, getWorkspaceProjectsApi, startImpersonationWork, transferProjectApi, updateProjectStatusApi } from '@shared-core/fetchApi/api.fetch';
import { sanitizeAvatarUrl } from '@shared-core/utils/avatarUrl';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import type { Project, Site } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProjectSettingsModal from './ProjectSettingsModal';

/* ─── status tones ───────────────────────────────────────────────────────────
 * shadcn Badge has no success/warning variants, so we map each domain status to
 * a tone and render the color via className on an outline Badge. */

type Tone = 'success' | 'warning' | 'neutral' | 'destructive';

const TONE_CLASS: Record<Tone, string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  destructive: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
};

const siteStatusTone: Record<string, Tone> = {
  planted: 'success',
  planting: 'success',
  planning: 'neutral',
  reforestation: 'warning',
  barren: 'destructive',
};

const projectStatusTone: Record<string, Tone> = {
  active: 'success',
  in_review: 'warning',
  suspended: 'destructive',
  disabled: 'neutral',
};

const reviewStatusTone: Record<string, Tone> = {
  approved: 'success',
  in_review: 'warning',
  pending: 'neutral',
  rejected: 'destructive',
};

function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn('capitalize', TONE_CLASS[tone])}>
      {children}
    </Badge>
  );
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

/* ─── SitesTable (shared by the modal and the inline row expansion) ──────────── */

function SitesTable({ sites, compact = false }: { sites: Site[]; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Site</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Area</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Trees</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Review</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Planting</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site) => (
            <TableRow key={site.uid}>
              <TableCell className="max-w-[220px]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{site.name}</div>
                    {!compact && site.description && (
                      <div className="truncate text-xs text-muted-foreground">{site.description}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {site.status ? (
                  <StatusBadge tone={siteStatusTone[site.status] ?? 'neutral'}>{titleCase(site.status)}</StatusBadge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {site.area != null ? `${site.area.toLocaleString()} ha` : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {site.expectedTreeCount != null ? site.expectedTreeCount.toLocaleString() : '—'}
              </TableCell>
              <TableCell>
                {site.reviewStatus ? (
                  <StatusBadge tone={reviewStatusTone[site.reviewStatus] ?? 'neutral'}>
                    {titleCase(site.reviewStatus)}
                  </StatusBadge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {site.actualPlantingDate
                  ? new Date(site.actualPlantingDate).toLocaleDateString()
                  : site.plannedPlantingDate
                    ? `Planned: ${new Date(site.plannedPlantingDate).toLocaleDateString()}`
                    : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
      <div className="flex-shrink-0 rounded-lg border bg-background p-2 shadow-xs">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

/* ─── PROJECT_STATUSES ──────────────────────────────────────────────────────── */

const PROJECT_STATUSES: { value: 'active' | 'in_review' | 'suspended' | 'disabled'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'in_review', label: 'In Review' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'disabled', label: 'Disabled' },
];

type WorkspaceOption = { uid: string; name: string; slug: string; type: string };

/* ─── email templates ────────────────────────────────────────────────────────── */

const EMAIL_TEMPLATES = [
  {
    id: 'request-documents',
    label: 'Request more documents',
    subject: (projectName: string) => `Additional Documents Required – ${projectName}`,
    body: (ownerName: string, projectName: string) =>
      `Dear ${ownerName},\n\nThank you for submitting your project "${projectName}" to Plant-for-the-Planet.\n\nAfter reviewing your submission, we require additional documents to proceed. Please provide the necessary documentation at your earliest convenience.\n\nIf you have any questions, feel free to reach out.\n\nBest regards,\nPlant-for-the-Planet Team`,
  },
  {
    id: 'approved-platform',
    label: 'Approved to be displayed on platform',
    subject: (projectName: string) => `Congratulations! Your Project Is Approved – ${projectName}`,
    body: (ownerName: string, projectName: string) =>
      `Dear ${ownerName},\n\nWe are pleased to inform you that your project "${projectName}" has been reviewed and approved to be displayed on the Plant-for-the-Planet platform.\n\nYour project will now be visible to our global community.\n\nThank you for your dedication to reforestation.\n\nBest regards,\nPlant-for-the-Planet Team`,
  },
];

/* ─── CSV export ─────────────────────────────────────────────────────────────── */

function csvCell(value: string | number) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportProjectsToCsv(projects: Project[], workspaceName: string) {
  const headers = ['Name', 'Slug', 'Status', 'Visibility', 'Members', 'Sites', 'Country', 'Created'];
  const rows = projects.map((p) => [
    p.name,
    p.slug,
    titleCase(p.status),
    p.isPublic ? 'Public' : 'Private',
    p.memberCount,
    p.siteCount,
    p.country ?? '',
    new Date(p.createdAt).toISOString().slice(0, 10),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspaceName || 'workspace'}-projects.csv`.replace(/\s+/g, '-').toLowerCase();
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── ContactOwnerModal ─────────────────────────────────────────────────────── */

function ContactOwnerModal({
  open,
  onClose,
  ownerEmail,
  ownerName,
  projectName,
}: {
  open: boolean;
  onClose: () => void;
  ownerEmail: string;
  ownerName: string;
  projectName: string;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const handleLoadTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSubject(tpl.subject(projectName));
    setBody(tpl.body(ownerName, projectName));
  };

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSubject('');
      setBody('');
      setSent(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex w-[min(90vw,38rem)] max-w-none flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 border-b px-6 py-5">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <DialogTitle className="text-base font-semibold">Contact Owner</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 px-6 py-5">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Load Template</p>
            <Select onValueChange={handleLoadTemplate}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">To</p>
            <Input value={ownerEmail} readOnly className="h-9 cursor-default bg-muted text-sm text-muted-foreground" />
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Subject</p>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="h-9 text-sm"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Message</p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[160px] resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSend} disabled={!subject.trim() || !body.trim() || sent} className="min-w-[80px] gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {sent ? 'Sent!' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── ProjectDetailModal ────────────────────────────────────────────────────── */

function ProjectDetailModal({
  project,
  workspaceUid,
  onClose,
  onStatusUpdated,
  onTransferred,
  onOpenSettings,
}: {
  project: Project;
  workspaceUid: string;
  onClose: () => void;
  onStatusUpdated: (projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled') => void;
  onTransferred: (projectUid: string) => void;
  onOpenSettings: (project: Project) => void;
}) {
  const { accessToken } = useToken();
  const [pendingStatus, setPendingStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [targetWorkspaceUid, setTargetWorkspaceUid] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [contactOwnerOpen, setContactOwnerOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getAllWorkspacesApi(accessToken).then((res) => {
      if (Array.isArray(res?.data)) {
        setWorkspaces(res.data.filter((w: WorkspaceOption) => w.uid !== workspaceUid));
      }
    });
  }, [accessToken, workspaceUid]);

  const handleTransfer = async () => {
    if (!targetWorkspaceUid) return;
    setTransferring(true);
    setTransferError(null);
    const res = await transferProjectApi(accessToken, workspaceUid, project.uid, targetWorkspaceUid);
    setTransferring(false);
    if (res?.error || !res?.data?.success) {
      setTransferError('Transfer failed');
      return;
    }
    onTransferred(project.uid);
    onClose();
  };

  const isDirty = pendingStatus !== project.status;

  const handleSaveStatus = async () => {
    setSaving(true);
    setSaveError(null);
    const res = await updateProjectStatusApi(accessToken, workspaceUid, project.uid, pendingStatus);
    setSaving(false);
    if (res?.error || !res?.data) {
      setSaveError('Failed to update status');
      return;
    }
    onStatusUpdated(project.uid, pendingStatus);
  };

  const handleImpersonateOwner = async () => {
    if (!project.owner) return;
    setImpersonating(true);
    try {
      const resp = await startImpersonationWork(accessToken, project.owner.uid);
      if (resp?.statusCode === 200) {
        window.location.replace('/');
        window.location.reload();
      }
    } finally {
      setImpersonating(false);
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[90vh] w-[80vw] max-w-[80vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[80vw]"
    >
      {/* Header */}
      <DialogHeader className="flex-shrink-0 border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4 pr-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-xl font-semibold">{project.name}</DialogTitle>
              <StatusBadge tone={project.isPublic ? 'success' : 'neutral'}>
                {project.isPublic ? <><Eye className="h-3 w-3" />Public</> : <><EyeOff className="h-3 w-3" />Private</>}
              </StatusBadge>
              <StatusBadge tone={projectStatusTone[project.status] ?? 'neutral'}>{titleCase(project.status)}</StatusBadge>
              {project.flag && (
                <Badge variant="outline" className={TONE_CLASS.destructive}>
                  <Flag className="h-3 w-3" />Flagged
                </Badge>
              )}
              {project.approvalBoardEnabled && <Badge variant="outline">Approval Board</Badge>}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">/{project.slug}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogHeader>

      {/* Body */}
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {(project.description || project.purpose) && (
          <div className="space-y-1.5 rounded-xl border bg-muted/30 px-4 py-3">
            {project.description && <p className="text-sm text-foreground">{project.description}</p>}
            {project.purpose && <p className="text-xs italic text-muted-foreground">{project.purpose}</p>}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4 text-blue-500" />} label="Members" value={project.memberCount} />
          <StatCard icon={<MapPin className="h-4 w-4 text-green-500" />} label="Sites" value={project.siteCount} />
          {project.target != null && (
            <StatCard icon={<Target className="h-4 w-4 text-orange-500" />} label="Target trees" value={project.target.toLocaleString()} />
          )}
          <StatCard icon={<Calendar className="h-4 w-4 text-purple-500" />} label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
        </div>

        {/* Owner */}
        {project.owner && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage src={sanitizeAvatarUrl(project.owner.image) || undefined} alt={project.owner.displayName} />
              <AvatarFallback>
                <UserCircle className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Project Owner</div>
              <div className="text-sm font-semibold text-foreground">{project.owner.displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{project.owner.email}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setContactOwnerOpen(true)} className="flex-shrink-0 gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              Contact Owner
            </Button>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
          {project.country && (
            <span>
              <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Country</span>
              {project.country}
            </span>
          )}
          {project.ecosystem && (
            <span>
              <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ecosystem</span>
              {project.ecosystem}
            </span>
          )}
          {project.type && (
            <span>
              <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</span>
              {project.type}
            </span>
          )}
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#007A49] hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>

        {/* Sites */}
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Trees className="h-4 w-4 text-green-600" />
            Sites
            <span className="font-normal text-muted-foreground">({project.siteCount})</span>
          </h3>

          {project.sites.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              No sites in this project.
            </div>
          ) : (
            <SitesTable sites={project.sites} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t bg-muted/30">
        {/* Zone 1: Status */}
        <div className="px-6 py-4">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Project Status</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPendingStatus(value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    pendingStatus === value
                      ? 'border-transparent bg-foreground text-background shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {saveError && <span className="text-xs text-destructive">{saveError}</span>}
              <Button size="sm" onClick={handleSaveStatus} disabled={!isDirty || saving}>
                {saving ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="opacity-60" />

        {/* Zone 2: Transfer */}
        <div className="px-6 py-4">
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <ArrowRightLeft className="h-3 w-3" />
            Transfer Project
          </p>
          <div className="flex items-center gap-3">
            <Select value={targetWorkspaceUid} onValueChange={setTargetWorkspaceUid}>
              <SelectTrigger className="h-9 flex-1 bg-background text-sm">
                <SelectValue placeholder="Select destination workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.uid} value={w.uid}>
                    {w.name}
                    <span className="ml-1 text-muted-foreground">({w.slug})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {transferError && <span className="shrink-0 text-xs text-destructive">{transferError}</span>}
            <Button variant="outline" size="sm" onClick={handleTransfer} disabled={!targetWorkspaceUid || transferring} className="shrink-0">
              {transferring ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </div>

        <Separator className="opacity-60" />

        {/* Zone 3: Primary actions */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenSettings(project)} className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Manage Settings
            </Button>
            {project.owner && (
              <Button variant="outline" size="sm" onClick={handleImpersonateOwner} disabled={impersonating} className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                {impersonating ? 'Opening...' : 'View as Owner'}
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {project.owner && (
        <ContactOwnerModal
          open={contactOwnerOpen}
          onClose={() => setContactOwnerOpen(false)}
          ownerEmail={project.owner.email}
          ownerName={project.owner.displayName}
          projectName={project.name}
        />
      )}
    </DialogContent>
  );
}

/* ─── ProjectRow ────────────────────────────────────────────────────────────── */

function ProjectRow({ project, onView, onOpenSettings }: { project: Project; onView: (project: Project) => void; onOpenSettings: (project: Project) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasSites = project.sites.length > 0;

  return (
    <>
      <TableRow className="group">
        <TableCell className="w-[240px] max-w-[240px]">
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-2 text-left disabled:cursor-default"
            onClick={() => hasSites && setExpanded((v) => !v)}
            disabled={!hasSites}
            aria-expanded={hasSites ? expanded : undefined}
          >
            {hasSites ? (
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors group-hover:bg-muted">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">/{project.slug}</div>
            </div>
          </button>
        </TableCell>
        <TableCell>
          <StatusBadge tone={project.isPublic ? 'success' : 'neutral'}>
            {project.isPublic ? <><Eye className="h-3 w-3" />Public</> : <><EyeOff className="h-3 w-3" />Private</>}
          </StatusBadge>
        </TableCell>
        <TableCell>
          <StatusBadge tone={projectStatusTone[project.status] ?? 'neutral'}>{titleCase(project.status)}</StatusBadge>
        </TableCell>
        <TableCell className="text-muted-foreground">{project.memberCount}</TableCell>
        <TableCell className="text-muted-foreground">{project.siteCount}</TableCell>
        <TableCell className="text-muted-foreground">{project.country ?? '—'}</TableCell>
        <TableCell className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(project)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenSettings(project)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open project settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>

      {expanded && hasSites && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="bg-muted/30 p-3">
            <SitesTable sites={project.sites} compact />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/* ─── ProjectManagementSection ──────────────────────────────────────────────── */

const STATUS_FILTERS: { value: 'all' | 'active' | 'in_review' | 'suspended' | 'disabled'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'in_review', label: 'In Review' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'disabled', label: 'Disabled' },
];

export function ProjectManagementSection() {
  const { accessToken } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedWorkspce: selectedWorkspace } = useProjectStore((state) => state);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!selectedWorkspace?.uid || !accessToken) return;
    setLoading(true);
    setError(null);
    getWorkspaceProjectsApi(accessToken, selectedWorkspace.uid)
      .then((res) => {
        if (Array.isArray(res?.data)) {
          setProjects(res.data);
          const uid = searchParams.get('project');
          if (uid) {
            const match = res.data.find((p: Project) => p.uid === uid);
            if (match) setSelectedProject(match);
          }
        } else {
          setError('Failed to load projects');
        }
      })
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [accessToken, selectedWorkspace?.uid]);

  const handleView = (project: Project) => {
    setSelectedProject(project);
    const params = new URLSearchParams(searchParams.toString());
    params.set('project', project.uid);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Edit the project's settings inline, in a modal. A workspace owner/admin can
  // do this on the project owner's behalf (the server grants it via the
  // workspace-admin fallback; changes are audited under their account). Editing
  // in place avoids deep-linking into the project's own dashboard, which fights
  // the global selected-project store.
  const handleOpenSettings = (project: Project) => {
    setSettingsProject(project);
    // Close the detail dialog if it was the entry point, so the two dialogs
    // don't stack on top of each other.
    if (selectedProject) handleClose();
  };

  // Refresh the list so edited fields (name, etc.) show the saved values.
  const handleSettingsSaved = () => {
    if (!selectedWorkspace?.uid || !accessToken) return;
    getWorkspaceProjectsApi(accessToken, selectedWorkspace.uid)
      .then((res) => { if (Array.isArray(res?.data)) setProjects(res.data); })
      .catch(() => {});
  };

  const handleClose = () => {
    setSelectedProject(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('project');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  };

  const handleStatusUpdated = (projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled') => {
    setProjects((prev) => prev.map((p) => (p.uid === projectUid ? { ...p, status } : p)));
    setSelectedProject((prev) => (prev ? { ...prev, status } : null));
  };

  const handleTransferred = (projectUid: string) => {
    setProjects((prev) => prev.filter((p) => p.uid !== projectUid));
    setSelectedProject(null);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return counts;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.country?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [projects, query, statusFilter]);

  const totalSites = projects.reduce((sum, p) => sum + p.siteCount, 0);

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            Project Management
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            <span className="text-border">|</span>
            <span>{totalSites} site{totalSites !== 1 ? 's' : ''}</span>
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={projects.length === 0}
              onClick={() => exportProjectsToCsv(filteredProjects, selectedWorkspace?.name ?? '')}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </CardAction>
        </CardHeader>

        {/* Toolbar */}
        {!loading && !error && projects.length > 0 && (
          <div className="flex flex-col gap-3 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, slug, country..."
                className="h-9 pl-9"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-9">
                {STATUS_FILTERS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value} className="gap-1.5 text-xs">
                    {f.label}
                    <span className="rounded bg-muted-foreground/15 px-1 text-[10px] font-semibold tabular-nums">
                      {statusCounts[f.value] ?? 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-destructive">{error}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No projects in this workspace.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No projects match your filters.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[240px] text-xs uppercase tracking-wide text-muted-foreground">Project</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Visibility</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Members</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Sites</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Country</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <ProjectRow key={project.uid} project={project} onView={handleView} onOpenSettings={handleOpenSettings} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && handleClose()}>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            workspaceUid={selectedWorkspace?.uid ?? ''}
            onClose={handleClose}
            onStatusUpdated={handleStatusUpdated}
            onTransferred={handleTransferred}
            onOpenSettings={handleOpenSettings}
          />
        )}
      </Dialog>

      <ProjectSettingsModal
        projectUid={settingsProject?.uid ?? null}
        projectName={settingsProject?.name}
        open={!!settingsProject}
        onClose={() => setSettingsProject(null)}
        onSaved={handleSettingsSaved}
      />
    </>
  );
}
