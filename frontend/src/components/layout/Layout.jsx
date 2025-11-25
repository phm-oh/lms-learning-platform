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
  Globe,
  LayoutDashboard,
  GraduationCap,
  PieChart
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Layout Component - Modern EdTech Layout
 * Features: Glassmorphism Header, Gradient Sidebar, Responsive Design
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

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggleSidebar) onToggleSidebar(!isCollapsed);
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

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

        {/* Main Content Wrapper */}
        <div className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${showSidebar ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : ''}
        `}>

          {/* Header */}
          <Header
            user={user}
            notifications={notifications}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            showSidebar={showSidebar}
            isCollapsed={isCollapsed}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-8 pt-24 overflow-x-hidden">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
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
  showSidebar,
  isCollapsed
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className={`
      fixed top-0 right-0 z-30 h-20 transition-all duration-300
      ${showSidebar ? (isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-72') : 'left-0'}
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800
    `}>
      <div className="h-full px-6 flex items-center justify-between">

        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center flex-1 gap-4">
          {showSidebar && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          )}

          {/* Search Bar */}
          <div className="hidden md:flex items-center max-w-md w-full relative group">
            <Search className="absolute left-3 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search for courses, skills, or mentors..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all text-sm"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all relative group"
            >
              <Bell size={20} className="group-hover:text-primary-600 transition-colors" />
              {notifications > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in origin-top-right">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <span className="text-xs text-primary-600 font-medium cursor-pointer">Mark all as read</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Award size={18} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800 font-medium">New Achievement Unlocked!</p>
                        <p className="text-xs text-gray-500 mt-1">You completed the React Basics course.</p>
                        <p className="text-[10px] text-gray-400 mt-2">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative pl-2 border-l border-gray-200">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-gray-200"
            >
              <img
                src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName || 'User'}&background=8b5cf6&color=fff`}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user?.firstName || 'Phanumet'}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role || 'Student'}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in origin-top-right">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="font-semibold text-gray-900">{user?.firstName || 'Phanumet'} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="p-2">
                  <UserMenuItem icon={User} label="My Profile" />
                  <UserMenuItem icon={Settings} label="Settings" />
                  <UserMenuItem icon={HelpCircle} label="Help Center" />
                  <div className="h-px bg-gray-100 my-2"></div>
                  <UserMenuItem icon={LogOut} label="Sign Out" className="text-red-600 hover:bg-red-50" />
                </div>
              </div>
            )}
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
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = {
    student: [
      { icon: LayoutDashboard, label: 'Overview', path: '/' },
      { icon: User, label: 'My Profile', path: '/profile' },
      { icon: BookOpen, label: 'My Course', path: '/my-courses' },
      { icon: FileText, label: 'Assignment', path: '/assignments' },
      { icon: Award, label: 'Skill Test', path: '/quizzes' },
      { icon: PieChart, label: 'Order History', path: '/orders' },
    ],
    teacher: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
      { icon: BookOpen, label: 'My Courses', path: '/teacher/courses' },
      { icon: Users, label: 'Students', path: '/teacher/students' },
      { icon: BarChart3, label: 'Analytics', path: '/teacher/analytics' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Users, label: 'Users', path: '/admin/users' },
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ]
  };

  const currentMenu = menuItems[userRole] || menuItems.student;

  return (
    <aside className={`
      fixed left-0 top-0 h-screen z-50
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-72'}
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      bg-gradient-to-b from-[#667eea] to-[#764ba2]
      text-white shadow-2xl
    `}>
      <div className="flex flex-col h-full relative overflow-hidden">

        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-purple-400 blur-2xl"></div>
        </div>

        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner border border-white/30">
              <GraduationCap className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-xl tracking-tight">Ed Tech</h1>
                <p className="text-[10px] text-purple-100 uppercase tracking-wider font-medium">Learning Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto relative z-10 scrollbar-hide">
          <ul className="space-y-2">
            {currentMenu.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      onCloseMobile();
                    }}
                    className={`
                      w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group
                      ${isActive
                        ? 'bg-white text-primary-600 shadow-lg translate-x-1'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center px-2' : 'gap-3'}
                    `}
                  >
                    <item.icon
                      size={22}
                      className={`
                        transition-transform duration-200
                        ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                      `}
                    />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}

                    {/* Active Indicator */}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Bottom Menu */}
          <div className="mt-8 pt-8 border-t border-white/10 space-y-2">
            <button className={`
              w-full flex items-center px-4 py-3.5 rounded-2xl text-purple-100 hover:bg-white/10 hover:text-white transition-all
              ${isCollapsed ? 'justify-center px-2' : 'gap-3'}
            `}>
              <Settings size={22} />
              {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
            </button>
            <button className={`
              w-full flex items-center px-4 py-3.5 rounded-2xl text-purple-100 hover:bg-white/10 hover:text-white transition-all
              ${isCollapsed ? 'justify-center px-2' : 'gap-3'}
            `}>
              <LogOut size={22} />
              {!isCollapsed && <span className="font-medium text-sm">Log Out</span>}
            </button>
          </div>
        </nav>

        {/* Collapse Toggle (Desktop) */}
        <div className="hidden lg:flex justify-center p-4 relative z-10">
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Join Course Card (Only when expanded) */}
        {!isCollapsed && (
          <div className="p-6 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Join Course</h4>
                <p className="text-xs text-purple-100 mb-3">Upgrade your skills today!</p>
                <button className="w-full py-2 bg-white text-primary-600 rounded-xl text-xs font-bold hover:shadow-lg hover:scale-105 transition-all">
                  Join Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// User Menu Item Helper
const UserMenuItem = ({ icon: Icon, label, className = '', onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl
      hover:bg-gray-50 text-gray-700 transition-all
      ${className}
    `}
  >
    <Icon size={18} className="text-gray-400" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

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

export { Layout };
export default Layout;