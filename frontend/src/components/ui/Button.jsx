// File: Button.jsx
// Path: frontend/src/components/ui/Button.jsx

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - ปุ่มพื้นฐานที่ใช้ทั่วทั้งระบบ
 * รองรับหลายรูปแบบและสถานะต่างๆ
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // Base styles ที่ใช้ร่วมกัน
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transform active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    relative overflow-hidden
    ${fullWidth ? 'w-full' : ''}
  `;

  // Variant styles - สีสันตามธีม LearnSync
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-red-500 via-red-550 to-red-500
      text-white border-0
      hover:from-red-600 hover:via-red-700 hover:to-red-800
      hover:shadow-lg hover:shadow-red-500/25
      focus:ring-red-500
      hover:-translate-y-0.5
    `,
    secondary: `
      bg-white text-blue-900 
      border-2 border-blue-900
      hover:bg-blue-600 hover:text-white
      hover:shadow-lg hover:shadow-blue-500/20
      focus:ring-blue-500
      hover:-translate-y-0.5
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-emerald-600
      text-white border-0
      hover:from-emerald-600 hover:to-emerald-700
      hover:shadow-lg hover:shadow-emerald-500/25
      focus:ring-emerald-500
      hover:-translate-y-0.5
    `,
    warning: `
      bg-gradient-to-r from-amber-500 to-amber-600
      text-white border-0
      hover:from-amber-600 hover:to-amber-700
      hover:shadow-lg hover:shadow-amber-500/25
      focus:ring-amber-500
      hover:-translate-y-0.5
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600
      text-white border-0
      hover:from-red-600 hover:to-red-700
      hover:shadow-lg hover:shadow-red-500/25
      focus:ring-red-500
      hover:-translate-y-0.5
    `,
    outline: `
      bg-transparent text-gray-700 
      border-2 border-gray-300
      hover:border-blue-500 hover:text-blue-600
      hover:shadow-md
      focus:ring-blue-500
    `,
    ghost: `
      bg-transparent text-gray-600
      border-0 hover:bg-gray-100
      hover:text-gray-900
      focus:ring-gray-500
    `,
    gradient: `
      bg-gradient-to-r from-pink-500 via-blue-500 to-indigo-500
      text-white border-0
      hover:from-pink-600 hover:via-blue-600 hover:to-indigo-600
      hover:shadow-xl hover:shadow-blue-500/30
      focus:ring-blue-500
      hover:-translate-y-1
      animate-gradient-x
    `
  };

  // Size styles
  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  // รวม styles ทั้งหมด
  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  // จัดการ icon และ loading
  const renderIcon = () => {
    if (loading) {
      return <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />;
    }
    if (Icon) {
      return <Icon size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />;
    }
    return null;
  };

  const iconElement = renderIcon();

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300"></span>
      </span>
      
      {/* Content */}
      <span className="relative flex items-center justify-center space-x-2">
        {iconElement && iconPosition === 'left' && (
          <span className={children ? 'mr-2' : ''}>{iconElement}</span>
        )}
        
        {children && <span>{children}</span>}
        
        {iconElement && iconPosition === 'right' && (
          <span className={children ? 'ml-2' : ''}>{iconElement}</span>
        )}
      </span>
    </button>
  );
};

// รวมเอา common button types ไว้ใช้งานง่าย
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const GradientButton = (props) => <Button variant="gradient" {...props} />;

export default Button;