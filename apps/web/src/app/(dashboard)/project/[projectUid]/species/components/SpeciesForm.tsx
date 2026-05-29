import { ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export const SpeciesForm = ({ species, editForm, setEditForm, onImageUpload, isUnknown, isAddingNew }: any) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Scientific Name</Label>
        <Input
          disabled
          value={editForm.scientificName || editForm.speciesName || ''}
          onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
          className="italic"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Common Name</Label>
        <Input
          value={editForm.commonName || ''}
          onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
        />
      </div>
    </div>

    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Description</Label>
      <Textarea
        value={editForm.description || ''}
        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
        rows={3}
        className="resize-none"
      />
    </div>

    {!isUnknown && (
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={editForm.isNativeSpecies || false}
            onCheckedChange={(checked) => setEditForm({ ...editForm, isNativeSpecies: checked })}
          />
          Disable Species
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={editForm.favourite || false}
            onCheckedChange={(checked) => setEditForm({ ...editForm, favourite: checked })}
          />
          Mark Favorite
        </label>
      </div>
    )}

    <div className="space-y-2">
      <Label className="text-xs font-medium">Species Image</Label>
      <div className="flex items-center gap-3">
        {editForm.image && (
          <div className="w-16 h-16 bg-muted/40 rounded-md overflow-hidden border border-border">
            <img
              src={isAddingNew ? editForm.image : `${process.env.NEXT_PUBLIC_CDN}/species/${editForm.image}`}
              alt="Species"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
          <label className="cursor-pointer">
            <ImageIcon size={14} />
            Upload Image
            <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
          </label>
        </Button>
      </div>
    </div>
  </div>
)
