// File: Dashboard.jsx
// Path: frontend/src/pages/admin/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        console.error('Admin Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
        </Card>
      </div>
    );
  }

  const userStats = dashboardData?.userStatistics || {
    total: 0,
    admins: 0,
    teachers: 0,
    students: 0,
    pendingTeachers: 0,
    activeUsers: 0
  };
  const courseStats = dashboardData?.courseStatistics || {
    total: 0,
    published: 0,
    draft: 0,
    totalEnrollments: 0
  };
  const enrollmentStats = dashboardData?.enrollmentStatistics || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  };
  const quizStats = dashboardData?.quizStatistics || {
    total: 0,
    published: 0,
    draft: 0
  };
  const recentActivities = Array.isArray(dashboardData?.recentActivities) 
    ? dashboardData.recentActivities 
    : [];
  const systemMetrics = dashboardData?.systemMetrics || {};

  // Format date to Thai
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  };

  // Activity type labels
  const getActivityLabel = (type) => {
    if (!type || typeof type !== 'string') {
      return 'กิจกรรม';
    }
    const labels = {
      'user_registration': 'ลงทะเบียนใหม่',
      'course_published': 'เผยแพร่วิชา',
      'teacher_approval': 'อนุมัติครู',
      'enrollment_approved': 'อนุมัติการลงทะเบียน',
      'quiz_completed': 'ทำแบบทดสอบเสร็จ',
      'lesson_completed': 'เรียนบทเรียนเสร็จ',
      'admin_user_update': 'อัปเดตข้อมูลผู้ใช้',
      'user_status_update': 'เปลี่ยนสถานะผู้ใช้',
      'user_login': 'เข้าสู่ระบบ'
    };
    return labels[type] || type;
  };

  // Format activity message
  const formatActivityMessage = (activity) => {
    // ถ้ามี message string อยู่แล้ว
    if (activity.message && typeof activity.message === 'string') {
      return activity.message;
    }
    
    // ถ้า details เป็น object ให้ format
    if (activity.details && typeof activity.details === 'object') {
      const details = activity.details;
      
      // Format ตาม activity type
      if (activity.type === 'teacher_approval') {
        return `อนุมัติครูผู้สอน: ${details.teacherId || 'N/A'}`;
      } else if (activity.type === 'admin_user_update') {
        return `อัปเดตข้อมูลผู้ใช้: ${details.targetUserId || 'N/A'}`;
      } else if (activity.type === 'user_status_update') {
        return `เปลี่ยนสถานะผู้ใช้: ${details.targetUserId || 'N/A'} จาก ${details.oldStatus || 'N/A'} เป็น ${details.newStatus || 'N/A'}`;
      } else if (activity.type === 'user_login') {
        return 'เข้าสู่ระบบ';
      }
      
      // ถ้าไม่มี format เฉพาะ ให้ใช้ JSON string
      return JSON.stringify(details);
    }
    
    // ถ้า details เป็น string
    if (activity.details && typeof activity.details === 'string') {
      return activity.details;
    }
    
    // Fallback: ใช้ activity type
    return getActivityLabel(activity.type);
  };

  // Activity icons
  const getActivityIcon = (type) => {
    if (!type || typeof type !== 'string') {
      return <Activity className="text-gray-500" size={20} />;
    }
    if (type.includes('registration') || type.includes('approval')) {
      return <UserCheck className="text-green-500" size={20} />;
    }
    if (type.includes('course') || type.includes('published')) {
      return <BookOpen className="text-blue-500" size={20} />;
    }
    if (type.includes('quiz') || type.includes('lesson')) {
      return <CheckCircle className="text-purple-500" size={20} />;
    }
    return <Activity className="text-gray-500" size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ยินดีต้อนรับ, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('th-TH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">ผู้ใช้ทั้งหมด</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {userStats.total?.toLocaleString() || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                นักเรียน: {userStats.students || 0} | ครู: {userStats.teachers || 0}
              </p>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp size={16} />
              <span className="text-xs ml-1">+12%</span>
            </div>
          </div>
        </Card>

        {/* Pending Teachers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <UserCheck className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">รอการอนุมัติ</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {userStats.pendingTeachers || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ครูผู้สอนรออนุมัติ
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/users?status=pending&role=teacher')}
              className="text-xs"
            >
              ดูรายการ
            </Button>
          </div>
        </Card>

        {/* Total Courses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <BookOpen className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">หลักสูตรทั้งหมด</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {courseStats.total || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                เผยแพร่: {courseStats.published || 0} | ร่าง: {courseStats.draft || 0}
              </p>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp size={16} />
              <span className="text-xs ml-1">+5</span>
            </div>
          </div>
        </Card>

        {/* Total Enrollments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">การลงทะเบียน</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {enrollmentStats.total?.toLocaleString() || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                อนุมัติ: {enrollmentStats.approved || 0} | รอ: {enrollmentStats.pending || 0}
              </p>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp size={16} />
              <span className="text-xs ml-1">+8%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              สถิติผู้ใช้
            </h2>
            <BarChart3 className="text-gray-400" size={20} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'นักเรียน', value: userStats.students || 0 },
                { name: 'ครู', value: userStats.teachers || 0 },
                { name: 'ผู้ดูแล', value: userStats.admins || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Course Statistics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              สถิติหลักสูตร
            </h2>
            <BookOpen className="text-gray-400" size={20} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">เผยแพร่แล้ว</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {courseStats.published || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">รอเผยแพร่</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {courseStats.draft || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">แบบทดสอบทั้งหมด</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {quizStats.total || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              กิจกรรมล่าสุด
            </h2>
            <Activity className="text-gray-400" size={20} />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity?.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {timeAgo(activity?.timestamp || activity?.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="mx-auto mb-2 opacity-50" size={32} />
                <p>ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              การดำเนินการด่วน
            </h2>
            <Clock className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-start"
              onClick={() => navigate('/admin/users?status=pending&role=teacher')}
            >
              <UserCheck size={18} className="mr-2" />
              อนุมัติครูผู้สอน
              {userStats.pendingTeachers > 0 && (
                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {userStats.pendingTeachers}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/admin/users')}
            >
              <Users size={18} className="mr-2" />
              จัดการผู้ใช้
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/admin/courses')}
            >
              <BookOpen size={18} className="mr-2" />
              จัดการหลักสูตร
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/admin/news')}
            >
              <Activity size={18} className="mr-2" />
              จัดการข่าวสาร
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/admin/analytics')}
            >
              <BarChart3 size={18} className="mr-2" />
              ดูรายงาน
            </Button>
          </div>
        </Card>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              สถานะระบบ
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400">ออนไลน์</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Uptime</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {systemMetrics.uptime ? `${Math.floor(systemMetrics.uptime / 3600)}h` : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Database</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {systemMetrics.databaseStatus || 'Connected'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Storage</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {systemMetrics.storageUsed || '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Environment</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {systemMetrics.environment || 'development'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;

