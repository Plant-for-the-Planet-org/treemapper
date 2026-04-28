import React from 'react';
import { Camera, Check, X, CheckCircle2Icon } from 'lucide-react';
import { FormData } from '../types';

interface ImageUploadProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  formData,
  setFormData,
  fileInputRef
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-pink-600" />
        </div>
        {formData.interventionType === 'single-tree-registration' ? "Tree Image" : "Intervention Image (Optional)"}
        {formData.image ? <CheckCircle2Icon color='#007A49' /> : null}
      </h2>
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Camera className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-700 font-semibold mb-2">Upload an image of the intervention</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
          className="hidden"
          ref={fileInputRef}
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="inline-flex items-center px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Camera className="w-4 h-4 mr-2" />
          Choose Image
        </label>
        <p className="text-xs text-slate-500 mt-3">
          Supports JPG, PNG, WebP formats
        </p>
      </div>

      {formData.image && (
        <div className="mt-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">
              {formData.image.name}
            </span>
            <span className="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              {(formData.image.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, image: null }))
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="ml-auto text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
