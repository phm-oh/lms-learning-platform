// File: CourseForm.jsx
// Path: frontend/src/pages/teacher/CourseForm.jsx
// Purpose: Create/Edit Course Form for Teachers

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  BookOpen,
  FileText,
  Tag,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import courseService from '../../services/courseService';

const CourseForm = () => {
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
    description: '',
    shortDescription: '',
    categoryId: '',
    difficultyLevel: 1,
    estimatedDuration: '',
    maxStudents: '',
    tags: [],
    prerequisites: [],
    learningObjectives: []
  });

  const [tagInput, setTagInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchCourse();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const categories = await courseService.getCourseCategories();
      setCategories(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback: try to get from courses
      try {
        const coursesResponse = await api.get('/courses', { params: { limit: 100 } });
        const courses = coursesResponse?.data?.courses || coursesResponse?.data?.data?.courses || [];
        const uniqueCategories = [];
        const categoryMap = new Map();
        
        courses.forEach(course => {
          if (course.category && !categoryMap.has(course.category.id)) {
            categoryMap.set(course.category.id, course.category);
            uniqueCategories.push(course.category);
          }
        });
        
        setCategories(uniqueCategories);
      } catch (fallbackErr) {
        console.error('Error fetching categories from fallback:', fallbackErr);
        setCategories([]);
      }
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const course = await courseService.getCourseById(id);
      
      setFormData({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || '',
        categoryId: course.categoryId || course.category?.id || '',
        difficultyLevel: course.difficultyLevel || 1,
        estimatedDuration: course.estimatedDuration || '',
        maxStudents: course.maxStudents || '',
        tags: course.tags || [],
        prerequisites: course.prerequisites || [],
        learningObjectives: course.learningObjectives || []
      });
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (name, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
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

  const handleAddPrerequisite = () => {
    if (prerequisiteInput.trim()) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()]
      }));
      setPrerequisiteInput('');
    }
  };

  const handleRemovePrerequisite = (index) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const handleAddObjective = () => {
    if (objectiveInput.trim()) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objectiveInput.trim()]
      }));
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Validate learning objectives length (max 500 chars each)
      const invalidObjectives = formData.learningObjectives.filter(obj => obj.length > 500);
      if (invalidObjectives.length > 0) {
        setError(`วัตถุประสงค์การเรียนรู้บางข้อยาวเกิน 500 ตัวอักษร`);
        return;
      }

      // Validate prerequisites length (max 200 chars each)
      const invalidPrereqs = formData.prerequisites.filter(prereq => prereq.length > 200);
      if (invalidPrereqs.length > 0) {
        setError(`ความรู้พื้นฐานที่ต้องมีบางข้อยาวเกิน 200 ตัวอักษร`);
        return;
      }

      // Validate tags length (max 50 chars each)
      const invalidTags = formData.tags.filter(tag => tag.length > 50);
      if (invalidTags.length > 0) {
        setError(`Tags บางข้อยาวเกิน 50 ตัวอักษร`);
        return;
      }

      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        difficultyLevel: parseInt(formData.difficultyLevel) || 1,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        prerequisites: formData.prerequisites.length > 0 ? formData.prerequisites : undefined,
        learningObjectives: formData.learningObjectives.length > 0 ? formData.learningObjectives : undefined
      };

      console.log('Submitting course data:', submitData);

      if (isEdit) {
        await courseService.updateCourse(id, submitData);
        alert('อัปเดตหลักสูตรเรียบร้อย');
      } else {
        await courseService.createCourse(submitData);
        alert('สร้างหลักสูตรเรียบร้อย');
      }
      
      navigate('/teacher/courses');
    } catch (err) {
      console.error('Course form error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึก';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(e => e.message || e).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/courses')}
          >
            <ArrowLeft size={20} className="mr-2" /> กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'แก้ไขหลักสูตร' : 'สร้างหลักสูตรใหม่'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'แก้ไขข้อมูลหลักสูตร' : 'สร้างหลักสูตรใหม่ในระบบ'}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            ข้อมูลพื้นฐาน
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ชื่อหลักสูตร <span className="text-red-500">*</span>
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="เช่น JavaScript Fundamentals"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                คำอธิบายสั้น
              </label>
              <Input
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="คำอธิบายสั้นๆ เกี่ยวกับหลักสูตร..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.shortDescription.length}/500 ตัวอักษร
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                คำอธิบายรายละเอียด
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="อธิบายรายละเอียดเกี่ยวกับหลักสูตร..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  หมวดหมู่
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  ระดับความยาก (1-5)
                </label>
                <Input
                  type="number"
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={(e) => handleNumberChange('difficultyLevel', e.target.value)}
                  min="1"
                  max="5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ระยะเวลาโดยประมาณ (ชั่วโมง)
                </label>
                <Input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleNumberChange('estimatedDuration', e.target.value)}
                  min="1"
                  placeholder="เช่น 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จำนวนนักเรียนสูงสุด
                </label>
                <Input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={(e) => handleNumberChange('maxStudents', e.target.value)}
                  min="1"
                  placeholder="ไม่จำกัด"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Tags */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag size={20} />
            Tags
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="เพิ่ม tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                เพิ่ม
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Prerequisites */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={20} />
            ความรู้พื้นฐานที่ต้องมี
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={prerequisiteInput}
                onChange={(e) => setPrerequisiteInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrerequisite())}
                placeholder="เช่น รู้ JavaScript เบื้องต้น"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddPrerequisite}>
                เพิ่ม
              </Button>
            </div>
            
            {formData.prerequisites.length > 0 && (
              <ul className="space-y-2">
                {formData.prerequisites.map((prereq, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white">{prereq}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrerequisite(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Learning Objectives */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            วัตถุประสงค์การเรียนรู้
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                placeholder="เช่น เข้าใจ React concepts"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddObjective}>
                เพิ่ม
              </Button>
            </div>
            
            {formData.learningObjectives.length > 0 && (
              <ul className="space-y-2">
                {formData.learningObjectives.map((objective, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white">{objective}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/teacher/courses')}
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
                {isEdit ? 'อัปเดต' : 'สร้าง'}หลักสูตร
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;

