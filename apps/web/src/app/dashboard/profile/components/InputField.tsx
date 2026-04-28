import { Check, X } from "lucide-react";

export const InputField = ({ label, name, value, onChange, type = 'text', placeholder, readOnly, validation, ...props }) => {
  const hasError = validation?.error;
  const hasSuccess = validation?.success;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
            readOnly
              ? 'bg-stone-50 text-stone-500 cursor-not-allowed border-stone-200'
              : hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : hasSuccess
              ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
          } focus:outline-none`}
          {...props}
        />
        {readOnly && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs text-stone-400 bg-stone-200 px-2 py-1 rounded">Read-only</span>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <X size={16} className="text-red-500" />
          </div>
        )}
        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check size={16} className="text-green-500" />
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-600 mt-1 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
      {validation?.hint && !hasError && (
        <p className="text-xs text-stone-500 mt-1">{validation.hint}</p>
      )}
    </div>
  );
};
