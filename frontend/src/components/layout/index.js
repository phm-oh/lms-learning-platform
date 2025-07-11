// File: index.js
// Path: frontend/src/components/layout/index.js

/**
 * Layout Components Export Index (Simplified)
 * เฉพาะ export components ไม่มี logic อื่น
 */

// Export Layout components
export { default as Layout } from './Layout';
export { 
  StudentLayout,
  TeacherLayout, 
  AdminLayout,
  PublicLayout 
} from './Layout';

// Constants only (ไม่ใช้ components)
export const LAYOUT_BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px', 
  desktop: '1024px',
  wide: '1280px'
};

export const SIDEBAR_WIDTH = {
  expanded: '256px',    
  collapsed: '80px',    
  mobile: '100%'
};

export const HEADER_HEIGHT = {
  desktop: '64px',      
  mobile: '56px'        
};

export const LAYOUT_Z_INDEX = {
  header: 40,
  sidebar: 30,
  overlay: 30,
  modal: 50,
  dropdown: 45,
  toast: 60
};

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher', 
  ADMIN: 'admin',
  GUEST: 'guest'
};

export const LAYOUT_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

export const LAYOUT_ACTIONS = {
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME',
  SET_USER: 'SET_USER',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  TOGGLE_MOBILE_MENU: 'TOGGLE_MOBILE_MENU'
};

export const DEFAULT_LAYOUT_PROPS = {
  userRole: USER_ROLES.STUDENT,
  showSidebar: true,
  sidebarCollapsed: false,
  theme: LAYOUT_THEMES.LIGHT,
  user: null,
  notifications: 0
};

export const LAYOUT_CONFIG = {
  animationDuration: 300,
  debounceResize: 250,
  sidebarBreakpoint: 1024,
  mobileBreakpoint: 768,
  enableAnimations: true,
  enableTransitions: true,
  enableBackdrop: true
};

// Utility Functions (ไม่ใช้ component references)
export const getLayoutClasses = (role, collapsed = false, mobile = false) => {
  const baseClasses = 'min-h-screen transition-all duration-300';
  const marginClasses = collapsed 
    ? 'lg:ml-20' 
    : 'lg:ml-64';
  const mobileClasses = mobile 
    ? 'ml-0' 
    : marginClasses;
    
  return `${baseClasses} ${mobileClasses}`;
};

export const getMenuItems = (role) => {
  const menuConfig = {
    [USER_ROLES.STUDENT]: [
      { icon: 'Home', label: 'แดชบอร์ด', path: '/dashboard' },
      { icon: 'BookOpen', label: 'วิชาของฉัน', path: '/my-courses' },
      { icon: 'Award', label: 'แบบทดสอบ', path: '/quizzes' },
      { icon: 'BarChart3', label: 'ความก้าวหน้า', path: '/progress' },
      { icon: 'FileText', label: 'ข่าวสาร', path: '/news' }
    ],
    [USER_ROLES.TEACHER]: [
      { icon: 'Home', label: 'แดชบอร์ด', path: '/teacher/dashboard' },
      { icon: 'BookOpen', label: 'จัดการวิชา', path: '/teacher/courses' },
      { icon: 'Users', label: 'นักเรียน', path: '/teacher/students' },
      { icon: 'Award', label: 'แบบทดสอบ', path: '/teacher/quizzes' },
      { icon: 'BarChart3', label: 'รายงาน', path: '/teacher/analytics' },
      { icon: 'MessageSquare', label: 'ข่าวสาร', path: '/teacher/news' }
    ],
    [USER_ROLES.ADMIN]: [
      { icon: 'Home', label: 'แดชบอร์ด', path: '/admin/dashboard' },
      { icon: 'Users', label: 'จัดการผู้ใช้', path: '/admin/users' },
      { icon: 'BookOpen', label: 'จัดการวิชา', path: '/admin/courses' },
      { icon: 'BarChart3', label: 'รายงานระบบ', path: '/admin/analytics' },
      { icon: 'Settings', label: 'ตั้งค่าระบบ', path: '/admin/settings' },
      { icon: 'MessageSquare', label: 'จัดการข่าว', path: '/admin/news' }
    ]
  };
  
  return menuConfig[role] || menuConfig[USER_ROLES.STUDENT];
};

export const validateUserRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

// Version info
export const LAYOUT_VERSION = '1.0.0';
export const LAYOUT_INFO = {
  name: 'LMS Layout System',
  version: LAYOUT_VERSION,
  description: 'ระบบ Layout Components สำหรับ LMS',
  features: [
    'Responsive Design',
    'Role-based Navigation', 
    'Dark Mode Support',
    'Mobile Menu',
    'Collapsible Sidebar',
    'Real-time Notifications'
  ],
  lastUpdated: new Date().toISOString()
};