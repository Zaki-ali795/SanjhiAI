import Icon from './Icon';

const variants = {
  primary: 'bg-teal-emerald text-on-primary hover:opacity-90 shadow-sm',
  secondary: 'bg-transparent border border-deep-navy text-deep-navy hover:bg-surface-container',
  'primary-navy': 'bg-deep-navy text-on-primary hover:bg-primary-container',
  text: 'text-teal-emerald hover:opacity-80',
  disabled: 'bg-surface-variant text-outline opacity-70 cursor-not-allowed',
  danger: 'bg-error text-on-error hover:opacity-90',
};

export default function Button({
  children,
  variant = 'primary',
  icon,
  iconPosition = 'trailing',
  fullWidth = false,
  rounded = 'full',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-4 px-6 text-[14px]',
    lg: 'py-5 px-8 text-base',
  };

  const radiusClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    full: 'rounded-full',
  };

  const effectiveVariant = disabled ? 'disabled' : variant;

  return (
    <button
      className={`font-label font-semibold tracking-[0.02em] inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${variants[effectiveVariant]} ${sizeClasses[size]} ${radiusClasses[rounded]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'leading' && <Icon name={icon} size={18} />}
      {children}
      {icon && iconPosition === 'trailing' && <Icon name={icon} size={18} />}
    </button>
  );
}
