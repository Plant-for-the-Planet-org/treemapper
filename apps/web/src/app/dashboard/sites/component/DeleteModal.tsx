import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteModalProps {
  isOpen: boolean
  site: { name?: string } | null
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteModal = ({ isOpen, site, onConfirm, onCancel }: DeleteModalProps) => (
  <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
    <DialogContent showCloseButton={false} className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <DialogTitle className="text-red-900">Delete Site</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to delete <strong>"{site?.name}"</strong>? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete Site
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
