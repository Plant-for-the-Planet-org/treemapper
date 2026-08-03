'use client'

import { FileSpreadsheet, Layers } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  TreeMatchIntervention, Contribution, fmtNum, availableTrees, contribAvailable, toMajorAmount,
} from './types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interventions: TreeMatchIntervention[];
  contributions: Contribution[];
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
    .filter(i => availableTrees(i) > 0)
    .map(i => [i.hid, i.siteName, i.type, i.interventionStartDate.slice(0, 10), i.totalTreeCount, availableTrees(i)]);
  const locCsv = toCsv(['hid', 'site', 'type', 'interventionStartDate', 'totalTreeCount', 'availableTrees'], locRows);

  const donRows = contributions
    .filter(c => !c.ignored && contribAvailable(c) > 0)
    .map(c => [
      c.id, c.donation.uid,
      c.unitType, c.units, c.unitsAllocated, contribAvailable(c),
      // The CSV carries the real amount, not TTC's minor-unit integer.
      c.donation.paymentDate.slice(0, 10), toMajorAmount(c.donation.amount), c.donation.currency ?? '',
    ]);
  const donCsv = toCsv(
    ['contributionId', 'donationRef', 'unitType',
      'units', 'unitsAllocated', 'available', 'paymentDate', 'amount', 'currency'],
    donRows,
  );

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
            Covers the records loaded in the lists, so use Load more first if you need older pages.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
