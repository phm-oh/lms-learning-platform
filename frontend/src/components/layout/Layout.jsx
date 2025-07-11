// File: Layout.jsx
// Path: frontend/src/components/layout/Layout.jsx

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  BookOpen,
  Home,
  BarChart3,
  Users,
  FileText,
  Award,
  MessageSquare,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { Button, Card, Input, SearchInput } from '../ui';

/**
 * Layout Component - โครงสร้างหลักของแอปพลิเคชัน
 * รวม Header, Sidebar, และ Main Content Area
 */
const Layout = ({ 
  children, 
  userRole = 'student',
  showSidebar = true,
  sidebarCollapsed = false,
  onToggleSidebar,
  user = null
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(sidebarCollapsed);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // จัดการ responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // เรียกครั้งแรก

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggleSidebar) onToggleSidebar(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        
        {/* Header */}
        <Header 
          user={user}
          notifications={notifications}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onToggleMobileMenu={toggleMobileMenu}
          showSidebar={showSidebar}
        />

        <div className="flex">
          {/* Sidebar */}
          {showSidebar && (
            <Sidebar 
              userRole={userRole}
              isCollapsed={isCollapsed}
              isMobileMenuOpen={isMobileMenuOpen}
              onToggle={toggleSidebar}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className={`
            flex-1 transition-all duration-300 ease-in-out
            ${showSidebar ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''}
            ${isMobileMenuOpen ? 'lg:ml-64' : ''}
          `}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

// Header Component
const Header = ({ 
  user, 
  notifications, 
  isDarkMode, 
  onToggleDarkMode, 
  onToggleMobileMenu,
  showSidebar 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {showSidebar && (
              <button 
                onClick={onToggleMobileMenu}
                className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white"><Kru-oh className="dev"></Kru-oh></h1>
                <p className="text-xs text-purple-200">Learning Management System</p>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchInput
              placeholder="ค้นหาวิชา, ครู, เนื้อหา..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              variant="glass"
              className="text-white placeholder-purple-200 border-white/30"
              clearable
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            
            {/* Search Button (Mobile) */}
            <button className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={onToggleDarkMode}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <Card className="absolute right-0 mt-2 w-80 shadow-xl z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">คลาสใหม่เปิดแล้ว!</p>
                      <p className="text-xs text-gray-500">React Advanced - เริ่มเรียน 15 ม.ค. 2568</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">แบบทดสอบใหม่</p>
                      <p className="text-xs text-gray-500">JavaScript Fundamentals - ครบกำหนด 20 ม.ค.</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">ผลคะแนนออกแล้ว</p>
                      <p className="text-xs text-gray-500">UI/UX Design Quiz - คะแนน 95/100</p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" fullWidth>
                      ดูทั้งหมด
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <img 
                  src={user?.profilePhoto || '/api/placeholder/32/32'} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white/30"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.firstName || 'ผู้ใช้'}</p>
                  <p className="text-xs text-purple-200 capitalize">{user?.role || 'student'}</p>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <Card className="absolute right-0 mt-2 w-56 shadow-xl z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <UserMenuItem icon={User} label="โปรไฟล์" />
                    <UserMenuItem icon={Settings} label="ตั้งค่า" />
                    <UserMenuItem icon={HelpCircle} label="ช่วยเหลือ" />
                    <div className="border-t border-gray-100 my-2"></div>
                    <UserMenuItem icon={LogOut} label="ออกจากระบบ" className="text-red-600" />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Sidebar Component
const Sidebar = ({ 
  userRole, 
  isCollapsed, 
  isMobileMenuOpen, 
  onToggle, 
  onCloseMobile 
}) => {
  // เมนูตาม role
  const menuItems = {
    student: [
      { icon: Home, label: 'แดชบอร์ด', path: '/dashboard', active: true },
      { icon: BookOpen, label: 'วิชาของฉัน', path: '/my-courses' },
      { icon: Award, label: 'แบบทดสอบ', path: '/quizzes' },
      { icon: BarChart3, label: 'ความก้าวหน้า', path: '/progress' },
      { icon: FileText, label: 'ข่าวสาร', path: '/news' },
    ],
    teacher: [
      { icon: Home, label: 'แดชบอร์ด', path: '/teacher/dashboard', active: true },
      { icon: BookOpen, label: 'จัดการวิชา', path: '/teacher/courses' },
      { icon: Users, label: 'นักเรียน', path: '/teacher/students' },
      { icon: Award, label: 'แบบทดสอบ', path: '/teacher/quizzes' },
      { icon: BarChart3, label: 'รายงาน', path: '/teacher/analytics' },
      { icon: MessageSquare, label: 'ข่าวสาร', path: '/teacher/news' },
    ],
    admin: [
      { icon: Home, label: 'แดชบอร์ด', path: '/admin/dashboard', active: true },
      { icon: Users, label: 'จัดการผู้ใช้', path: '/admin/users' },
      { icon: BookOpen, label: 'จัดการวิชา', path: '/admin/courses' },
      { icon: BarChart3, label: 'รายงานระบบ', path: '/admin/analytics' },
      { icon: Settings, label: 'ตั้งค่าระบบ', path: '/admin/settings' },
      { icon: MessageSquare, label: 'จัดการข่าว', path: '/admin/news' },
    ]
  };

  const currentMenu = menuItems[userRole] || menuItems.student;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] z-30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-gray-900 to-gray-800
        border-r border-gray-700
      `}>
        <div className="flex flex-col h-full">
          
          {/* Toggle Button */}
          <div className="hidden lg:flex justify-end p-4">
            <button 
              onClick={onToggle}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {currentMenu.map((item, index) => (
                <SidebarItem 
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  active={item.active}
                  isCollapsed={isCollapsed}
                  onClick={onCloseMobile}
                />
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {!isCollapsed ? (
              <div className="text-center">
                <p className="text-xs text-gray-400">LMS v1.0.0</p>
                <p className="text-xs text-gray-500">© 2025 Kru Phanumet</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, path, active, isCollapsed, onClick }) => {
  return (
    <li>
      <a 
        href={path}
        onClick={onClick}
        className={`
          flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
          ${active 
            ? 'bg-blue-900 text-white shadow-lg' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
          ${isCollapsed ? 'justify-center' : 'space-x-3'}
        `}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!isCollapsed && (
          <span className="font-medium truncate">{label}</span>
        )}
      </a>
    </li>
  );
};

// User Menu Item Component
const UserMenuItem = ({ icon: Icon, label, className = '', onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center space-x-3 px-4 py-2 text-left
        hover:bg-gray-50 transition-colors
        ${className}
      `}
    >
      <Icon size={16} />
      <span className="text-sm">{label}</span>
    </button>
  );
};

// Export Layout component เป็น named export เพื่อใช้ใน variants
export { Layout };

// Layout Variants
export const StudentLayout = ({ children, ...props }) => (
  <Layout userRole="student" {...props}>{children}</Layout>
);

export const TeacherLayout = ({ children, ...props }) => (
  <Layout userRole="teacher" {...props}>{children}</Layout>
);

export const AdminLayout = ({ children, ...props }) => (
  <Layout userRole="admin" {...props}>{children}</Layout>
);

export const PublicLayout = ({ children }) => (
  <Layout showSidebar={false}>{children}</Layout>
);

// Default export สำหรับ import แบบ default
export default Layout;