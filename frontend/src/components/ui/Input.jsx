// File: Input.jsx
// Path: frontend/src/components/ui/Input.jsx

import React from 'react';
import { cn } from '../../lib/utils';
import '../../styles/component.css'; // ดึงสีธีมจาก CSS

// Input Group
export const InputGroup = ({ children, className }) => (
  <div className={cn('flex flex-col gap-1 w-full', className)}>
    {children}
  </div>
);

// Input Label
export const InputLabel = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={cn('text-sm font-medium text-gray-700', className)}>
    {children}
  </label>
);

// Input Error
export const InputError = ({ message, className }) => (
  message ? <p className={cn('text-xs text-red-500 mt-1', className)}>{message}</p> : null
);

// Input Icon Wrapper
export const InputIcon = ({ icon: Icon, position = 'left' }) => (
  Icon ? (
    <span className={cn(
      'absolute inset-y-0 flex items-center text-gray-400 pointer-events-none',
      position === 'left' ? 'left-3' : 'right-3'
    )}>
      <Icon className="w-4 h-4" />
    </span>
  ) : null
);

// Base Input
const Input = React.forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  error,
  success,
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}, ref) => {
  const base = 'block w-full rounded-lg border focus:outline-none transition-all';

  const variantStyle = {
    default: 'bg-white border-gray-300 focus:ring-2 focus:ring-purple-500',
    filled: 'bg-gray-100 border-transparent focus:ring-2 focus:ring-purple-500',
    outlined: 'bg-transparent border-gray-400 focus:ring-2 focus:ring-purple-500',
    glass: 'bg-white/20 backdrop-blur border-white/30 text-white placeholder-white focus:ring-2 focus:ring-white'
  };

  const sizeStyle = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2.5',
    lg: 'text-lg px-5 py-3'
  };

  const stateStyle = error
    ? 'border-red-500 focus:ring-red-500'
    : success
    ? 'border-green-500 focus:ring-green-500'
    : '';

  const iconPadding = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

  return (
    <div className="relative w-full">
      <InputIcon icon={Icon} position={iconPosition} />
      <input
        ref={ref}
        type={type}
        className={cn(base, variantStyle[variant], sizeStyle[size], stateStyle, iconPadding, className)}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

// Extras
export const SearchInput = (props) => (
  <Input {...props} type="search" iconPosition="left" />
);

export const PasswordInput = ({ showToggle, ...props }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative w-full">
      <Input {...props} type={show ? 'text' : 'password'} iconPosition="left" />
      {showToggle && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 inset-y-0 flex items-center text-sm text-gray-500"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      )}
    </div>
  );
};

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'block w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 px-4 py-2 transition-all',
      className
    )}
    {...props}
  />
));

Textarea.displayName = 'Textarea';

export const FileInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="file"
    className={cn(
      'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100',
      className
    )}
    {...props}
  />
));

FileInput.displayName = 'FileInput';
