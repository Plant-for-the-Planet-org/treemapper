'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Leaf, Loader2, Save, Settings, Shield, Globe, Key, Copy, Check, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

import {
  getSingleProjectDetails,
  updateProjectSettings,
  getProjectApiKey,
  generateProjectApiKey,
  revokeProjectApiKey,
} from '@shared-core/fetchApi/api.fetch';
import { useToken } from '@/context/useTokenContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ─── approval settings helpers (mirror the project settings page) ─────────── */

const DEFAULT_APPROVAL_SETTINGS = {
  sources: { web: true, bulk: true, mobile: true },
  siteApprovalRequired: true,
};

const normalizeApprovalSettings = (value: any) => {
  const sources = (value && typeof value === 'object' && value.sources) || {};
  return {
    sources: {
      web: typeof sources.web === 'boolean' ? sources.web : true,
      bulk: typeof sources.bulk === 'boolean' ? sources.bulk : true,
      mobile: typeof sources.mobile === 'boolean' ? sources.mobile : true,
    },
    siteApprovalRequired:
      value && typeof value.siteApprovalRequired === 'boolean' ? value.siteApprovalRequired : true,
  };
};

const SELECT_OPTIONS = {
  type: ['restoration', 'conservation', 'research', 'education'],
  purpose: ['conservation', 'restoration', 'research', 'education', 'community'],
  classification: ['environmental', 'social', 'economic', 'research', 'educational'],
  ecosystem: ['tropical_rainforest', 'temperate_forest', 'boreal_forest', 'grassland', 'wetland', 'desert', 'coastal', 'mountain'],
  scale: ['small', 'medium', 'large', 'enterprise'],
  intensity: ['low', 'medium', 'high'],
  revisionPeriodicity: ['weekly', 'monthly', 'quarterly', 'annually', 'biannually'],
} as const;

const label = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── reusable fields ──────────────────────────────────────────────────────── */

function Field({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{lbl}</Label>
      {children}
    </div>
  );
}

function PlainSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">{label(o)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ToggleRow({ title, description, checked, onToggle, disabled }: { title: string; description?: string; checked: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  );
}

/* ─── API key block ────────────────────────────────────────────────────────── */

function ApiKeyManager({ projectUid, accessToken, enabled }: { projectUid: string; accessToken: string; enabled: boolean }) {
  const [status, setStatus] = useState<{ exists: boolean; keyPrefix: string | null; lastUsedAt: string | null } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    const result = await getProjectApiKey(accessToken, projectUid);
    if (result?.data) setStatus(result.data);
  }, [accessToken, projectUid]);

  useEffect(() => { if (enabled) loadStatus(); }, [enabled, loadStatus]);

  if (!enabled) return null;

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const result = await generateProjectApiKey(accessToken, projectUid);
      if (result?.data?.apiKey) {
        setNewKey(result.data.apiKey);
        toast.success('API key generated. Copy it now, it will not be shown again.');
        await loadStatus();
      } else {
        toast.error(result?.message || 'Failed to generate API key');
      }
    } finally { setBusy(false); }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      const result = await revokeProjectApiKey(accessToken, projectUid);
      if (result?.statusCode === 200 || result?.statusCode === 201) {
        setNewKey(null);
        setStatus({ exists: false, keyPrefix: null, lastUsedAt: null });
        toast.success('API key revoked');
      } else {
        toast.error(result?.message || 'Failed to revoke API key');
      }
    } finally { setBusy(false); }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy to clipboard'); }
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      {newKey ? (
        <div className="space-y-2">
          <Alert>
            <AlertTriangle />
            <AlertDescription>Copy this key now. For security, you will not be able to see it again.</AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-md bg-foreground px-3 py-2 font-mono text-xs text-background">{newKey}</code>
            <Button type="button" size="icon" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        </div>
      ) : status?.exists ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-mono text-foreground">{status.keyPrefix}{'••••••••'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Last used: {status.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString() : 'Never'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleGenerate}>
              <RefreshCw size={14} className="mr-1.5" />Regenerate
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleRevoke} className="border-destructive/50 text-destructive hover:bg-destructive/10">
              <Trash2 size={14} className="mr-1.5" />Revoke
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">No API key yet. Generate one to start using the API.</p>
          <Button type="button" size="sm" disabled={busy} onClick={handleGenerate}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Key size={14} className="mr-1.5" />}Generate API key
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── main modal ───────────────────────────────────────────────────────────── */

