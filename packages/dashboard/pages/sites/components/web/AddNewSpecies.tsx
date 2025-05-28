import React, { useState, useEffect } from 'react';
import { X, Upload, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

const SpeciesModal = ({ isOpen, onClose, onSave, editingSpecies = null }) => {
  const [formData, setFormData] = useState({
    scientificName: '',
    localName: '',
    imageUrl: '',
    favorite: false,
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Reset form when modal opens/closes or when editing different species
  useEffect(() => {
    if (isOpen) {
      if (editingSpecies) {
        setFormData({
          scientificName: editingSpecies.scientificName || '',
          localName: editingSpecies.localName || '',
          imageUrl: editingSpecies.imageUrl || '',
          favorite: editingSpecies.favorite || false,
        });
        setImagePreview(editingSpecies.imageUrl || '');
        setIsEditing(true);
      } else {
        // Reset form for new species
        setFormData({
          scientificName: '',
          localName: '',
          imageUrl: '',
          favorite: false,
        });
        setImagePreview('');
        setIsEditing(false);
      }
    }
  }, [isOpen, editingSpecies]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({
          ...formData,
          imageUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newSpecies = {
      ...formData,
      lastUpdated: new Date().toISOString(),
    };
    
    if (isEditing && editingSpecies) {
      // Keep the original ID when editing
      newSpecies.id = editingSpecies.id;
    } else {
      // Generate a temporary ID for new species
      // In a real application, this would likely come from your backend
      newSpecies.id = Date.now();
    }
    
    onSave(newSpecies);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop - only visible on smaller screens */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 md:bg-opacity-30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Side panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="absolute top-0 right-0 bottom-0 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-xl overflow-auto"
      >
        <div className="sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing ? 'Edit Species' : 'Add New Species'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Scientific Name
              </label>
              <input
                type="text"
                name="scientificName"
                value={formData.scientificName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none italic"
                placeholder="e.g. Quercus robur"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Local Name
              </label>
              <input
                type="text"
                name="localName"
                value={formData.localName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none"
                placeholder="e.g. English Oak"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Image (Optional)
              </label>
              <div className="mt-1 flex flex-col items-center">
                <div className="h-44 w-full bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Leaf size={56} className="text-green-500" />
                  )}
                </div>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-xl flex items-center gap-2 text-gray-700 transition-colors">
                  <Upload size={16} />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="favorite"
                name="favorite"
                checked={formData.favorite}
                onChange={handleChange}
                className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label htmlFor="favorite" className="ml-2 text-sm text-gray-700">
                Add to Favorites
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              {isEditing ? 'Update' : 'Add'} Species
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SpeciesModal;