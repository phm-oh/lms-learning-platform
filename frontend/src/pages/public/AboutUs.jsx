// File: AboutUs.jsx
// Path: frontend/src/pages/public/AboutUs.jsx

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { GraduationCap, BookOpen, Users, Award, Code, Server, Network, ArrowLeft } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Code,
      title: "การเขียนโปรแกรม",
      description: "เรียนรู้การเขียนโปรแกรมตั้งแต่พื้นฐานจนถึงระดับสูง"
    },
    {
      icon: Network,
      title: "Networking",
      description: "เข้าใจระบบเครือข่ายและการเชื่อมต่อ"
    },
    {
      icon: Server,
      title: "DevOps & Server",
      description: "จัดการระบบและพัฒนาแอปพลิเคชัน"
    },
    {
      icon: BookOpen,
      title: "เทคโนโลยีอื่นๆ",
      description: "เนื้อหาครอบคลุมทักษะด้านเทคโนโลยีสารสนเทศ"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>กลับหน้าหลัก</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">เกี่ยวกับเรา</h1>
          <p className="text-xl text-white/90 max-w-3xl">
            kruOh-IT: แพลตฟอร์มการเรียนรู้เทคโนโลยีสารสนเทศสำหรับนักเรียนแผนกวิชาเทคโนโลยีสารสนเทศ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Teacher Info */}
        <Card className="mb-12 p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              ภ.ช.
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                ครูภาณุเมศ ชุมภูนท์
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                ครูชำนาญการพิเศษ<br />
                แผนกวิชาเทคโนโลยีสารสนเทศ<br />
                วิทยาลัยอาชีวศึกษาอุดรธานี
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  ปวช.
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  ปวส.
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  เทคโนโลยีบัณฑิต
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">วัตถุประสงค์</h2>
          <Card className="p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              เว็บไซต์ <span className="font-bold text-primary-600">kruOh-IT</span> สร้างขึ้นเพื่อส่งเสริมทักษะการเรียนรู้ด้านเทคโนโลยีสารสนเทศ 
              โดยเฉพาะการเรียนโปรแกรมมิ่ง, Networking, DevOps, Server และเทคโนโลยีอื่นๆ ที่เกี่ยวข้อง
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              แพลตฟอร์มนี้ช่วยจัดระบบการเรียนการสอนให้ผู้เรียนมีการพัฒนาทักษะเป็นลำดับขั้นตอน 
              ตั้งแต่พื้นฐานจนถึงระดับสูง เพื่อให้ผู้เรียนสามารถเข้าใจและนำไปประยุกต์ใช้ได้จริง
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              <span className="font-semibold">เรียนฟรี ไม่มีค่าใช้จ่าย</span> โดยเฉพาะผู้เรียน นักเรียน นักศึกษา 
              แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาอุดรธานี ทั้งระดับ ปวช. ปวส. และเทคโนโลยีบัณฑิต
            </p>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">เนื้อหาการเรียนรู้</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <feature.icon className="text-primary-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">ข้อดีของการเรียน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">เรียนฟรี</h3>
                  <p className="text-gray-600">
                    ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น เหมาะสำหรับนักเรียน นักศึกษา
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">เรียนเป็นขั้นตอน</h3>
                  <p className="text-gray-600">
                    เนื้อหาจัดเรียงจากง่ายไปยาก พัฒนาทักษะอย่างเป็นระบบ
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">สำหรับนักเรียนแผนก IT</h3>
                  <p className="text-gray-600">
                    ออกแบบมาเพื่อนักเรียนแผนกวิชาเทคโนโลยีสารสนเทศโดยเฉพาะ
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="p-8 bg-gradient-to-r from-primary-50 to-purple-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              พร้อมเริ่มต้นการเรียนรู้แล้วหรือยัง?
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              ลงทะเบียนรายวิชาและเริ่มพัฒนาทักษะด้านเทคโนโลยีสารสนเทศของคุณวันนี้
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
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
                {isAuthenticated ? 'ไปที่ Dashboard' : 'เข้าสู่ระบบ'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4"
                onClick={() => navigate('/courses')}
              >
                ดูหลักสูตรทั้งหมด
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;