const EMPTY = {
  name: '', slug: '', type: '', description: '', purpose: '', classification: '',
  ecosystem: '', scale: '', intensity: '', revisionPeriodicity: '', country: '',
  website: '', videoUrl: '', target: '',
  approvalBoardEnabled: false,
  approvalSettings: DEFAULT_APPROVAL_SETTINGS,
  apiEnabled: false,
};

export default function ProjectSettingsModal({
  projectUid,
  projectName,
  open,
  onClose,
  onSaved,
}: {
  projectUid: string | null;
  projectName?: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { accessToken } = useToken();
  const [data, setData] = useState<any>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectUid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSingleProjectDetails(accessToken, projectUid)
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.uid) {
          const d = res.data;
          setData({
            name: d.name || '',
            slug: d.slug || '',
            type: d.type || '',
            description: d.description || '',
            purpose: d.purpose || '',
            classification: d.classification || '',
            ecosystem: d.ecosystem || '',
            scale: d.scale || '',
            intensity: d.intensity || '',
            revisionPeriodicity: d.revisionPeriodicity || '',
            country: d.country || '',
            website: d.website || '',
            videoUrl: d.videoUrl || '',
            target: d.target != null ? String(d.target) : '',
            approvalBoardEnabled: d.approvalBoardEnabled ?? false,
            approvalSettings: normalizeApprovalSettings(d.approvalSettings),
            apiEnabled: d.apiEnabled ?? false,
          });
        } else {
          setError(res?.message || 'Could not load project settings.');
        }
      })
      .catch(() => { if (!cancelled) setError('Could not load project settings.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, projectUid, accessToken]);

  const set = (key: string, value: any) => setData((prev: any) => ({ ...prev, [key]: value }));

  const toggleSource = (key: 'web' | 'bulk' | 'mobile') =>
    setData((prev: any) => {
      const s = normalizeApprovalSettings(prev.approvalSettings);
      return { ...prev, approvalSettings: { ...s, sources: { ...s.sources, [key]: !s.sources[key] } } };
    });

  const toggleSiteApproval = () =>
    setData((prev: any) => {
      const s = normalizeApprovalSettings(prev.approvalSettings);
      return { ...prev, approvalSettings: { ...s, siteApprovalRequired: !s.siteApprovalRequired } };
    });

  // Only send fields that hold a value, so empty inputs never wipe existing data.
  const buildPayload = () => {
    const p: Record<string, any> = {};
    const trimmed = (v: any) => (typeof v === 'string' ? v.trim() : v);
    (['name', 'type', 'description', 'purpose', 'classification', 'ecosystem', 'scale', 'intensity', 'revisionPeriodicity', 'website', 'videoUrl'] as const)
      .forEach((k) => { const v = trimmed(data[k]); if (v) p[k] = v; });
    if (data.country && data.country.trim()) p.country = data.country.trim().substring(0, 3).toUpperCase();
    if (data.target !== '' && data.target != null) {
      const n = Number(data.target);
      if (Number.isInteger(n) && n > 0) p.target = n;
    }
    p.approvalBoardEnabled = !!data.approvalBoardEnabled;
    p.approvalSettings = normalizeApprovalSettings(data.approvalSettings);
    p.apiEnabled = !!data.apiEnabled;
    return p;
  };

  const handleSave = async () => {
    if (!projectUid) return;
    if (!data.name || !data.name.trim()) { toast.error('Project name is required'); return; }
    if (data.website && !/^https?:\/\/.+/.test(data.website)) { toast.error('Website must start with http:// or https://'); return; }
    if (data.videoUrl && !/^https?:\/\/.+/.test(data.videoUrl)) { toast.error('Video URL must start with http:// or https://'); return; }
    setSaving(true);
    try {
      const result = await updateProjectSettings(accessToken, buildPayload(), projectUid);
      if (result?.statusCode === 200 || result?.statusCode === 201) {
        toast.success('Project settings updated');
        onSaved?.();
        onClose();
      } else {
        toast.error(result?.message || 'Failed to update project settings');
      }
    } catch {
      toast.error('Failed to update project settings');
    } finally {
      setSaving(false);
    }
  };

  const approval = normalizeApprovalSettings(data.approvalSettings);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Project settings
          </DialogTitle>
          <DialogDescription>
            Editing {projectName ? <span className="font-medium text-foreground">{projectName}</span> : 'this project'} on the owner's behalf. Changes are recorded under your account.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mx-6 mt-4 self-start">
                <TabsTrigger value="general"><FileText className="h-3.5 w-3.5 mr-1.5" />General</TabsTrigger>
                <TabsTrigger value="features"><Shield className="h-3.5 w-3.5 mr-1.5" />Features</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="general" className="mt-0 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Project name">
                      <Input value={data.name} onChange={(e) => set('name', e.target.value)} maxLength={40} placeholder="Enter project name" />
                    </Field>
                    <Field label="Project slug">
                      <Input value={data.slug} disabled className="bg-muted/40 text-muted-foreground" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Project type"><PlainSelect value={data.type} onChange={(v) => set('type', v)} options={SELECT_OPTIONS.type} /></Field>
                    <Field label="Purpose"><PlainSelect value={data.purpose} onChange={(v) => set('purpose', v)} options={SELECT_OPTIONS.purpose} /></Field>
                  </div>

                  <Field label="About project">
                    <Textarea value={data.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Describe the project goals and methodology..." className="resize-none" />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Classification"><PlainSelect value={data.classification} onChange={(v) => set('classification', v)} options={SELECT_OPTIONS.classification} /></Field>
                    <Field label="Ecosystem"><PlainSelect value={data.ecosystem} onChange={(v) => set('ecosystem', v)} options={SELECT_OPTIONS.ecosystem} /></Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Scale"><PlainSelect value={data.scale} onChange={(v) => set('scale', v)} options={SELECT_OPTIONS.scale} /></Field>
                    <Field label="Intensity"><PlainSelect value={data.intensity} onChange={(v) => set('intensity', v)} options={SELECT_OPTIONS.intensity} /></Field>
                    <Field label="Revision periodicity"><PlainSelect value={data.revisionPeriodicity} onChange={(v) => set('revisionPeriodicity', v)} options={SELECT_OPTIONS.revisionPeriodicity} /></Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Country (3-letter code)">
                      <Input value={data.country} onChange={(e) => set('country', e.target.value)} maxLength={3} placeholder="USA" />
                    </Field>
                    <Field label="Target">
                      <Input type="number" min={1} value={data.target} onChange={(e) => set('target', e.target.value)} placeholder="Target number" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Project website"><Input type="url" value={data.website} onChange={(e) => set('website', e.target.value)} placeholder="https://yourproject.com" /></Field>
                    <Field label="Video URL"><Input type="url" value={data.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." /></Field>
                  </div>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Location map and project images are edited from the project's own settings page.
                  </p>
                </TabsContent>

                <TabsContent value="features" className="mt-0 space-y-4">
                  <ToggleRow
                    title="Approval board"
                    description="Require admin approval before team members' interventions are registered."
                    checked={data.approvalBoardEnabled}
                    onToggle={() => set('approvalBoardEnabled', !data.approvalBoardEnabled)}
                  />

                  {data.approvalBoardEnabled && (
                    <div className="space-y-3 rounded-lg border border-border p-3">
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">Require approval for interventions from</p>
                        <p className="text-xs text-muted-foreground mb-2">Only the sources you turn on need approval. Others are published right away.</p>
                        <div className="space-y-2">
                          <ToggleRow title="Web dashboard" checked={approval.sources.web} onToggle={() => toggleSource('web')} />
                          <ToggleRow title="Bulk upload" checked={approval.sources.bulk} onToggle={() => toggleSource('bulk')} />
                          <ToggleRow title="Mobile app" checked={approval.sources.mobile} onToggle={() => toggleSource('mobile')} />
                        </div>
                      </div>
                      <ToggleRow
                        title="Require approval for sites"
                        description="New sites must be approved before they appear on the map."
                        checked={approval.siteApprovalRequired}
                        onToggle={toggleSiteApproval}
                      />
                    </div>
                  )}

                  <div>
                    <ToggleRow
                      title="Project API"
                      description="Let external apps read this project's data with an API key."
                      checked={data.apiEnabled}
                      onToggle={() => set('apiEnabled', !data.apiEnabled)}
                    />
                    {projectUid && <ApiKeyManager projectUid={projectUid} accessToken={accessToken} enabled={data.apiEnabled} />}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-1.5" />Save changes</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
