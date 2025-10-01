import { Loader, Save } from "lucide-react";

export const ActionButtons = ({ onSave, isSaving, onCancel }) => {
  return (
    <div className="flex justify-end space-x-4 pt-6">
      <button
        onClick={onCancel}
        className="px-6 py-3 text-stone-600 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all duration-200 font-medium"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-8 py-3 bg-[#007A49] text-white rounded-xl hover:bg-[#006841] disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-semibold shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
      >
        {isSaving ? (
          <>
            <Loader size={18} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} className="mr-2" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
};
