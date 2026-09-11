'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { PlotDetail } from './PlotDetails';
import type { PlotGroup } from './PlotsOverview';

/**
 * A plot sits in at most one group, so the group is a single choice here rather
 * than the per-group checkboxes in the groups sheet. Radix Select has no empty
 * item value, so "no group" carries a sentinel and is turned back into null on
 * save.
 */
const NO_GROUP = '__none__';

type FormState = {
  name: string;
  shape: string;
  plotType: string;
  complexity: string;
  radius: string;
  length: string;
  width: string;
  isComplete: boolean;
  groupUid: string;
};

const toForm = (p: PlotDetail): FormState => ({
  name: p.name || '',
  shape: p.shape || '',
  plotType: p.plotType || '',
  complexity: p.complexity || '',
  radius: p.radius != null ? String(p.radius) : '',
  length: p.length != null ? String(p.length) : '',
  width: p.width != null ? String(p.width) : '',
  isComplete: !!p.isComplete,
  groupUid: p.group?.uid || NO_GROUP,
});

const EditPlotModal = ({
  open,
  plot,
  groups,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  plot: PlotDetail | null;
  groups: PlotGroup[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
}) => {
  const [form, setForm] = useState<FormState>({
    name: '', shape: '', plotType: '', complexity: '', radius: '', length: '', width: '', isComplete: false, groupUid: NO_GROUP,
  });

  useEffect(() => {
    if (plot && open) setForm(toForm(plot));
  }, [plot, open]);

  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Only the size a shape actually uses is shown. A polygon has no typed size at
  // all: its size comes from the boundary drawn on the map or uploaded as a file.
  const isCircle = form.shape === 'circle';
  const isRectangle = form.shape === 'rectangle';

  const handleSave = () => {
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
    // Membership is only sent when it actually changed, so an ordinary edit does
    // not rewrite the group link.
    const groupChanged = form.groupUid !== (plot?.group?.uid || NO_GROUP);
    onSave({
      name: form.name,
      shape: form.shape || undefined,
      plotType: form.plotType || undefined,
      complexity: form.complexity || undefined,
      // A size the shape does not use is cleared rather than left behind, so the
      // plot never carries two contradictory sizes.
      radius: isCircle ? num(form.radius) : null,
      length: isRectangle ? num(form.length) : null,
      width: isRectangle ? num(form.width) : null,
      isComplete: form.isComplete,
      ...(groupChanged && { groupUid: form.groupUid === NO_GROUP ? null : form.groupUid }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit plot</DialogTitle>
          <DialogDescription>Update the details of this monitoring plot.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="plot-name">Name</Label>
            <Input id="plot-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Shape</Label>
              <Select value={form.shape} onValueChange={(v) => set('shape', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plot-complexity">Complexity</Label>
              <Input id="plot-complexity" value={form.complexity} onChange={(e) => set('complexity', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plot-type">Plot type</Label>
            <Input id="plot-type" value={form.plotType} onChange={(e) => set('plotType', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Group</Label>
            <Select value={form.groupUid} onValueChange={(v) => set('groupUid', v)}>
              <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP}>No group</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.uid} value={g.uid}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10.5px] text-muted-foreground">
              {groups.length === 0
                ? 'No groups yet. Create one from Manage groups on the plot list.'
                : 'A plot belongs to one group at a time.'}
            </p>
          </div>

          {isCircle && (
            <div className="space-y-1.5">
              <Label htmlFor="plot-radius">Radius (m)</Label>
              <Input id="plot-radius" type="number" min={0} value={form.radius} onChange={(e) => set('radius', e.target.value)} />
            </div>
          )}

          {isRectangle && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plot-length">Length (m)</Label>
                <Input id="plot-length" type="number" min={0} value={form.length} onChange={(e) => set('length', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plot-width">Width (m)</Label>
                <Input id="plot-width" type="number" min={0} value={form.width} onChange={(e) => set('width', e.target.value)} />
              </div>
            </div>
          )}

          {form.shape === 'polygon' && (
            <p className="text-[11px] text-muted-foreground">
              A polygon plot has no typed size. Its area is measured from the boundary.
            </p>
          )}

          {plot?.shape && form.shape !== plot.shape && (
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              Changing the shape clears the size the old shape used, and the boundary
              on the map stays as it was drawn.
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <Label htmlFor="plot-complete">Mark as complete</Label>
            <Switch id="plot-complete" checked={form.isComplete} onCheckedChange={(v) => set('isComplete', v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlotModal;
