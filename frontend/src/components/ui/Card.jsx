// File: Card.jsx
// Path: frontend/src/components/ui/Card.jsx

import React from 'react';

/**
 * Card Component - การ์ดพื้นฐานที่ใช้แสดงเนื้อหาต่างๆ
 * รองรับหลายรูปแบบและ interactive effects
 */
const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  rounded = 'xl',
  hover = false,
  interactive = false,
  gradient = false,
  className = '',
  onClick,
  ...props
}) => {
  // Base styles
  const baseStyles = `
    relative bg-white border border-gray-100
    transition-all duration-300 ease-in-out
    ${interactive || onClick ? 'cursor-pointer' : ''}
  `;

  // Variant styles - รูปแบบการ์ดต่างๆ
  const variantStyles = {
    default: `
      bg-white border-gray-100
    `,
    elevated: `
      bg-white border-gray-200
      shadow-lg
    `,
    glass: `
      bg-white/80 backdrop-blur-md
      border-white/20
    `,
    red: `
      bg-gradient-to-br from-red-50 to-red-100
      border-red-200
    `,
    blue: `
      bg-gradient-to-br from-blue-50 to-blue-100
      border-blue-200
    `,
    green: `
      bg-gradient-to-br from-emerald-50 to-emerald-100
      border-emerald-200
    `,
    yellow: `
      bg-gradient-to-br from-amber-50 to-amber-100
      border-amber-200
    `,
    pink: `
      bg-gradient-to-br from-pink-50 to-pink-100
      border-pink-200
    `,
    dark: `
      bg-gray-800 border-gray-700
      text-white
    `,
    gradient: `
      bg-gradient-to-br from-green-800 via-green-900 to-blue-900
      border-0 text-dark-900
    `
  };

  // Padding styles
  const paddingStyles = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  // Shadow styles
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    red: 'shadow-lg shadow-red-500/10',
    blue: 'shadow-lg shadow-blue-500/10',
    colored: variant === 'gradient' ? 'shadow-xl shadow-red-500/25' : 'shadow-md'
  };

  // Rounded styles
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full'
  };

  // Hover effects
  const hoverStyles = hover || interactive || onClick ? `
    hover:shadow-xl hover:-translate-y-1
    hover:shadow-red-500/20
  ` : '';

  // รวม styles ทั้งหมด
  const cardClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${roundedStyles[rounded]}
    ${hoverStyles}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {/* Gradient overlay สำหรับ interactive cards */}
      {(interactive || onClick) && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 to-red-500/0 hover:from-red-500/5 hover:to-indigo-500/5 transition-all duration-300" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Card Header Component
export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`flex items-center justify-between pb-4 mb-4 border-b border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title Component
export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Content Component
export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`flex items-center justify-between pt-4 mt-4 border-t border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Course Card - รูปแบบพิเศษสำหรับแสดงวิชา
export const CourseCard = ({ 
  title,
  teacher,
  thumbnail,
  progress = 0,
  rating,
  students,
  duration,
  category,
  gradient = 'from-red-500 to-indigo-600',
  className = '',
  onClick,
  ...props 
}) => {
  return (
    <Card
      variant="elevated"
      padding="none"
      hover={true}
      interactive={true}
      className={`overflow-hidden group ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Thumbnail Section */}
      <div className={`h-32 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-16 h-16 rounded-lg object-cover shadow-lg"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {title?.charAt(0) || 'C'}
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs font-medium">
            {category}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
          {title}
        </h3>
        
        {teacher && (
          <p className="text-sm text-gray-600 mb-3">
            โดย {teacher}
          </p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          {duration && (
            <span className="flex items-center">
              ⏱️ {duration}
            </span>
          )}
          {rating && (
            <span className="flex items-center">
              ⭐ {rating}
            </span>
          )}
          {students && (
            <span className="flex items-center">
              👥 {students}
            </span>
          )}
        </div>
        
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>ความก้าวหน้า</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${gradient} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Stats Card - การ์ดแสดงสถิติ
export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'red',
  className = '',
  ...props 
}) => {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    pink: 'from-pink-500 to-pink-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <Card
      variant="elevated"
      padding="md"
      hover={true}
      className={`text-center ${className}`}
      {...props}
    >
      {Icon && (
        <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      )}
      
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </h3>
      
      <p className="text-gray-600 mb-2">
        {title}
      </p>
      
      {trend && (
        <p className={`text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? '↗' : '↘'} {trend.value}%
        </p>
      )}
    </Card>
  );
};

export default Card;