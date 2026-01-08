// File: News.jsx
// Path: frontend/src/pages/admin/News.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Newspaper,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Plus,
  TrendingUp
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import newsService from '../../services/newsService';

const AdminNews = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [news, setNews] = useState([]);
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
    fetchNews();
  }, [currentPage, selectedStatus, searchTerm]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 20,
        ...(selectedStatus && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await newsService.getAdminNews(params);
      const data = response.data || response;
      setNews(data.news || []);
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
      console.error('Fetch news error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (newsId, action) => {
    const actionText = {
      publish: 'เผยแพร่',
      unpublish: 'ยกเลิกการเผยแพร่',
      archive: 'เก็บถาวร'
    }[action] || 'เปลี่ยนสถานะ';

    if (!confirm(`คุณต้องการ${actionText}ข่าวนี้ใช่หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await newsService.togglePublishNews(newsId, action);
      await fetchNews(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (newsId) => {
    if (!confirm('คุณต้องการลบข่าวนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      return;
    }

    try {
      setActionLoading(true);
      await newsService.deleteNews(newsId);
      await fetchNews(); // Refresh list
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNews();
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        label: 'เผยแพร่แล้ว',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      draft: {
        label: 'ร่าง',
        icon: Edit,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      scheduled: {
        label: 'กำหนดเวลา',
        icon: Clock,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      archived: {
        label: 'เก็บถาวร',
        icon: Archive,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon size={14} /> {config.label}
      </span>
    );
  };

  if (loading && !news.length) {
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
              จัดการข่าวสาร
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ดูและจัดการข่าวสารทั้งหมดในระบบ
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/news/create')}>
          <Plus size={20} className="mr-2" /> สร้างข่าวใหม่
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ข่าวทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {summary.total || 0}
                </h3>
              </div>
              <Newspaper className="text-primary-500" size={32} />
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ร่าง</p>
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.draft || 0}
                </h3>
              </div>
              <Edit className="text-yellow-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">กำหนดเวลา</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.scheduled || 0}
                </h3>
              </div>
              <Clock className="text-blue-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ยอดดูทั้งหมด</p>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {summary.totalViews?.toLocaleString() || 0}
                </h3>
              </div>
              <TrendingUp className="text-purple-500" size={32} />
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
                  placeholder="ค้นหาด้วยชื่อข่าว..."
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
                <option value="draft">ร่าง</option>
                <option value="scheduled">กำหนดเวลา</option>
                <option value="archived">เก็บถาวร</option>
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

      {/* News Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ข่าวสาร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ผู้เขียน
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
              {news.length > 0 ? (
                news.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 overflow-hidden">
                          {item.featuredImage ? (
                            <img 
                              src={item.featuredImage} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Newspaper size={32} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {item.summary || '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {item.category && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                {item.category.name}
                              </span>
                            )}
                            {item.isFeatured && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                โดดเด่น
                              </span>
                            )}
                            {item.isPinned && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                ปักหมุด
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.author ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {item.author.firstName?.[0]}{item.author.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.author.firstName} {item.author.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.author.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <Eye size={14} className="text-primary-500" />
                          <span>{item.viewCount || 0}</span>
                        </div>
                        {item.publishedAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            เผยแพร่: {formatDate(item.publishedAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/news/${item.slug}`)}
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
                              {item.status === 'draft' && (
                                <button
                                  onClick={() => handlePublish(item.id, 'publish')}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  disabled={actionLoading}
                                >
                                  <CheckCircle size={16} /> เผยแพร่
                                </button>
                              )}
                              {item.status === 'published' && (
                                <>
                                  <button
                                    onClick={() => handlePublish(item.id, 'unpublish')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    disabled={actionLoading}
                                  >
                                    <EyeOff size={16} /> ยกเลิกการเผยแพร่
                                  </button>
                                  <button
                                    onClick={() => handlePublish(item.id, 'archive')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    disabled={actionLoading}
                                  >
                                    <Archive size={16} /> เก็บถาวร
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => navigate(`/admin/news/${item.id}/edit`)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit size={16} /> แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
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
                    <Newspaper className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">ไม่พบข่าวที่ตรงกับเงื่อนไข</p>
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
              แสดง {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, pagination.totalNews || pagination.total || 0)} จาก {pagination.totalNews || pagination.total || 0} รายการ
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

export default AdminNews;



