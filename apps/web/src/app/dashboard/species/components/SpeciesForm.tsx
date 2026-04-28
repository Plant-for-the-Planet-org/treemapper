import { ImageIcon } from "lucide-react";

export const SpeciesForm = ({ species, editForm, setEditForm, onImageUpload, isUnknown, isAddingNew }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Scientific Name
        </label>
        <input
          type="text"
          disabled
          value={editForm.scientificName || editForm.speciesName || ''}
          onChange={(e) => setEditForm({ ...editForm, scientificName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none italic"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Common Name
        </label>
        <input
          type="text"
          value={editForm.commonName || ''}
          onChange={(e) => setEditForm({ ...editForm, commonName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        value={editForm.description || ''}
        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
      />
    </div>

    {/* <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Habitat
        </label>
        <input
          type="text"
          value={editForm.habitat || ''}
          onChange={(e) => setEditForm({ ...editForm, habitat: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Height
        </label>
        <input
          type="text"
          value={editForm.height || ''}
          onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Flowers/Fruits
        </label>
        <input
          type="text"
          value={editForm.hasFlowersOrFruits || ''}
          onChange={(e) => setEditForm({ ...editForm, hasFlowersOrFruits: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Blooming Season
        </label>
        <input
          type="text"
          value={editForm.bloomingSeason || ''}
          onChange={(e) => setEditForm({ ...editForm, bloomingSeason: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
        />
      </div>
    </div> */}

    {!isUnknown && (
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.isNativeSpecies || false}
            onChange={(e) => setEditForm({ ...editForm, isNativeSpecies: e.target.checked })}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Disable Species
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editForm.favourite || false}
            onChange={(e) => setEditForm({ ...editForm, favourite: e.target.checked })}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Mark Favorite
        </label>
      </div>
    )}

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Species Image
      </label>
      <div className="flex items-center gap-4">
        {editForm.image && (
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
            <img src={isAddingNew ? editForm.image : `${process.env.NEXT_PUBLIC_CDN}/species/${editForm.image}`} alt="Species" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm">
          <ImageIcon size={14} />
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  </div>
);