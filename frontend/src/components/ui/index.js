// File: index.js
// Path: frontend/src/components/ui/index.js

/**
 * UI Components Export Index - Simple Version
 * เฉพาะ export components ไม่มี logic อื่น
 */

// Base Components
export { default as Button } from './Button';
export { 
  PrimaryButton,
  SecondaryButton, 
  SuccessButton,
  WarningButton,
  DangerButton,
  OutlineButton,
  GhostButton,
  GradientButton 
} from './Button';

export { default as Card } from './Card';
export { 
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CourseCard,
  StatsCard 
} from './Card';

export { default as Input } from './Input';
export { 
  SearchInput,
  PasswordInput,
  Textarea,
  FileInput 
} from './Input';

// Layout Components
export { 
  Layout,
  StudentLayout,
  TeacherLayout,
  AdminLayout,
  PublicLayout
} from '../layout';

// Constants only (ไม่ใช้ component references)
export const UI_COMPONENT_VARIANTS = {
  button: ['primary', 'secondary', 'success', 'warning', 'danger', 'outline', 'ghost', 'gradient'],
  card: ['default', 'elevated', 'glass', 'purple', 'blue', 'green', 'yellow', 'pink', 'dark', 'gradient'],
  input: ['default', 'filled', 'outlined', 'glass'],
  sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
  colors: ['purple', 'blue', 'green', 'yellow', 'pink', 'red', 'gray']
};

export const UI_THEME_COLORS = {
  primary: {
    50: '#f3f1ff',
    100: '#ebe5ff',
    200: '#d9ceff',
    300: '#bea6ff',
    400: '#9f75ff',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95'
  },
  gradients: {
    primary: 'from-purple-500 via-purple-600 to-purple-700',
    secondary: 'from-blue-500 to-blue-600',
    success: 'from-emerald-500 to-emerald-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-red-500 to-red-600',
    rainbow: 'from-pink-500 via-purple-500 to-indigo-500'
  }
};

// Component Props Type Definitions (สำหรับ documentation)
export const COMPONENT_PROP_TYPES = {
  Button: {
    variant: 'oneOf(primary, secondary, success, warning, danger, outline, ghost, gradient)',
    size: 'oneOf(xs, sm, md, lg, xl)',
    loading: 'bool',
    disabled: 'bool',
    fullWidth: 'bool',
    icon: 'elementType',
    iconPosition: 'oneOf(left, right)',
    onClick: 'func'
  },
  Card: {
    variant: 'oneOf(default, elevated, glass, purple, blue, green, yellow, pink, dark, gradient)',
    padding: 'oneOf(none, xs, sm, md, lg, xl)',
    shadow: 'oneOf(none, sm, md, lg, xl, purple, blue, colored)',
    rounded: 'oneOf(none, sm, md, lg, xl, 2xl, 3xl, full)',
    hover: 'bool',
    interactive: 'bool',
    onClick: 'func'
  },
  Input: {
    type: 'oneOf(text, email, password, number, tel, url, search, textarea, file)',
    variant: 'oneOf(default, filled, outlined, glass)',
    size: 'oneOf(sm, md, lg)',
    error: 'string',
    success: 'bool',
    disabled: 'bool',
    required: 'bool',
    clearable: 'bool',
    searchable: 'bool',
    icon: 'elementType',
    iconPosition: 'oneOf(left, right)'
  }
};

// Utility Functions (ไม่ใช้ component references)
export const getComponentClasses = (component, variant, size, additionalClasses = '') => {
  const baseClasses = {
    button: 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300',
    card: 'relative bg-white border transition-all duration-300',
    input: 'w-full border rounded-lg transition-all duration-200 focus:outline-none'
  };

  return `${baseClasses[component]} ${additionalClasses}`.trim();
};

export const validateComponentProps = (componentName, props) => {
  const propTypes = COMPONENT_PROP_TYPES[componentName];
  if (!propTypes) {
    console.warn(`Component ${componentName} not found in prop types`);
    return true;
  }

  // Basic validation logic
  for (const [propName, propType] of Object.entries(propTypes)) {
    if (props[propName] !== undefined) {
      if (propType.includes('oneOf') && propType.includes('(')) {
        const validValues = propType.match(/\((.*?)\)/)[1].split(', ');
        if (!validValues.includes(props[propName])) {
          console.warn(`Invalid ${propName} value: ${props[propName]}. Expected one of: ${validValues.join(', ')}`);
        }
      }
    }
  }
  
  return true;
};

// Component Default Props
export const DEFAULT_PROPS = {
  Button: {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
    fullWidth: false,
    iconPosition: 'left'
  },
  Card: {
    variant: 'default',
    padding: 'md',
    shadow: 'md',
    rounded: 'xl',
    hover: false,
    interactive: false
  },
  Input: {
    type: 'text',
    variant: 'default',
    size: 'md',
    disabled: false,
    required: false,
    clearable: false,
    searchable: false,
    iconPosition: 'left'
  }
};

// Version info
export const UI_LIBRARY_VERSION = '1.0.0';
export const UI_LIBRARY_INFO = {
  name: 'LMS UI Components',
  version: UI_LIBRARY_VERSION,
  description: 'ระบบ UI Components สำหรับ Learning Management System',
  author: 'LMS Development Team',
  license: 'MIT',
  repository: 'https://github.com/your-org/lms-frontend',
  lastUpdated: new Date().toISOString()
};