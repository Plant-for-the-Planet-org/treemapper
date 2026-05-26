'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Flag,
  Globe,
  LogIn,
  Mail,
  MapPin,
  Target,
  Trees,
  UserCircle,
  Users,
} from 'lucide-react';
import { getAllWorkspacesApi, getWorkspaceProjectsApi, startImpersonationWork, transferProjectApi, updateProjectStatusApi } from '@shared-core/fetchApi/api.fetch';
import { sanitizeAvatarUrl } from '@shared-core/utils/avatarUrl';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import type { Project, Site } from '../types';
import { Badge, Card, CardContent, CardHeader, CardTitle } from './workspace-ui';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/* ─── variant maps ─────────────────────────────────────────────────────────── */

const siteStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'destructive'> = {
  planted: 'success',
  planting: 'success',
  planning: 'default',
  reforestation: 'warning',
  barren: 'destructive',
};

const projectStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'destructive'> = {
  active: 'success',
  in_review: 'warning',
  suspended: 'destructive',
  disabled: 'default',
};

const reviewStatusVariant: Record<string, 'success' | 'warning' | 'default' | 'destructive'> = {
  approved: 'success',
  in_review: 'warning',
  pending: 'default',
  rejected: 'destructive',
};

/* ─── SiteRow (table in ProjectRow expand) ──────────────────────────────────── */

