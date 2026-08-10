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

type FormState = {
  name: string;
  shape: string;
  plotType: string;
  complexity: string;
  radius: string;
  length: string;
  width: string;
  isComplete: boolean;
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
});

const EditPlotModal = ({
  open,
  plot,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  plot: PlotDetail | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
}) => {
  const [form, setForm] = useState<FormState>({
    name: '', shape: '', plotType: '', complexity: '', radius: '', length: '', width: '', isComplete: false,
  });

  useEffect(() => {
    if (plot && open) setForm(toForm(plot));
  }, [plot, open]);

  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
    onSave({
      name: form.name,
      shape: form.shape || undefined,
      plotType: form.plotType || undefined,
      complexity: form.complexity || undefined,
      radius: num(form.radius),
      length: num(form.length),
      width: num(form.width),
      isComplete: form.isComplete,
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plot-radius">Radius (m)</Label>
              <Input id="plot-radius" type="number" min={0} value={form.radius} onChange={(e) => set('radius', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plot-length">Length (m)</Label>
              <Input id="plot-length" type="number" min={0} value={form.length} onChange={(e) => set('length', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plot-width">Width (m)</Label>
              <Input id="plot-width" type="number" min={0} value={form.width} onChange={(e) => set('width', e.target.value)} />
            </div>
          </div>

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
