// File: Courses.jsx
// Path: frontend/src/pages/admin/Courses.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Users,
  Star,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import adminService from '../../services/adminService';
import courseService from '../../services/courseService';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  // Actions
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, selectedStatus, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 20,
        ...(selectedStatus && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adminService.getCourses(params);
      const data = response.data || response;
      setCourses(data.courses || []);
      setPagination(data.pagination);
      setSummary(data.summary);
      
      // Update URL params
      const newParams = new URLSearchParams();
      if (currentPage > 1) newParams.set('page', currentPage.toString());
      if (selectedStatus) newParams.set('status', selectedStatus);
      if (searchTerm) newParams.set('search', searchTerm);
      setSearchParams(newParams);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Fetch courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (courseId, isPublished) => {
    if (!confirm(`คุณต้องการ${isPublished ? 'เผยแพร่' : 'ยกเลิกการเผยแพร่'}หลักสูตรนี้ใช่หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.updateCourseStatus(courseId, isPublished);
      await fetchCourses(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('คุณต้องการลบหลักสูตรนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      return;
    }

    try {
      setActionLoading(true);
      await courseService.deleteCourse(courseId);
      await fetchCourses(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCourses();
  };

  const handleFilterChange = (value) => {
    setCurrentPage(1);
    setSelectedStatus(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isPublished, isActive) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle size={14} /> ไม่ใช้งาน
        </span>
      );
    }
    if (isPublished) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle size={14} /> เผยแพร่แล้ว
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <EyeOff size={14} /> รอเผยแพร่
      </span>
    );
  };

  if (loading && !courses.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft size={20} className="mr-2" /> กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              จัดการหลักสูตร
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ดูและจัดการหลักสูตรทั้งหมดในระบบ
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">หลักสูตรทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.total || 0}
                </h3>
              </div>
              <BookOpen className="text-primary-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">เผยแพร่แล้ว</p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.published || 0}
                </h3>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">รอเผยแพร่</p>
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.draft || 0}
                </h3>
              </div>
              <EyeOff className="text-yellow-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">การลงทะเบียนทั้งหมด</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.totalEnrollments?.toLocaleString() || 0}
                </h3>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อหลักสูตร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="published">เผยแพร่แล้ว</option>
                <option value="draft">รอเผยแพร่</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary">
              <Search size={18} className="mr-2" /> ค้นหา
            </Button>
            {(selectedStatus || searchTerm) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedStatus('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                ล้างการค้นหา
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </Card>
      )}

      {/* Courses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  หลักสูตร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ครูผู้สอน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  สถิติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <BookOpen size={24} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {course.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {course.description || course.shortDescription || '-'}
                          </p>
                          {course.category && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {course.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.teacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {course.teacher.firstName?.[0]}{course.teacher.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {course.teacher.firstName} {course.teacher.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {course.teacher.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(course.isPublished, course.isActive !== false)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <Users size={14} className="text-primary-500" />
                          <span>{course.enrollmentCount || course.stats?.totalEnrollments || 0} คน</span>
                        </div>
                        {course.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                            <Star size={14} className="text-yellow-500 fill-current" />
                            <span>{course.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        )}
                        {course.stats && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            บทเรียน: {course.stats.totalLessons || 0} | แบบทดสอบ: {course.stats.totalQuizzes || 0}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <Eye size={16} className="mr-1" />
                          ดู
                        </Button>
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <MoreVertical size={18} className="text-gray-500" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              {!course.isPublished ? (
                                <button
                                  onClick={() => handleStatusChange(course.id, true)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  disabled={actionLoading}
                                >
                                  <Eye size={16} /> เผยแพร่
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(course.id, false)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  disabled={actionLoading}
                                >
                                  <EyeOff size={16} /> ยกเลิกการเผยแพร่
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit size={16} /> แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(course.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                disabled={actionLoading}
                              >
                                <Trash2 size={16} /> ลบ
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">ไม่พบหลักสูตรที่ตรงกับเงื่อนไข</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              แสดง {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, pagination.totalCourses || pagination.total || 0)} จาก {pagination.totalCourses || pagination.total || 0} รายการ
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev || loading}
              >
                <ChevronLeft size={16} className="mr-1" /> ก่อนหน้า
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                หน้า {currentPage} จาก {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext || loading}
              >
                ถัดไป <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminCourses;

