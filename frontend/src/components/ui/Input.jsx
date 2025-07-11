// File: Input.jsx
// Path: frontend/src/components/ui/Input.jsx

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';

/**
 * Input Component - ช่องกรอกข้อมูลที่รองรับการใช้งานหลากหลาย
 * รองรับ validation, icons, และ interactive states
 */
const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  disabled = false,
  required = false,
  readOnly = false,
  size = 'md',
  variant = 'default',
  icon: Icon = null,
  iconPosition = 'left',
  clearable = false,
  searchable = false,
  loading = false,
  helperText,
  maxLength,
  rows = 4, // สำหรับ textarea
  accept, // สำหรับ file input
  multiple = false, // สำหรับ file input
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');

  // จัดการ controlled vs uncontrolled
  const inputValue = value !== undefined ? value : internalValue;
  const isControlled = value !== undefined;

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    const syntheticEvent = {
      target: { value: '' }
    };
    
    if (!isControlled) {
      setInternalValue('');
    }
    
    if (onChange) {
      onChange(syntheticEvent);
    }
  };

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  // Base styles
  const baseStyles = `
    w-full border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    ${readOnly ? 'cursor-default' : ''}
  `;

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  // Variant styles
  const variantStyles = {
    default: `
      bg-white border-gray-300 text-gray-900
      placeholder-gray-400
      focus:border-purple-500 focus:ring-purple-500/20
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' : ''}
    `,
    filled: `
      bg-gray-50 border-gray-200 text-gray-900
      placeholder-gray-500
      focus:bg-white focus:border-purple-500 focus:ring-purple-500/20
      ${error ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${success ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500/20' : ''}
    `,
    outlined: `
      bg-transparent border-2 border-gray-300 text-gray-900
      placeholder-gray-400
      focus:border-purple-500 focus:ring-purple-500/10
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
      ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10' : ''}
    `,
    glass: `
      bg-white/80 backdrop-blur-sm border border-white/20 text-gray-900
      placeholder-gray-500
      focus:bg-white/90 focus:border-purple-500/50 focus:ring-purple-500/20
    `
  };

  // Icon styles
  const getIconPadding = () => {
    if (!Icon && !searchable && type !== 'password') return '';
    
    const iconSize = size === 'sm' ? 'pl-10' : size === 'lg' ? 'pl-14' : 'pl-12';
    const rightIconSize = size === 'sm' ? 'pr-10' : size === 'lg' ? 'pr-14' : 'pr-12';
    
    if (iconPosition === 'right' || type === 'password' || clearable) {
      return rightIconSize;
    }
    return iconSize;
  };

  // รวม styles
  const inputClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${getIconPadding()}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  // จัดการ input type
  const getInputType = () => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  // Icon component
  const renderIcon = () => {
    const iconSize = size === 'sm' ? 18 : size === 'lg' ? 22 : 20;
    const iconClasses = `absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none`;
    const leftPosition = size === 'sm' ? 'left-3' : 'left-4';
    const rightPosition = size === 'sm' ? 'right-3' : 'right-4';

    if (searchable || Icon) {
      const IconComponent = searchable ? Search : Icon;
      return (
        <IconComponent 
          size={iconSize} 
          className={`${iconClasses} ${iconPosition === 'right' ? rightPosition : leftPosition}`}
        />
      );
    }
    return null;
  };

  // Password toggle
  const renderPasswordToggle = () => {
    if (type !== 'password') return null;
    
    const iconSize = size === 'sm' ? 18 : size === 'lg' ? 22 : 20;
    const rightPosition = size === 'sm' ? 'right-3' : 'right-4';
    
    return (
      <button
        type="button"
        className={`absolute top-1/2 transform -translate-y-1/2 ${rightPosition} text-gray-400 hover:text-gray-600 transition-colors`}
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
      </button>
    );
  };

  // Clear button
  const renderClearButton = () => {
    if (!clearable || !inputValue || type === 'password') return null;
    
    const iconSize = size === 'sm' ? 16 : 18;
    const rightPosition = size === 'sm' ? 'right-3' : 'right-4';
    
    return (
      <button
        type="button"
        className={`absolute top-1/2 transform -translate-y-1/2 ${rightPosition} text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100`}
        onClick={handleClear}
        tabIndex={-1}
      >
        <X size={iconSize} />
      </button>
    );
  };

  // Status icon
  const renderStatusIcon = () => {
    if (!error && !success) return null;
    
    const iconSize = size === 'sm' ? 18 : 20;
    const rightPosition = size === 'sm' ? 'right-3' : 'right-4';
    
    return (
      <div className={`absolute top-1/2 transform -translate-y-1/2 ${rightPosition}`}>
        {error && <AlertCircle size={iconSize} className="text-red-500" />}
        {success && <CheckCircle size={iconSize} className="text-green-500" />}
      </div>
    );
  };

  // Label component
  const renderLabel = () => {
    if (!label) return null;
    
    return (
      <label className={`block text-sm font-medium mb-2 ${error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };

  // Helper text
  const renderHelperText = () => {
    const message = error || helperText;
    if (!message) return null;
    
    return (
      <p className={`mt-2 text-sm ${error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-500'}`}>
        {message}
      </p>
    );
  };

  // Character count
  const renderCharacterCount = () => {
    if (!maxLength) return null;
    
    const currentLength = String(inputValue || '').length;
    const isNearLimit = currentLength > maxLength * 0.8;
    
    return (
      <div className={`mt-1 text-sm text-right ${isNearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
        {currentLength}/{maxLength}
      </div>
    );
  };

  // Render different input types
  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={inputClasses}
          {...props}
        />
      );
    }

    if (type === 'file') {
      return (
        <div className="relative">
          <input
            ref={ref}
            type="file"
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            accept={accept}
            multiple={multiple}
            className="sr-only"
            {...props}
          />
          <label 
            className={`${inputClasses} cursor-pointer flex items-center justify-center space-x-2 ${focused ? 'ring-2' : ''}`}
            htmlFor={props.id}
          >
            <Upload size={20} className="text-gray-400" />
            <span className="text-gray-600">
              {inputValue ? `เลือกไฟล์แล้ว ${inputValue.length} ไฟล์` : placeholder || 'เลือกไฟล์'}
            </span>
          </label>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={getInputType()}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        className={inputClasses}
        {...props}
      />
    );
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {renderLabel()}
      
      <div className="relative">
        {renderInput()}
        {renderIcon()}
        {renderPasswordToggle()}
        {renderClearButton()}
        {renderStatusIcon()}
      </div>
      
      {renderHelperText()}
      {renderCharacterCount()}
    </div>
  );
});

// Set display name for debugging
Input.displayName = 'Input';

// Search Input - wrapper สำหรับการค้นหา
export const SearchInput = (props) => (
  <Input searchable clearable placeholder="ค้นหา..." {...props} />
);

// Password Input - wrapper สำหรับรหัสผ่าน
export const PasswordInput = (props) => (
  <Input type="password" {...props} />
);

// Textarea - wrapper สำหรับข้อความยาว
export const Textarea = (props) => (
  <Input type="textarea" {...props} />
);

// File Input - wrapper สำหรับอัปโหลดไฟล์
export const FileInput = (props) => (
  <Input type="file" {...props} />
);

export default Input;