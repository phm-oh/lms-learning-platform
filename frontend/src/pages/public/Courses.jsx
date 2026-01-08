// File: Courses.jsx
// Path: frontend/src/pages/public/Courses.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Search, BookOpen, Users, Star, ArrowLeft, Filter } from 'lucide-react';
import courseService from '../../services/courseService';

const Courses = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await courseService.getAllCourses({
        //   search: searchTerm,
        //   category: selectedCategory,
        //   level: selectedLevel
        // });
        
        // Mock data for now
        const mockCourses = [
          {
            id: 1,
            title: "JavaScript สำหรับมือใหม่",
            description: "เรียนรู้ JavaScript ตั้งแต่พื้นฐานจนถึงระดับกลาง",
            thumbnail: "https://via.placeholder.com/300x200?text=JavaScript",
            level: "beginner",
            enrollmentCount: 1250,
            rating: 4.8,
            category: { name: "Programming", color: "#007bff" },
            teacher: { firstName: "อาจารย์", lastName: "สมชาย" }
          },
          {
            id: 2,
            title: "React เพื่อการพัฒนา Web",
            description: "เรียนรู้ React framework สำหรับสร้างเว็บแอปพลิเคชัน",
            thumbnail: "https://via.placeholder.com/300x200?text=React",
            level: "intermediate",
            enrollmentCount: 980,
            rating: 4.9,
            category: { name: "Web Development", color: "#28a745" },
            teacher: { firstName: "อาจารย์", lastName: "สมหญิง" }
          },
          {
            id: 3,
            title: "Networking พื้นฐาน",
            description: "เข้าใจระบบเครือข่ายและการเชื่อมต่อ",
            thumbnail: "https://via.placeholder.com/300x200?text=Networking",
            level: "beginner",
            enrollmentCount: 750,
            rating: 4.7,
            category: { name: "Networking", color: "#dc3545" },
            teacher: { firstName: "อาจารย์", lastName: "ณัฐ" }
          }
        ];
        
        setCourses(mockCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchTerm, selectedCategory, selectedLevel]);

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category.name === selectedCategory;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>กลับหน้าหลัก</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">หลักสูตรที่มีในปัจจุบัน</h1>
          <p className="text-xl text-white/90">
            เลือกหลักสูตรที่สนใจและเริ่มต้นการเรียนรู้
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="ค้นหาหลักสูตร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">ทุกหมวดหมู่</option>
                <option value="Programming">Programming</option>
                <option value="Web Development">Web Development</option>
                <option value="Networking">Networking</option>
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">ทุกระดับ</option>
                <option value="beginner">เริ่มต้น</option>
                <option value="intermediate">ปานกลาง</option>
                <option value="advanced">ขั้นสูง</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div 
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: course.category.color }}
                  >
                    ฟรี
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: `${course.category.color}20`,
                        color: course.category.color
                      }}
                    >
                      {course.category.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{course.enrollmentCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span>{course.rating}</span>
                    </div>
                    <span className="capitalize">{course.level}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>ผู้สอน: {course.teacher.firstName} {course.teacher.lastName}</p>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleViewCourse(course.id)}
                  >
                    ดูรายละเอียด
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 text-lg">ไม่พบหลักสูตรที่ค้นหา</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedLevel('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Courses;

