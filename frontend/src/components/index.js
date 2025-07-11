// File: index.js
// Path: frontend/src/components/index.js

/**
 * Main Components Export Index
 * ไฟล์หลักสำหรับ export components ทั้งหมดในระบบ
 * ใช้สำหรับ import components จากที่เดียว
 */

// File: index.js
// Path: frontend/src/components/index.js

/**
 * Main Components Export Index
 * ไฟล์หลักสำหรับ export components ทั้งหมดในระบบ
 * ใช้สำหรับ import components จากที่เดียว
 */

// Re-export ทุกอย่างจาก UI Components
export * from './ui';

// Re-export ทุกอย่างจาก Layout Components  
export * from './layout';

// Examples & Documentation Components
export { default as ComponentShowcase } from './examples/ComponentShowcase';

// Form Components (จะเพิ่มในอนาคต)
// export * from './forms';

// Chart Components (จะเพิ่มในอนาคต)  
// export * from './charts';

// Course-specific Components (จะเพิ่มในอนาคต)
// export * from './course';

// Quiz Components (จะเพิ่มในอนาคต)
// export * from './quiz';

// Admin Components (จะเพิ่มในอนาคต)
// export * from './admin';

// Common Components (จะเพิ่มในอนาคต)
// export * from './common';

// ===== COMPONENT COLLECTIONS ===== //

// Collection สำหรับ UI Components (ใช้ string reference)
export const UIComponents = {
  // Buttons
  Button: 'Button',
  PrimaryButton: 'PrimaryButton',
  SecondaryButton: 'SecondaryButton',
  SuccessButton: 'SuccessButton',
  WarningButton: 'WarningButton',
  DangerButton: 'DangerButton',
  OutlineButton: 'OutlineButton',
  GhostButton: 'GhostButton',
  GradientButton: 'GradientButton',
  
  // Cards
  Card: 'Card',
  CardHeader: 'CardHeader',
  CardTitle: 'CardTitle',
  CardContent: 'CardContent',
  CardFooter: 'CardFooter',
  CourseCard: 'CourseCard',
  StatsCard: 'StatsCard',
  
  // Inputs
  Input: 'Input',
  SearchInput: 'SearchInput',
  PasswordInput: 'PasswordInput',
  Textarea: 'Textarea',
  FileInput: 'FileInput'
};

// Collection สำหรับ Layout Components (ใช้ string reference แทน)
export const LayoutComponents = {
  Layout: 'Layout',
  StudentLayout: 'StudentLayout',
  TeacherLayout: 'TeacherLayout',
  AdminLayout: 'AdminLayout',
  PublicLayout: 'PublicLayout'
};

// Collection สำหรับ Example Components (ใช้ string reference)
export const ExampleComponents = {
  ComponentShowcase: 'ComponentShowcase'
};

// ===== UTILITY EXPORTS ===== //

// Re-export utilities จาก UI
export {
  UI_COMPONENT_VARIANTS,
  UI_THEME_COLORS,
  COMPONENT_PROP_TYPES,
  DEFAULT_PROPS,
  getComponentClasses,
  validateComponentProps,
  UI_LIBRARY_VERSION,
  UI_LIBRARY_INFO
} from './ui';

// Re-export utilities จาก Layout
export {
  LAYOUT_BREAKPOINTS,
  SIDEBAR_WIDTH,
  HEADER_HEIGHT,
  LAYOUT_Z_INDEX,
  USER_ROLES,
  LAYOUT_THEMES,
  getLayoutClasses,
  getMenuItems,
  validateUserRole,
  LAYOUT_ACTIONS,
  DEFAULT_LAYOUT_PROPS,
  LAYOUT_CONFIG,
  LAYOUT_VERSION,
  LAYOUT_INFO
} from './layout';

// ===== COMPONENT REGISTRY ===== //

// Registry สำหรับ dynamic component loading (ใช้ lazy loading แทน)
export const COMPONENT_REGISTRY = {
  // UI Components
  'Button': 'Button',
  'Card': 'Card',
  'Input': 'Input',
  'Layout': 'Layout',
  'ComponentShowcase': 'ComponentShowcase',
  
  // Variants
  'PrimaryButton': 'PrimaryButton',
  'SecondaryButton': 'SecondaryButton',
  'CourseCard': 'CourseCard',
  'StatsCard': 'StatsCard',
  'SearchInput': 'SearchInput',
  'PasswordInput': 'PasswordInput',
  
  // Layouts
  'StudentLayout': 'StudentLayout',
  'TeacherLayout': 'TeacherLayout',
  'AdminLayout': 'AdminLayout',
  'PublicLayout': 'PublicLayout'
};

