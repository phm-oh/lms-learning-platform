// File: Card.jsx
// Path: frontend/src/components/ui/Card.jsx

import React from 'react';

const Card = ({
  children,
  className = '',
  variant = 'default', // default, glass, outline, gradient-purple, gradient-blue
  hover = true,
  padding = 'p-6',
  onClick,
  ...props
}) => {

  const variants = {
    default: 'bg-white border border-gray-100 shadow-card',
    glass: 'bg-white/70 backdrop-blur-lg border border-white/50 shadow-soft',
    outline: 'bg-transparent border-2 border-gray-200',
    'gradient-purple': 'bg-gradient-to-br from-primary-500 to-primary-700 text-white border-none',
    'gradient-blue': 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none',
    flat: 'bg-gray-50 border-none'
  };

  const hoverEffects = hover && !variant.includes('gradient')
    ? 'hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-100'
    : hover && variant.includes('gradient')
      ? 'hover:shadow-lg hover:-translate-y-1 hover:brightness-110'
      : '';

  return (
    <div
      className={`
        rounded-2xl transition-all duration-300 ease-out
        ${variants[variant] || variants.default}
        ${hoverEffects}
        ${padding}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Sub-components
export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>
);

// Specialized Cards
export const CourseCard = ({ title, instructor, progress, image, category, className = '' }) => (
  <Card className={`group cursor-pointer overflow-hidden p-0 ${className}`} hover>
    <div className="h-40 bg-gray-200 relative overflow-hidden">
      <img src={image || 'https://via.placeholder.com/400x200'} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-primary-600">
        {category}
      </div>
    </div>
    <div className="p-5">
      <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{title}</h4>
      <p className="text-xs text-gray-500 mb-3">{instructor}</p>

      <div className="flex items-center gap-2 text-xs mb-1">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-gray-600 font-medium">{progress}%</span>
      </div>
    </div>
  </Card>
);

export const StatsCard = ({ label, value, icon: Icon, trend, color = 'primary', className = '' }) => {
  const colors = {
    primary: 'text-primary-600 bg-primary-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    pink: 'text-pink-600 bg-pink-50'
  };

  return (
    <Card className={className}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};

export default Card;