import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { components } from '../../config/designSystem';

/**
 * Modern Input Component with enhanced styling and features
 */
export const Input = forwardRef(({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onClear,
  error,
  success,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  const getInputClass = () => {
    if (error) return components.input.error;
    if (success) return components.input.success;
    return components.input.base;
  };

  const hasValue = value && value.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-theme-text-secondary mb-2">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left Icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-tertiary pointer-events-none">
            <Icon size={18} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            ${getInputClass()}
            ${Icon && iconPosition === 'left' ? 'pl-12' : ''}
            ${(isPassword || onClear || success || error) ? 'pr-12' : ''}
            ${Icon && iconPosition === 'right' && !isPassword ? 'pr-12' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {/* Right side elements */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Clear button */}
          {onClear && hasValue && !disabled && (
            <motion.button
              type="button"
              onClick={onClear}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="p-1 rounded-full hover:bg-theme-bg-tertiary/60 text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
            >
              <X size={16} />
            </motion.button>
          )}

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded-full hover:bg-theme-bg-tertiary/60 text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {/* Status icons */}
          {error && !isPassword && (
            <AlertCircle size={18} className="text-rose-400" />
          )}
          {success && !isPassword && (
            <CheckCircle size={18} className="text-emerald-400" />
          )}

          {/* Right Icon */}
          {Icon && iconPosition === 'right' && !isPassword && !error && !success && (
            <Icon size={18} className="text-theme-text-tertiary" />
          )}
        </div>
      </div>

      {/* Helper/Error text */}
      <AnimatePresence>
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`mt-2 text-sm ${error ? 'text-rose-400' : 'text-theme-text-tertiary'}`}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Search Input with clear functionality
 */
export const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Cerca...',
  className = '',
  ...props
}) => (
  <Input
    type="text"
    value={value}
    onChange={onChange}
    onClear={onClear}
    placeholder={placeholder}
    icon={Search}
    iconPosition="left"
    className={className}
    {...props}
  />
);

/**
 * TextArea with modern styling
 */
export const TextArea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  showCount = false,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value?.length || 0;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-theme-text-secondary mb-2">
          {label}
          {required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}

      {/* TextArea */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          ${error ? components.input.error : components.input.base}
          resize-none
        `}
        {...props}
      />

      {/* Footer */}
      <div className="flex justify-between mt-2">
        {/* Error/Helper text */}
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-rose-400' : 'text-theme-text-tertiary'}`}>
            {error || helperText}
          </p>
        )}
        
        {/* Character count */}
        {showCount && maxLength && (
          <p className={`text-xs ml-auto ${charCount >= maxLength ? 'text-rose-400' : 'text-theme-text-tertiary'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

/**
 * Select dropdown with modern styling
 */
export const Select = forwardRef(({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleziona...',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => (
  <div className={className}>
    {/* Label */}
    {label && (
      <label className="block text-sm font-medium text-theme-text-secondary mb-2">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
    )}

    {/* Select */}
    <select
      ref={ref}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`
        ${error ? components.input.error : components.input.base}
        cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')]
        bg-[length:20px] bg-[right_12px_center] bg-no-repeat
        pr-10
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>

    {/* Error/Helper text */}
    {(error || helperText) && (
      <p className={`mt-2 text-sm ${error ? 'text-rose-400' : 'text-theme-text-tertiary'}`}>
        {error || helperText}
      </p>
    )}
  </div>
));

Select.displayName = 'Select';

/**
 * Checkbox with modern styling
 */
export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => (
  <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div className={`
        w-5 h-5 rounded-md border-2 transition-all duration-200
        border-theme peer-checked:border-blue-500 peer-checked:bg-blue-500
        peer-focus:ring-4 peer-focus:ring-blue-500/20
        flex items-center justify-center
      `}>
        <motion.svg
          initial={false}
          animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          className="w-3 h-3 text-white"
          viewBox="0 0 12 10"
          fill="none"
        >
          <path
            d="M1 5L4.5 8.5L11 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
    </div>
    {label && <span className="text-sm text-theme-text-primary">{label}</span>}
  </label>
);

/**
 * Toggle switch with modern styling
 */
export const Toggle = ({
  label,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: { track: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={`
          ${sizeConfig.track} rounded-full transition-all duration-200
          bg-theme-bg-tertiary peer-checked:bg-blue-500
          peer-focus:ring-4 peer-focus:ring-blue-500/20
        `} />
        <div className={`
          absolute left-0.5 top-0.5
          ${sizeConfig.thumb} rounded-full bg-white shadow-md
          transition-transform duration-200 ease-out
          peer-checked:${sizeConfig.translate}
        `} />
      </div>
      {label && <span className="text-sm text-theme-text-primary">{label}</span>}
    </label>
  );
};

export default Input;
