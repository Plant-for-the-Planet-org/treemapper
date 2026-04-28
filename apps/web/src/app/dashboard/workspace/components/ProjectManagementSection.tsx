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
  MapPin,
  Target,
  Trees,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { getWorkspaceProjectsApi, updateProjectStatusApi } from '@shared-core/fetchApi/api.fetch';
import { sanitizeAvatarUrl } from '@shared-core/utils/avatarUrl';
import { useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import type { Project, Site } from '../types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from './workspace-ui';

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

/* ─── SiteRow ───────────────────────────────────────────────────────────────── */

function SiteRow({ site }: { site: Site }) {
  return (
    <tr className="bg-gray-50 border-b text-sm">
      <td className="pl-10 pr-2 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-800">{site.name}</span>
          {site.description && (
            <span className="text-gray-400 truncate max-w-[200px]">— {site.description}</span>
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

/* ─── ProjectDetailModal ────────────────────────────────────────────────────── */

const PROJECT_STATUSES: { value: 'active' | 'in_review' | 'suspended' | 'disabled'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'in_review', label: 'In Review' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'disabled', label: 'Disabled' },
];

function ProjectDetailModal({
  project,
  workspaceUid,
  onClose,
  onStatusUpdated,
}: {
  project: Project;
  workspaceUid: string;
  onClose: () => void;
  onStatusUpdated: (projectUid: string, status: 'active' | 'in_review' | 'suspended' | 'disabled') => void;
}) {
  const { accessToken } = useToken();
  const [pendingStatus, setPendingStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* panel */}
      <div className="relative z-50 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{project.name}</h2>
              <Badge variant={project.isPublic ? 'success' : 'default'}>
                {project.isPublic ? <><Eye className="h-3 w-3 mr-1" />Public</> : <><EyeOff className="h-3 w-3 mr-1" />Private</>}
              </Badge>
              <Badge variant={projectStatusVariant[project.status] ?? 'default'}>
                {project.status.replace('_', ' ')}
              </Badge>
              {project.flag && (
                <Badge variant="destructive"><Flag className="h-3 w-3 mr-1" />Flagged</Badge>
              )}
              {project.approvalBoardEnabled && (
                <Badge variant="outline">Approval Board</Badge>
              )}
            </div>
            <div className="text-sm text-gray-400 mt-0.5">/{project.slug}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* description / purpose */}
          {(project.description || project.purpose) && (
            <div className="space-y-1">
              {project.description && <p className="text-sm text-gray-700">{project.description}</p>}
              {project.purpose && <p className="text-sm text-gray-500 italic">{project.purpose}</p>}
            </div>
          )}

          {/* stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Users className="h-4 w-4 text-blue-500" />} label="Members" value={project.memberCount} />
            <StatCard icon={<MapPin className="h-4 w-4 text-green-500" />} label="Sites" value={project.siteCount} />
            {project.target != null && (
              <StatCard icon={<Target className="h-4 w-4 text-orange-500" />} label="Target trees" value={project.target.toLocaleString()} />
            )}
            <StatCard icon={<Calendar className="h-4 w-4 text-purple-500" />} label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
          </div>

          {/* owner */}
          {project.owner && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              {sanitizeAvatarUrl(project.owner.image) ? (
                <img src={sanitizeAvatarUrl(project.owner.image)} alt={project.owner.displayName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <UserCircle className="h-9 w-9 text-gray-300 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Project Owner</div>
                <div className="text-sm font-semibold text-gray-900">{project.owner.displayName}</div>
                <div className="text-xs text-gray-500 truncate">{project.owner.email}</div>
              </div>
            </div>
          )}

          {/* meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {project.country && <span><span className="text-gray-400">Country</span> {project.country}</span>}
            {project.ecosystem && <span><span className="text-gray-400">Ecosystem</span> {project.ecosystem}</span>}
            {project.type && <span><span className="text-gray-400">Type</span> {project.type}</span>}
            {project.website && (
              <a href={project.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#007A49] hover:underline">
                <Globe className="h-3.5 w-3.5" />Website
              </a>
            )}
          </div>

          {/* sites */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Trees className="h-4 w-4 text-green-600" />
              Sites ({project.siteCount})
            </h3>

            {project.sites.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center border rounded-lg">No sites in this project.</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Site</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Area</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Trees</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Review</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Planting date</th>
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

        {/* footer — status editor */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Project status</span>
            <div className="flex gap-2">
              {PROJECT_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPendingStatus(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    pendingStatus === value
                      ? 'border-transparent bg-gray-900 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleSaveStatus} disabled={!isDirty || saving}>
              {saving ? 'Saving…' : 'Save Status'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      {icon}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function ModalSiteRow({ site }: { site: Site }) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="px-3 py-2">
        <div className="font-medium text-gray-800">{site.name}</div>
        {site.description && <div className="text-xs text-gray-400 truncate max-w-[180px]">{site.description}</div>}
      </td>
      <td className="px-3 py-2">
        {site.status ? (
          <Badge variant={siteStatusVariant[site.status] ?? 'default'}>
            {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
          </Badge>
        ) : '—'}
      </td>
      <td className="px-3 py-2 text-gray-600">{site.area != null ? `${site.area.toLocaleString()} ha` : '—'}</td>
      <td className="px-3 py-2 text-gray-600">{site.expectedTreeCount != null ? site.expectedTreeCount.toLocaleString() : '—'}</td>
      <td className="px-3 py-2">
        {site.reviewStatus ? (
          <Badge variant={reviewStatusVariant[site.reviewStatus] ?? 'default'}>
            {site.reviewStatus.replace('_', ' ')}
          </Badge>
        ) : '—'}
      </td>
      <td className="px-3 py-2 text-gray-500 text-xs">
        {site.actualPlantingDate
          ? new Date(site.actualPlantingDate).toLocaleDateString()
          : site.plannedPlantingDate
          ? `Planned: ${new Date(site.plannedPlantingDate).toLocaleDateString()}`
          : '—'}
      </td>
    </tr>
  );
}

/* ─── ProjectRow ────────────────────────────────────────────────────────────── */

function ProjectRow({ project, onView }: { project: Project; onView: (project: Project) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="p-2">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setExpanded((v) => !v)}
          >
            {project.sites.length > 0 ? (
              expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )
            ) : (
              <span className="w-4" />
            )}
            <div>
              <div className="font-medium text-gray-900">{project.name}</div>
              <div className="text-xs text-gray-400">/{project.slug}</div>
              {project.description && (
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</div>
              )}
            </div>
          </button>
        </td>
        <td className="p-2">
          <Badge variant={project.isPublic ? 'success' : 'default'}>
            {project.isPublic ? (
              <><Eye className="h-3 w-3 mr-1" />Public</>
            ) : (
              <><EyeOff className="h-3 w-3 mr-1" />Private</>
            )}
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
          <Button variant="ghost" size="sm" onClick={() => onView(project)}>
            <Eye className="h-4 w-4" />
          </Button>
        </td>
      </tr>

      {expanded && project.sites.length > 0 && (
        <>
          <tr className="bg-gray-100">
            <th className="pl-10 pr-2 py-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
            <th className="p-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="p-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</th>
            <th className="p-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trees</th>
            <th className="p-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</th>
            <th className="p-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide" colSpan={2}>Planting Date</th>
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
          // restore modal from URL on load
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

  const totalSites = projects.reduce((sum, p) => sum + p.siteCount, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-300">|</span>
                <span>{totalSites} site{totalSites !== 1 ? 's' : ''}</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading projects…</div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-500">{error}</div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No projects in this workspace.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-gray-700">Project</th>
                      <th className="text-left p-2 font-medium text-gray-700">Visibility</th>
                      <th className="text-left p-2 font-medium text-gray-700">Status</th>
                      <th className="text-left p-2 font-medium text-gray-700">Members</th>
                      <th className="text-left p-2 font-medium text-gray-700">Sites</th>
                      <th className="text-left p-2 font-medium text-gray-700">Country</th>
                      <th className="text-left p-2 font-medium text-gray-700">Created</th>
                      <th className="text-left p-2 font-medium text-gray-700">View</th>
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
          </div>
        </CardContent>
      </Card>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          workspaceUid={selectedWorkspace?.uid ?? ''}
          onClose={handleClose}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </>
  );
}
