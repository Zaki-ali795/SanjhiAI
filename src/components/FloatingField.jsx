import { useState } from 'react';
import Icon from './Icon';

/**
 * FloatingField — input wrapper with animated label and colored icon badge.
 *
 * @param {string} icon     Material Symbol icon name
 * @param {string} theme    Tailwind bg class for the icon badge
 * @param {string} label    Placeholder label text
 * @param {boolean} active  True when the child input has a value
 * @param {string} wrapperClass  Extra classes on the wrapper div
 * @param {ReactNode} trailing   Trailing element (e.g. password toggle)
 */
export default function FloatingField({ icon, theme, label, children, wrapperClass = '', trailing, active = false }) {
  const [focused, setFocused] = useState(false);
  const isLifted = focused || active;

  return (
    <div
      className={`relative ${wrapperClass}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* Icon badge */}
      {icon && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${theme} flex items-center justify-center shadow-md z-10`}>
          <Icon name={icon} className="text-white" size={20} />
        </div>
      )}

      {/* Floating label */}
      <label
        className={`absolute left-12 pointer-events-none transition-all duration-200 ease-out font-label
          ${isLifted
            ? 'top-1 text-[10px] font-semibold tracking-wide'
            : 'top-1/2 -translate-y-1/2 text-[14px]'
          }
          ${focused ? 'text-teal-emerald' : 'text-on-surface-variant'}
        `}
      >
        {label}
      </label>

      {/* Children (input/select) */}
      <div className="relative">
        {children}
        {trailing && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">{trailing}</div>
        )}
      </div>
    </div>
  );
}
