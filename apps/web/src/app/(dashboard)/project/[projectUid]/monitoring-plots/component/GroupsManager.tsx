'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-toastify';
import {
  createMonitoringPlotGroup, updateMonitoringPlotGroup, deleteMonitoringPlotGroup,
} from '@shared-core/fetchApi/api.fetch';
import type { PlotListItem, PlotGroup } from './PlotsOverview';

const GroupsManager = ({
  open,
  onClose,
  token,
  projectUid,
  plots,
  groups,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  projectUid: string;
  plots: PlotListItem[];
  groups: PlotGroup[];
  onChanged: () => void;
}) => {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const run = async (fn: () => Promise<any>, errMsg: string) => {
    setBusy(true);
    try {
      const res = await fn();
      if (!res) { toast.error(errMsg); return false; }
      onChanged();
      return true;
    } catch {
      toast.error(errMsg);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const ok = await run(
      () => createMonitoringPlotGroup(token, projectUid, { name: newName.trim(), plotUids: [] }),
      'Could not create group',
    );
    if (ok) { setNewName(''); toast.success('Group created'); }
  };

  const handleRename = async (groupUid: string) => {
    if (!editName.trim()) return;
    const ok = await run(
      () => updateMonitoringPlotGroup(token, projectUid, groupUid, { name: editName.trim() }),
      'Could not rename group',
    );
    if (ok) setEditingUid(null);
  };

  const handleDelete = async (groupUid: string) => {
    await run(() => deleteMonitoringPlotGroup(token, projectUid, groupUid), 'Could not delete group');
  };

  const toggleMembership = async (group: PlotGroup, plotUid: string, member: boolean) => {
    const current = new Set(group.plots.map((p) => p.uid));
    if (member) current.add(plotUid);
    else current.delete(plotUid);
    await run(
      () => updateMonitoringPlotGroup(token, projectUid, group.uid, { plotUids: [...current] }),
      'Could not update group',
    );
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Plot groups</SheetTitle>
          <SheetDescription>Organize plots into groups for this project.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-2">
          <Input
            placeholder="New group name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={busy || !newName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <Separator className="my-4" />

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No groups yet.</p>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.uid} className="border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  {editingUid === g.uid ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(g.uid)} disabled={busy}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUid(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.plots.length} plot{g.plots.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingUid(g.uid); setEditName(g.name); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(g.uid)} disabled={busy}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {plots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No plots to assign.</p>
                  ) : plots.map((p) => {
                    const member = g.plots.some((gp) => gp.uid === p.uid);
                    return (
                      <label key={p.uid} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={member}
                          disabled={busy}
                          onCheckedChange={(v) => toggleMembership(g, p.uid, !!v)}
                        />
                        <span className="truncate">{p.name || p.hid}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default GroupsManager;
