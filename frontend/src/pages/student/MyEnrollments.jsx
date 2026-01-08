// File: MyEnrollments.jsx
// Path: frontend/src/pages/student/MyEnrollments.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import courseService from '../../services/courseService';

const MyEnrollments = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getMyEnrollments();
      // Handle both array and object with enrollments property
      const enrollmentsList = Array.isArray(data) ? data : (data?.enrollments || []);
      setEnrollments(enrollmentsList);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      // Only show error if it's a real error, not just empty data
      if (err.response?.status >= 500) {
        setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } else {
        // For other errors (like 404), just set empty array
        setEnrollments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'รอการอนุมัติ',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock
      },
      approved: {
        label: 'อนุมัติแล้ว',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle
      },
      rejected: {
        label: 'ถูกปฏิเสธ',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = !searchTerm || 
      enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || enrollment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchEnrollments}>
              ลองอีกครั้ง
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            การลงทะเบียนของฉัน
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ดูสถานะการลงทะเบียนหลักสูตรทั้งหมด
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="ค้นหาหลักสูตร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอการอนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ถูกปฏิเสธ</option>
          </select>
        </div>
      </Card>

      {/* Enrollments List */}
      {filteredEnrollments.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {enrollments.length === 0 ? 'ยังไม่มีการลงทะเบียน' : 'ไม่พบผลการค้นหา'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {enrollments.length === 0 
              ? 'เริ่มต้นการเรียนโดยการลงทะเบียนหลักสูตรที่คุณสนใจ'
              : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'}
          </p>
          {enrollments.length === 0 && (
            <Button variant="primary" onClick={() => navigate('/courses')}>
              ดูหลักสูตรทั้งหมด
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEnrollments.map((enrollment) => (
            <Card key={enrollment.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {enrollment.course?.thumbnail && (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {enrollment.course?.title || 'ไม่พบชื่อหลักสูตร'}
                        </h3>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      {enrollment.course?.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {enrollment.course.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            สมัครเมื่อ: {new Date(enrollment.enrolledAt || enrollment.requestedAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {enrollment.approvedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle size={16} />
                            <span>
                              อนุมัติเมื่อ: {new Date(enrollment.approvedAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {enrollment.status === 'approved' && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/courses/${enrollment.courseId}/learn`)}
                      className="w-full md:w-auto"
                    >
                      เริ่มเรียน
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/courses/${enrollment.courseId}`)}
                    className="w-full md:w-auto"
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;

