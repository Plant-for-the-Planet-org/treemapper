export const TextareaField = ({ label, name, value, onChange, rows = 4, placeholder, validation }) => {
  const hasError = validation?.error;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-300 ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
        } focus:outline-none`}
      />
      {hasError && (
        <p className="text-xs text-red-600 mt-1 animate-in slide-in-from-top-1 duration-200">
          {validation.error}
        </p>
      )}
    </div>
  );
};