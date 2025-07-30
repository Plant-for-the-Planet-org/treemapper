export const SelectField = ({ label, name, value, onChange, options, validation }) => {
  const hasError = validation?.error;
  
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-2">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 ${
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-stone-300 focus:border-[#007A49] focus:ring-2 focus:ring-[#007A49]/20'
        } focus:outline-none bg-white`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
