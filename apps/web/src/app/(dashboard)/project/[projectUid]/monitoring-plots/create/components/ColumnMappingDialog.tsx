'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ColumnMapping, FieldSpec } from '../utils/csvFields';

const NONE = '__none__';

/**
 * Shown only when a required column could not be found in the uploaded file. A
 * sheet saved from our template auto-maps and never reaches this dialog, so this
 * is the escape hatch for a user's own export rather than the normal path.
 */
const ColumnMappingDialog = ({
  open,
  fields,
  headers,
  initialMapping,
  sampleRows,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  fields: FieldSpec[];
  headers: string[];
  initialMapping: ColumnMapping;
  sampleRows: Record<string, string>[];
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const missing = fields.filter((f) => f.required && !mapping[f.key]);

  const sampleFor = (header: string): string => {
    const values = sampleRows
      .map((r) => (r[header] ?? '').toString().trim())
      .filter(Boolean)
      .slice(0, 2);
    return values.length ? values.join(', ') : 'no sample values';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match your columns</DialogTitle>
          <DialogDescription>
            We could not find every column we need. Point each field at the right
            column in your file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-2 gap-3 items-start">
              <div className="pt-1.5">
                <Label className="text-[12.5px]">
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.hint && (
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">{field.hint}</p>
                )}
              </div>
              <div>
                <Select
                  value={mapping[field.key] ?? NONE}
                  onValueChange={(v) => setMapping((m) => {
                    const next = { ...m };
                    if (v === NONE) delete next[field.key];
                    else next[field.key] = v;
                    return next;
                  })}
                >
                  <SelectTrigger className={!mapping[field.key] && field.required ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Not in my file" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not in my file</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mapping[field.key] && (
                  <p className="text-[10.5px] text-muted-foreground mt-1 truncate">
                    {sampleFor(mapping[field.key])}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {missing.length > 0 && (
          <div className="flex items-start gap-2 text-[12px] text-destructive">
            <AlertCircle className="w-3.5 h-3.5 mt-px flex-none" />
            <span>
              Still needed: {missing.map((f) => f.label).join(', ')}
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(mapping)} disabled={missing.length > 0}>
            Load data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnMappingDialog;
