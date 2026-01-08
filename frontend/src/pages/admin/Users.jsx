// File: Users.jsx
// Path: frontend/src/pages/admin/Users.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/admin/StatusBadge';
import ApproveTeacherModal from '../../components/admin/ApproveTeacherModal';
import EditUserModal from '../../components/admin/EditUserModal';
import adminService from '../../services/adminService';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  // Modals
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole, selectedStatus, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 20,
        ...(selectedRole && { role: selectedRole }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adminService.getUsers(params);
      setUsers(response.users || []);
      setPagination(response.pagination);
      setFilters(response.filters);
      
      // Update URL params
      const newParams = new URLSearchParams();
      if (currentPage > 1) newParams.set('page', currentPage.toString());
      if (selectedRole) newParams.set('role', selectedRole);
      if (selectedStatus) newParams.set('status', selectedStatus);
      if (searchTerm) newParams.set('search', searchTerm);
      setSearchParams(newParams);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, data = {}) => {
    try {
      setActionLoading(true);
      await adminService.approveUser(userId, 'approve', data);
      await fetchUsers(); // Refresh list
      setIsApproveModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId, data = {}) => {
    try {
      setActionLoading(true);
      await adminService.approveUser(userId, 'reject', data);
      await fetchUsers(); // Refresh list
      setIsApproveModalOpen(false);
      setSelectedTeacher(null);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการปฏิเสธ');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus, reason = '') => {
    if (!confirm(`คุณต้องการเปลี่ยนสถานะเป็น "${newStatus}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.updateUserStatus(userId, newStatus, { reason });
      await fetchUsers(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('คุณต้องการลบผู้ใช้นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.deleteUser(userId);
      await fetchUsers(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userId, userData) => {
    try {
      setActionLoading(true);
      await adminService.updateUser(userId, userData);
      await fetchUsers(); // Refresh list
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === 'role') {
      setSelectedRole(value);
    } else if (filterType === 'status') {
      setSelectedStatus(value);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'ผู้ดูแลระบบ',
      teacher: 'ครูผู้สอน',
      student: 'นักเรียน'
    };
    return labels[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !users.length) {
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
              จัดการผู้ใช้
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              อนุมัติครูผู้สอนและจัดการบัญชีผู้ใช้ทั้งหมด
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, นามสกุล, หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">ทุกบทบาท</option>
                {(filters?.roles && filters.roles.length > 0 ? filters.roles : [
                  { value: 'student', count: 0 },
                  { value: 'teacher', count: 0 },
                  { value: 'admin', count: 0 }
                ]).map(role => (
                  <option key={role.value} value={role.value}>
                    {getRoleLabel(role.value)} {role.count > 0 && `(${role.count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                {(filters?.statuses && filters.statuses.length > 0 ? filters.statuses : [
                  { value: 'active', count: 0 },
                  { value: 'pending', count: 0 },
                  { value: 'suspended', count: 0 },
                  { value: 'banned', count: 0 },
                  { value: 'inactive', count: 0 }
                ]).map(status => (
                  <option key={status.value} value={status.value}>
                    {status.value === 'active' ? 'ใช้งาน' :
                     status.value === 'pending' ? 'รอการอนุมัติ' :
                     status.value === 'suspended' ? 'ระงับการใช้งาน' :
                     status.value === 'banned' ? 'ถูกแบน' :
                     status.value === 'inactive' ? 'ไม่ใช้งาน' : status.value} {status.count > 0 && `(${status.count})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary">
              <Search size={18} className="mr-2" /> ค้นหา
            </Button>
            {(selectedRole || selectedStatus || searchTerm) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedRole('');
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

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  เข้าสู่ระบบล่าสุด
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.lastLoginAt || user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'teacher' && user.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(user);
                              setIsApproveModalOpen(true);
                            }}
                            disabled={actionLoading}
                          >
                            <UserCheck size={16} className="mr-1" />
                            อนุมัติ
                          </Button>
                        )}
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <MoreVertical size={18} className="text-gray-500" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit size={16} /> แก้ไขข้อมูล
                              </button>
                              {user.status === 'active' && (
                                <button
                                  onClick={() => handleStatusChange(user.id, 'suspended')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Ban size={16} /> ระงับการใช้งาน
                                </button>
                              )}
                              {user.status === 'suspended' && (
                                <button
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <CheckCircle size={16} /> เปิดใช้งาน
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</p>
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
              แสดง {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, pagination.totalUsers)} จาก {pagination.totalUsers} รายการ
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

      {/* Approve Teacher Modal */}
      <ApproveTeacherModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default AdminUsers;

