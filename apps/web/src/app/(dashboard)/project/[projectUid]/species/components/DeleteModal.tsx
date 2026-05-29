import { AlertCircle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from './Modal'

export const DeleteModal = ({
  showConfirmModal,
  setShowConfirmModal,
  selectedSpecies,
  isRemoving,
  handleDelete,
}: any) => (
  <Modal
    isOpen={showConfirmModal}
    onClose={() => setShowConfirmModal(false)}
    title="Delete Species"
    size="small"
  >
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle size={24} className="text-destructive" />
      </div>
      <div>
        <h3 className="text-base font-medium mb-1">Remove Species</h3>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <strong className="italic text-foreground">
            {selectedSpecies?.scientificName || selectedSpecies?.speciesName}
          </strong>{' '}
          from this project? This action cannot be undone.
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)} disabled={isRemoving} className="h-8">
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isRemoving} className="h-8 gap-1.5">
          {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          {isRemoving ? 'Removing...' : 'Yes, Remove'}
        </Button>
      </div>
    </div>
  </Modal>
)
