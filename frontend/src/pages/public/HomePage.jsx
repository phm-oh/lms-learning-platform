
// File: HomePage.jsx
// Path: frontend/src/pages/public/HomePage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: "เรียนรู้ที่ไหนก็ได้",
      description: "เข้าถึงเนื้อหาการเรียนได้ทุกที่ทุกเวลา ผ่านอุปกรณ์ที่คุณสะดวก",
      icon: "🌐",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "ครูผู้เชี่ยวชาญ", 
      description: "เรียนจากครูที่มีประสบการณ์และความเชี่ยวชาญในสาขาต่างๆ",
      icon: "👨‍🏫",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "ประเมินผลแบบ Real-time",
      description: "ติดตามความก้าวหน้าและผลการเรียนแบบเรียลไทม์",
      icon: "📊",
      gradient: "from-green-500 to-teal-500"
    },
    {
      title: "เรียนเป็นขั้นตอน",
      description: "เนื้อหาจัดเรียงจากง่ายไปยาก พัฒนาทักษะอย่างเป็นระบบ",
      icon: "📚",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const popularCourses = [
    {
      id: 1,
      title: "JavaScript สำหรับมือใหม่",
      instructor: "อาจารย์สมชาย",
      students: 1250,
      rating: 4.8,
      image: "https://via.placeholder.com/300x200?text=JavaScript",
      price: "ฟรี",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      id: 2, 
      title: "React เพื่อการพัฒนา Web",
      instructor: "อาจารย์สมหญิง",
      students: 980,
      rating: 4.9,
      image: "https://via.placeholder.com/300x200?text=React",
      price: "ฟรี",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      id: 3,
      title: "UI/UX Design พื้นฐาน",
      instructor: "อาจารย์ณัฐ",
      students: 750,
      rating: 4.7,
      image: "https://via.placeholder.com/300x200?text=UI/UX",
      price: "ฟรี", 
      gradient: "from-pink-400 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              เรียนรู้ไปกับ
              <span className="bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
                {" "}kruOh-IT
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              แพลตฟอร์มการเรียนรู้เทคโนโลยีสารสนเทศสำหรับนักเรียนแผนกวิชาเทคโนโลยีสารสนเทศ
              ส่งเสริมการเรียนรู้เพิ่มศักยภาพสำหรับการเรียนรู้ที่มีประสิทธิภาพ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8 py-4"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/dashboard');
                  } else {
                    navigate('/login');
                  }
                }}
              >
                เริ่มเรียนฟรี
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4"
                onClick={() => navigate('/about')}
              >
                เรียนรู้เพิ่มเติม
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              kruOh-IT
            </h2>
            <p className="text-xl text-gray-600">
              ส่งเสริมการเรียนรู้เพิ่มศักยภาพสำหรับการเรียนรู้ที่มีประสิทธิภาพ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="text-center group hover:shadow-xl transition-all duration-300 border-0"
                hover
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              หลักสูตรที่มีในปัจจุบัน
            </h2>
            <p className="text-xl text-gray-600">
              เลือกหลักสูตรที่สนใจและเริ่มต้นการเรียนรู้
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCourses.map((course) => (
              <Card 
                key={course.id}
                className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0"
                hover
              >
                <div className="relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${course.gradient}`}>
                    ฟรี
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{course.instructor}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>👥 {course.students} นักเรียน</span>
                    <span>⭐ {course.rating}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/courses')}
            >
              ดูหลักสูตรทั้งหมด
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            พร้อมเริ่มต้นการเรียนรู้แล้วหรือยัง?
          </h2>
          <p className="text-xl text-white text-opacity-90 mb-8 max-w-2xl mx-auto">
            ลงทะเบียนรายวิชาและเริ่มพัฒนาทักษะด้านเทคโนโลยีสารสนเทศของคุณวันนี้
          </p>
          <Button 
            variant="secondary"
            size="lg"
            className="px-8 py-4 text-primary-600 hover:text-primary-700"
            onClick={() => {
              if (isAuthenticated) {
                navigate('/dashboard');
              } else {
                navigate('/register');
              }
            }}
          >
            ลงทะเบียนรายวิชา
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;