const CustomButton = ({ children, variant = 'default', size = 'default', className = '', disabled = false, ...props }) => {
  const variants = {
    default: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    primary: 'bg-[#007A49] border border-[#007A49] text-white hover:bg-[#005a37] hover:border-[#005a37]',
    ghost: 'text-gray-700 hover:bg-gray-100 border-transparent',
    outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#007A49] focus:ring-offset-2 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;