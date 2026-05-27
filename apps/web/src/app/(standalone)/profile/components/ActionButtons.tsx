import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ActionButtons = ({ onSave, isSaving, onCancel }) => {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <><Loader2 size={14} className="mr-1.5 animate-spin" />Saving...</>
        ) : (
          <><Save size={14} className="mr-1.5" />Save changes</>
        )}
      </Button>
    </div>
  )
}
