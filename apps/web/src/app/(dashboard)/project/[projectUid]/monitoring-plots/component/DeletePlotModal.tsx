'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DeletePlotModal = ({
  open,
  plotName,
  treeCount,
  observationCount,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  plotName: string;
  treeCount: number;
  observationCount: number;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  // Deleting a plot takes its trees and readings with it, so say so plainly and
  // with the real counts rather than letting someone find out afterwards.
  const parts = [
    treeCount > 0 ? `${treeCount} tree${treeCount === 1 ? '' : 's'}` : null,
    observationCount > 0 ? `${observationCount} observation${observationCount === 1 ? '' : 's'}` : null,
  ].filter(Boolean) as string[];

  return (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete plot</DialogTitle>
        <DialogDescription>
          Delete <span className="font-medium">{plotName || 'this plot'}</span>?
          {parts.length > 0 && (
            <> Its {parts.join(' and ')} will be deleted with it, along with every photo and
            measurement record.</>
          )}
          {' '}This cannot be undone from here.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
};

export default DeletePlotModal;