function SiteRow({ site }: { site: Site }) {
  return (
    <tr className="bg-gray-50 border-b text-sm">
      <td className="pl-10 pr-2 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-800">{site.name}</span>
          {site.description && (
            <span className="text-gray-400 truncate max-w-[200px]">{site.description}</span>
          )}
        </div>
      </td>
      <td className="p-2">
        {site.status ? (
          <Badge variant={siteStatusVariant[site.status] ?? 'default'}>
            {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="p-2 text-gray-600">
        {site.area != null ? `${site.area.toLocaleString()} ha` : '—'}
      </td>
      <td className="p-2 text-gray-600">
        {site.expectedTreeCount != null ? site.expectedTreeCount.toLocaleString() : '—'}
      </td>
      <td className="p-2">
        {site.reviewStatus ? (
          <Badge variant={reviewStatusVariant[site.reviewStatus] ?? 'default'}>
            {site.reviewStatus.replace('_', ' ')}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="p-2 text-gray-500">
        {site.actualPlantingDate
          ? new Date(site.actualPlantingDate).toLocaleDateString()
          : site.plannedPlantingDate
            ? `Planned: ${new Date(site.plannedPlantingDate).toLocaleDateString()}`
            : '—'}
      </td>
    </tr>
  );
}

/* ─── ModalSiteRow ──────────────────────────────────────────────────────────── */

function ModalSiteRow({ site }: { site: Site }) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="px-3 py-2.5">
        <div className="font-medium text-gray-800 text-sm">{site.name}</div>
        {site.description && (
          <div className="text-xs text-gray-400 truncate max-w-[180px] mt-0.5">{site.description}</div>
        )}
      </td>
      <td className="px-3 py-2.5">
        {site.status ? (
          <Badge variant={siteStatusVariant[site.status] ?? 'default'}>
            {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
          </Badge>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-600">
        {site.area != null ? `${site.area.toLocaleString()} ha` : '—'}
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-600">
        {site.expectedTreeCount != null ? site.expectedTreeCount.toLocaleString() : '—'}
      </td>
      <td className="px-3 py-2.5">
        {site.reviewStatus ? (
          <Badge variant={reviewStatusVariant[site.reviewStatus] ?? 'default'}>
            {site.reviewStatus.replace('_', ' ')}
          </Badge>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-500">
        {site.actualPlantingDate
          ? new Date(site.actualPlantingDate).toLocaleDateString()
          : site.plannedPlantingDate
            ? `Planned: ${new Date(site.plannedPlantingDate).toLocaleDateString()}`
            : '—'}
      </td>
    </tr>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex-shrink-0 rounded-lg bg-white p-2 shadow-sm border border-gray-100">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSubject('');
      setBody('');
      setSent(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(90vw,38rem)] max-w-none p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-5 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <DialogTitle className="text-base font-semibold text-gray-900">
              Contact Owner
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 flex-1">
          {/* Template loader */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Load Template
            </p>
            <Select onValueChange={handleLoadTemplate}>
              <SelectTrigger className="h-9 text-sm bg-white">
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

          {/* To */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              To
            </p>
            <Input
              value={ownerEmail}
              readOnly
              className="h-9 text-sm bg-gray-50 text-gray-500 cursor-default"
            />
          </div>

          {/* Subject */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Subject
            </p>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="h-9 text-sm"
            />
          </div>

          {/* Body */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
              Message
            </p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="text-sm resize-none min-h-[160px]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || sent}
            className="bg-gray-900 hover:bg-gray-700 text-white gap-1.5 min-w-[80px]"
          >
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
}: {
  project: Project;
  workspaceUid: string;
  onClose: () => void;
  onStatusUpdated: (projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled') => void;
  onTransferred: (projectUid: string) => void;
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
      className="w-[min(90vw,72rem)] max-w-none p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden"
    >
      {/* Header */}
      <DialogHeader className="px-6 py-5 border-b flex-shrink-0">
        <div className="flex items-start justify-between gap-4 pr-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {project.name}
              </DialogTitle>
              <Badge variant={project.isPublic ? 'success' : 'default'}>
                {project.isPublic
                  ? <><Eye className="h-3 w-3" />Public</>
                  : <><EyeOff className="h-3 w-3" />Private</>}
              </Badge>
              <Badge variant={projectStatusVariant[project.status] ?? 'default'}>
                {project.status.replace('_', ' ')}
              </Badge>
              {project.flag && (
                <Badge variant="destructive"><Flag className="h-3 w-3" />Flagged</Badge>
              )}
              {project.approvalBoardEnabled && (
                <Badge variant="outline">Approval Board</Badge>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-mono">/{project.slug}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Button>
        </div>
      </DialogHeader>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Description / purpose */}
        {(project.description || project.purpose) && (
          <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            {project.description && (
              <p className="text-sm text-gray-700">{project.description}</p>
            )}
            {project.purpose && (
              <p className="text-xs text-gray-500 italic">{project.purpose}</p>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="h-4 w-4 text-blue-500" />}
            label="Members"
            value={project.memberCount}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4 text-green-500" />}
            label="Sites"
            value={project.siteCount}
          />
          {project.target != null && (
            <StatCard
              icon={<Target className="h-4 w-4 text-orange-500" />}
              label="Target trees"
              value={project.target.toLocaleString()}
            />
          )}
          <StatCard
            icon={<Calendar className="h-4 w-4 text-purple-500" />}
            label="Created"
            value={new Date(project.createdAt).toLocaleDateString()}
          />
        </div>

        {/* Owner */}
        {project.owner && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            {sanitizeAvatarUrl(project.owner.image) ? (
              <img
                src={sanitizeAvatarUrl(project.owner.image)}
                alt={project.owner.displayName}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
              />
            ) : (
              <UserCircle className="h-10 w-10 text-gray-300 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">
                Project Owner
              </div>
              <div className="text-sm font-semibold text-gray-900">{project.owner.displayName}</div>
              <div className="text-xs text-gray-500 truncate">{project.owner.email}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setContactOwnerOpen(true)}
              className="flex-shrink-0 gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5" />
              Contact Owner
            </Button>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          {project.country && (
            <span>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mr-1.5">Country</span>
              {project.country}
            </span>
          )}
          {project.ecosystem && (
            <span>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mr-1.5">Ecosystem</span>
              {project.ecosystem}
            </span>
          )}
          {project.type && (
            <span>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mr-1.5">Type</span>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <Trees className="h-4 w-4 text-green-600" />
            Sites
            <span className="text-gray-400 font-normal">({project.siteCount})</span>
          </h3>

          {project.sites.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center border border-dashed rounded-xl">
              No sites in this project.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Site</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Area</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Trees</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Review</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Planting</th>
                  </tr>
                </thead>
                <tbody>
                  {project.sites.map((site) => (
                    <ModalSiteRow key={site.uid} site={site} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t flex-shrink-0 bg-gray-50/60">

        {/* Zone 1: Status */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
            Project Status
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {PROJECT_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPendingStatus(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    pendingStatus === value
                      ? 'border-transparent bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {saveError && <span className="text-xs text-red-500">{saveError}</span>}
              <Button
                size="sm"
                onClick={handleSaveStatus}
                disabled={!isDirty || saving}
                className="bg-gray-900 hover:bg-gray-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Status'}
              </Button>
            </div>
          </div>
        </div>

        {/* Zone 2: Transfer */}
        <div className="px-6 py-4 border-t border-dashed border-gray-200">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
            Transfer Project
          </p>
          <div className="flex items-center gap-3">
            <Select value={targetWorkspaceUid} onValueChange={setTargetWorkspaceUid}>
              <SelectTrigger className="flex-1 h-9 text-sm bg-white">
                <SelectValue placeholder="Select destination workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.uid} value={w.uid}>
                    {w.name}
                    <span className="text-gray-400 ml-1">({w.slug})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {transferError && (
              <span className="text-xs text-red-500 shrink-0">{transferError}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTransfer}
              disabled={!targetWorkspaceUid || transferring}
              className="shrink-0"
            >
              {transferring ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </div>

        {/* Zone 3: Primary actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {project.owner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImpersonateOwner}
                disabled={impersonating}
                className="gap-1.5"
              >
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

function ProjectRow({ project, onView }: { project: Project; onView: (project: Project) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b hover:bg-gray-50/80 transition-colors">
        <td className="p-2 w-[220px] max-w-[220px]">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left min-w-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {project.sites.length > 0 ? (
              expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate text-sm">{project.name}</div>
              <div className="text-xs text-gray-400 truncate font-mono">/{project.slug}</div>
            </div>
          </button>
        </td>
        <td className="p-2">
          <Badge variant={project.isPublic ? 'success' : 'default'}>
            {project.isPublic
              ? <><Eye className="h-3 w-3" />Public</>
              : <><EyeOff className="h-3 w-3" />Private</>}
          </Badge>
        </td>
        <td className="p-2">
          <Badge variant={projectStatusVariant[project.status] ?? 'default'}>
            {project.status.replace('_', ' ')}
          </Badge>
        </td>
        <td className="p-2 text-sm text-gray-600">{project.memberCount}</td>
        <td className="p-2 text-sm text-gray-600">{project.siteCount}</td>
        <td className="p-2 text-sm text-gray-500">{project.country ?? '—'}</td>
        <td className="p-2 text-sm text-gray-500">{new Date(project.createdAt).toLocaleDateString()}</td>
        <td className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(project)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </td>
      </tr>

      {expanded && project.sites.length > 0 && (
        <>
          <tr className="bg-gray-100">
            <th className="pl-10 pr-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Site</th>
            <th className="p-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Status</th>
            <th className="p-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Area</th>
            <th className="p-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Trees</th>
            <th className="p-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Review</th>
            <th className="p-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest" colSpan={2}>Planting Date</th>
          </tr>
          {project.sites.map((site) => (
            <SiteRow key={site.uid} site={site} />
          ))}
        </>
      )}
    </>
  );
}

/* ─── ProjectManagementSection ──────────────────────────────────────────────── */

export function ProjectManagementSection() {
  const { accessToken } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedWorkspce: selectedWorkspace } = useProjectStore((state) => state);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  const handleClose = () => {
    setSelectedProject(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('project');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  };

  const handleStatusUpdated = (projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled') => {
    setProjects((prev) => prev.map((p) => p.uid === projectUid ? { ...p, status } : p));
    setSelectedProject((prev) => prev ? { ...prev, status } : null);
  };

  const handleTransferred = (projectUid: string) => {
    setProjects((prev) => prev.filter((p) => p.uid !== projectUid));
    setSelectedProject(null);
  };

  const totalSites = projects.reduce((sum, p) => sum + p.siteCount, 0);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Management</CardTitle>
              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-200">|</span>
                <span>{totalSites} site{totalSites !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading projects...</div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">{error}</div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No projects in this workspace.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[220px]">Project</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visibility</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sites</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                    <th className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" />
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <ProjectRow key={project.uid} project={project} onView={handleView} />
                  ))}
                </tbody>
              </table>
            </div>
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
          />
        )}
      </Dialog>
    </>
  );
}
