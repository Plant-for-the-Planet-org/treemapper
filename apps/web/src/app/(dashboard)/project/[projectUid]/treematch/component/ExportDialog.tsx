'use client'

import { FileSpreadsheet, Layers } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MockIntervention, MockContribution, fmtNum, donorLabel } from './mockData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interventions: MockIntervention[];
  contributions: MockContribution[];
}

const toCsv = (headers: string[], rows: (string | number)[][]) =>
  [headers.join(','), ...rows.map(r => r.map(cell => {
    const s = String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','))].join('\n');

const download = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export function ExportDialog({ open, onOpenChange, interventions, contributions }: Props) {
  const locRows = interventions
    .filter(i => i.totalTrees - i.matchedTrees > 0)
    .map(i => [i.hid, i.siteName, i.type, i.plantingDate.slice(0, 10), i.totalTrees, i.totalTrees - i.matchedTrees]);
  const locCsv = toCsv(['hid', 'site', 'type', 'plantingDate', 'totalTrees', 'availableTrees'], locRows);

  const donRows = contributions
    .filter(c => !c.ignored && c.units - c.allocated > 0)
    .map(c => [c.uid, donorLabel(c.donor), c.country, c.payout, c.units, c.allocated, c.units - c.allocated, c.date.slice(0, 10)]);
  const donCsv = toCsv(['projectContributionId', 'donor', 'country', 'payout', 'units', 'allocated', 'unitsToMatch', 'paymentDate'], donRows);

  const downloadTwoFiles = () => {
    download('treematch-plant-locations.csv', locCsv);
    download('treematch-donations.csv', donCsv);
  };
  const downloadOneFile = () => {
    download('treematch-export.csv', `# Plant locations\n${locCsv}\n\n# Donations\n${donCsv}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export records</DialogTitle>
          <DialogDescription>
            Export the unmatched records from both sides for offline review or reconciliation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm font-medium text-foreground">Plant locations</div>
            <div className="text-xs text-muted-foreground mt-0.5">{fmtNum(locRows.length)} with available trees</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm font-medium text-foreground">Donations</div>
            <div className="text-xs text-muted-foreground mt-0.5">{fmtNum(donRows.length)} unmatched (paid)</div>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={downloadOneFile}>
            <Layers size={14} /> Download one file, two sheets
          </Button>
          <Button variant="outline" className="w-full" onClick={downloadTwoFiles}>
            <FileSpreadsheet size={14} /> Download two files
          </Button>
          <p className="text-[11px] text-muted-foreground">
            The real build exports an .xlsx with two sheets (plant locations + donations). This dummy downloads CSV.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
