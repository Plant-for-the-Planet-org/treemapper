import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Modal } from './Modal'

export const SpeciesRequestModal = ({
  showRequestModal,
  setShowRequestModal,
  requestForm,
  setRequestForm,
  requestLoading,
  handleSubmitRequest,
}: any) => {
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!requestForm.scientificName?.trim()) newErrors.scientificName = 'Scientific name is required'
    if (!requestForm.commonName?.trim()) newErrors.commonName = 'Common name is required'
    if (!requestForm.description?.trim()) newErrors.description = 'Description is required'
    if (!requestForm.requestReason?.trim()) newErrors.requestReason = 'Request reason is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) handleSubmitRequest()
  }

  const handleInputChange = (field: string, value: string) => {
    setRequestForm((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const errClass = (field: string) => errors[field] ? 'border-destructive/40 focus-visible:ring-destructive/30' : ''

  return (
    <Modal
      isOpen={showRequestModal}
      onClose={() => setShowRequestModal(false)}
      title="Request New Species"
      size="default"
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Scientific Name *</Label>
          <Input
            value={requestForm.scientificName || ''}
            onChange={(e) => handleInputChange('scientificName', e.target.value)}
            placeholder="e.g. Acer saccharum"
            className={cn('italic', errClass('scientificName'))}
          />
          {errors.scientificName && <p className="text-xs text-destructive">{errors.scientificName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Common Name *</Label>
          <Input
            value={requestForm.commonName || ''}
            onChange={(e) => handleInputChange('commonName', e.target.value)}
            placeholder="e.g. Sugar Maple"
            className={errClass('commonName')}
          />
          {errors.commonName && <p className="text-xs text-destructive">{errors.commonName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Description *</Label>
          <Textarea
            value={requestForm.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Brief description of the species..."
            className={cn('resize-none', errClass('description'))}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Request Reason *</Label>
          <Textarea
            value={requestForm.requestReason || ''}
            onChange={(e) => handleInputChange('requestReason', e.target.value)}
            rows={3}
            placeholder="Why do you need this species in the database?"
            className={cn('resize-none', errClass('requestReason'))}
          />
          {errors.requestReason && <p className="text-xs text-destructive">{errors.requestReason}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRequestModal(false)} disabled={requestLoading} className="h-8">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={requestLoading} className="h-8 gap-1.5">
            {requestLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {requestLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
