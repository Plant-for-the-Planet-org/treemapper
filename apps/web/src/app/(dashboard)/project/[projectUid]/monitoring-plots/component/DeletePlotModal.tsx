'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DeletePlotModal = ({
  open,
  plotName,
  deleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  plotName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete plot</DialogTitle>
        <DialogDescription>
          Delete <span className="font-medium">{plotName || 'this plot'}</span>? It will be removed from the
          dashboard. This cannot be undone from here.
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

export default DeletePlotModal;
