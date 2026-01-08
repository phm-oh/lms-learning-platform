// File: NewsForm.jsx
// Path: frontend/src/pages/admin/NewsForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Tag,
  Image as ImageIcon,
  FileText,
  Settings,
  X
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import newsService from '../../services/newsService';

const NewsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '',
    featuredImage: '',
    featuredImageAlt: '',
    newsType: 'general',
    priority: 'normal',
    tags: [],
    status: 'draft',
    scheduledAt: '',
    expiresAt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    isFeatured: false,
    isPinned: false,
    allowComments: true,
    isExternalLink: false,
    externalUrl: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchNews();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await newsService.getNewsCategories();
      const data = response.data || response;
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Get news from admin news list (fallback method)
      const response = await newsService.getAdminNews({ page: 1, limit: 1000 });
      const data = response.data || response;
      const news = data.news?.find(n => n.id === parseInt(id));
      
      if (news) {
        setFormData({
          title: news.title || '',
          summary: news.summary || '',
          content: news.content || '',
          categoryId: news.categoryId || news.category?.id || '',
          featuredImage: news.featuredImage || '',
          featuredImageAlt: news.featuredImageAlt || '',
          newsType: news.newsType || 'general',
          priority: news.priority || 'normal',
          tags: news.tags || [],
          status: news.status || 'draft',
          scheduledAt: news.scheduledAt ? new Date(news.scheduledAt).toISOString().slice(0, 16) : '',
          expiresAt: news.expiresAt ? new Date(news.expiresAt).toISOString().slice(0, 16) : '',
          metaTitle: news.metaTitle || '',
          metaDescription: news.metaDescription || '',
          metaKeywords: news.metaKeywords || [],
          isFeatured: news.isFeatured || false,
          isPinned: news.isPinned || false,
          allowComments: news.allowComments !== false,
          isExternalLink: news.isExternalLink || false,
          externalUrl: news.externalUrl || ''
        });
      } else {
        setError('ไม่พบข่าวที่ต้องการแก้ไข');
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && formData.metaKeywords.length < 15) {
      setFormData(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title || !formData.title.trim()) {
      setError('กรุณากรอกชื่อข่าว');
      return;
    }
    if (formData.title.trim().length < 3) {
      setError('ชื่อข่าวต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (!formData.summary || !formData.summary.trim()) {
      setError('กรุณากรอกสรุปข่าว');
      return;
    }
    if (formData.summary.trim().length < 10) {
      setError('สรุปข่าวต้องมีอย่างน้อย 10 ตัวอักษร');
      return;
    }
    if (!formData.content || !formData.content.trim()) {
      setError('กรุณากรอกเนื้อหาข่าว');
      return;
    }
    if (formData.content.trim().length < 10) {
      setError('เนื้อหาข่าวต้องมีอย่างน้อย 10 ตัวอักษร');
      return;
    }
    if (!formData.categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare submit data - remove empty strings and convert to proper types
      const submitData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        categoryId: parseInt(formData.categoryId),
        newsType: formData.newsType || 'general',
        priority: formData.priority || 'normal',
        status: formData.status || 'draft',
        isFeatured: formData.isFeatured || false,
        isPinned: formData.isPinned || false,
        allowComments: formData.allowComments !== false
      };

      // Tags - only include if not empty
      if (formData.tags && formData.tags.length > 0) {
        submitData.tags = formData.tags;
      }

      // Optional fields - only include if not empty and valid
      // featuredImage must be valid URL if provided, or omit it
      if (formData.featuredImage && formData.featuredImage.trim()) {
        const imageUrl = formData.featuredImage.trim();
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          submitData.featuredImage = imageUrl;
          if (formData.featuredImageAlt && formData.featuredImageAlt.trim()) {
            submitData.featuredImageAlt = formData.featuredImageAlt.trim();
          }
        }
        // If not valid URL, don't include it (will be validated by backend)
      }
      
      if (formData.status === 'scheduled' && formData.scheduledAt) {
        submitData.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }
      
      if (formData.expiresAt) {
        submitData.expiresAt = new Date(formData.expiresAt).toISOString();
      }
      
      if (formData.metaTitle && formData.metaTitle.trim()) {
        submitData.metaTitle = formData.metaTitle.trim();
      }
      
      if (formData.metaDescription && formData.metaDescription.trim()) {
        submitData.metaDescription = formData.metaDescription.trim();
      }
      
      if (formData.metaKeywords && formData.metaKeywords.length > 0) {
        submitData.metaKeywords = formData.metaKeywords;
      }
      
      if (formData.isExternalLink && formData.externalUrl && formData.externalUrl.trim()) {
        submitData.externalUrl = formData.externalUrl.trim();
      }

      if (isEdit) {
        await newsService.updateNews(id, submitData);
        alert('อัปเดตข่าวเรียบร้อย');
      } else {
        await newsService.createNews(submitData);
        alert('สร้างข่าวเรียบร้อย');
      }
      navigate('/admin/news');
    } catch (err) {
      console.error('News form error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'เกิดข้อผิดพลาดในการบันทึก';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          <Button variant="outline" onClick={() => navigate('/admin/news')}>
            <ArrowLeft size={20} className="mr-2" /> กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'แก้ไขข่าวสาร' : 'สร้างข่าวสารใหม่'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'แก้ไขข้อมูลข่าวสาร' : 'สร้างข่าวสารใหม่ในระบบ'}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-primary-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              ข้อมูลพื้นฐาน
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ชื่อข่าว <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="กรอกชื่อข่าว"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                สรุปข่าว <span className="text-red-500">*</span>
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="กรอกสรุปข่าว (10-500 ตัวอักษร)"
                required
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.summary.length}/500 ตัวอักษร
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เนื้อหาข่าว <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="กรอกเนื้อหาข่าว"
                required
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.content.length} ตัวอักษร
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ประเภทข่าว
                </label>
                <select
                  name="newsType"
                  value={formData.newsType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="general">ทั่วไป</option>
                  <option value="announcement">ประกาศ</option>
                  <option value="technology">เทคโนโลยี</option>
                  <option value="course_update">อัปเดตหลักสูตร</option>
                  <option value="system">ระบบ</option>
                  <option value="event">กิจกรรม</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ความสำคัญ
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">ด่วน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">ร่าง</option>
                  <option value="published">เผยแพร่</option>
                  <option value="scheduled">กำหนดเวลา</option>
                  <option value="archived">เก็บถาวร</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Featured Image */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="text-primary-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              รูปภาพหลัก
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL รูปภาพ
              </label>
              <Input
                type="url"
                name="featuredImage"
                value={formData.featuredImage}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                คำอธิบายรูปภาพ (Alt Text)
              </label>
              <Input
                type="text"
                name="featuredImageAlt"
                value={formData.featuredImageAlt}
                onChange={handleChange}
                placeholder="คำอธิบายรูปภาพ"
                className="w-full"
              />
            </div>

            {formData.featuredImage && (
              <div className="mt-4">
                <img
                  src={formData.featuredImage}
                  alt={formData.featuredImageAlt || 'Preview'}
                  className="w-full h-64 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Tags */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="text-primary-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              แท็ก
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="เพิ่มแท็ก (กด Enter)"
                className="flex-1"
                disabled={formData.tags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={formData.tags.length >= 10 || !tagInput.trim()}
              >
                เพิ่ม
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="hover:text-primary-600 dark:hover:text-primary-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              สูงสุด 10 แท็ก ({formData.tags.length}/10)
            </p>
          </div>
        </Card>

        {/* Publishing Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-primary-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              การตั้งค่าเผยแพร่
            </h2>
          </div>

          <div className="space-y-4">
            {formData.status === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  กำหนดเวลาเผยแพร่
                </label>
                <Input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันหมดอายุ (ถ้ามี)
              </label>
              <Input
                type="datetime-local"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  แสดงเป็นข่าวโดดเด่น
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  ปักหมุด
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allowComments"
                  checked={formData.allowComments}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  อนุญาตให้แสดงความคิดเห็น
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isExternalLink"
                  checked={formData.isExternalLink}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  ลิงก์ภายนอก
                </span>
              </label>
            </div>

            {formData.isExternalLink && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL ภายนอก
                </label>
                <Input
                  type="url"
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </Card>

        {/* SEO Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-primary-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              SEO (ไม่บังคับ)
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Title
              </label>
              <Input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                placeholder="Meta title สำหรับ SEO"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                placeholder="Meta description สำหรับ SEO"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="เพิ่มคำค้นหา (กด Enter)"
                  className="flex-1"
                  disabled={formData.metaKeywords.length >= 15}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddKeyword}
                  disabled={formData.metaKeywords.length >= 15 || !keywordInput.trim()}
                >
                  เพิ่ม
                </Button>
              </div>

              {formData.metaKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.metaKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        className="hover:text-gray-600 dark:hover:text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                สูงสุด 15 คำ ({formData.metaKeywords.length}/15)
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/news')}
            disabled={saving}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {isEdit ? 'อัปเดตข่าว' : 'สร้างข่าว'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewsForm;