// ===== COMPONENT CATEGORIES ===== //

export const COMPONENT_CATEGORIES = {
  BASIC: ['Button', 'Card', 'Input'],
  LAYOUT: ['Layout', 'StudentLayout', 'TeacherLayout', 'AdminLayout'],
  FORMS: ['Input', 'SearchInput', 'PasswordInput', 'Textarea', 'FileInput'],
  DISPLAY: ['Card', 'CourseCard', 'StatsCard'],
  NAVIGATION: ['Layout'],
  EXAMPLES: ['ComponentShowcase']
};

// ===== THEME INTEGRATION ===== //

export const THEME_INTEGRATION = {
  colors: 'UI_THEME_COLORS', // string reference
  breakpoints: 'LAYOUT_BREAKPOINTS', // string reference  
  zIndex: 'LAYOUT_Z_INDEX', // string reference
  sizing: {
    sidebar: 'SIDEBAR_WIDTH', // string reference
    header: 'HEADER_HEIGHT' // string reference
  },
  variants: 'UI_COMPONENT_VARIANTS' // string reference
};

// ===== VALIDATION HELPERS ===== //

export const validateComponent = (componentName, props = {}) => {
  if (!COMPONENT_REGISTRY[componentName]) {
    console.warn(`Component '${componentName}' not found in registry`);
    return false;
  }
  
  // ตรวจสอบ props ถ้ามี
  // จะ implement ตอน component ถูก import
  console.log(`Validating component '${componentName}' with props:`, props);
  
  return true;
};

export const getComponent = (componentName) => {
  // เนื่องจาก registry ใช้ string reference แทน component reference
  // ในการใช้งานจริงควร dynamic import component
  const componentString = COMPONENT_REGISTRY[componentName];
  if (componentString) {
    console.log(`Component '${componentName}' exists in registry`);
    return componentString;
  }
  return null;
};

export const getComponentsByCategory = (category) => {
  const components = COMPONENT_CATEGORIES[category] || [];
  return components.reduce((acc, componentName) => {
    const component = getComponent(componentName);
    if (component) {
      acc[componentName] = component;
    }
    return acc;
  }, {});
};

// ===== DEVELOPMENT HELPERS ===== //

export const DEV_TOOLS = {
  listAllComponents: () => {
    return Object.keys(COMPONENT_REGISTRY);
  },
  
  getComponentInfo: (componentName) => {
    const component = getComponent(componentName);
    if (!component) return null;
    
    return {
      name: componentName,
      exists: !!component,
      type: 'string_reference', // เนื่องจากใช้ string reference
      category: Object.keys(COMPONENT_CATEGORIES).find(cat => 
        COMPONENT_CATEGORIES[cat].includes(componentName)
      )
    };
  },
  
  validateAllComponents: () => {
    const results = {};
    Object.keys(COMPONENT_REGISTRY).forEach(name => {
      results[name] = validateComponent(name);
    });
    return results;
  }
};

// ===== VERSION INFO ===== //

export const COMPONENT_SYSTEM_INFO = {
  name: 'LMS Component System',
  version: '1.0.0',
  description: 'Complete component system for Learning Management System',
  components: {
    ui: 'UI Components Library',
    layout: 'Layout Components Library'
  },
  totalComponents: Object.keys(COMPONENT_REGISTRY).length,
  categories: Object.keys(COMPONENT_CATEGORIES).length,
  lastUpdated: new Date().toISOString(),
  author: 'LMS Development Team',
  license: 'MIT'
};

// ===== QUICK ACCESS EXPORTS ===== //

// สำหรับการใช้งานที่พบบ่อย - ไม่ต้อง export อีกแล้วเพราะมี * export ข้างบน
// export {
//   Button,
//   Card,
//   Input,
//   Layout
// } from './ui';

// Default export สำหรับ convenience (ใช้ string reference)
export default {
  // UI Components (string references)
  Button: 'Button',
  Card: 'Card', 
  Input: 'Input',
  Layout: 'Layout',
  StudentLayout: 'StudentLayout', 
  TeacherLayout: 'TeacherLayout',
  AdminLayout: 'AdminLayout',
  PublicLayout: 'PublicLayout',
  ComponentShowcase: 'ComponentShowcase',
  
  // Utilities
  THEME_INTEGRATION,
  COMPONENT_REGISTRY,
  COMPONENT_CATEGORIES,
  validateComponent,
  getComponent,
  getComponentsByCategory,
  DEV_TOOLS,
  COMPONENT_SYSTEM_INFO
};