// File: ComponentShowcase.jsx
// Path: frontend/src/components/examples/ComponentShowcase.jsx

import React, { useState } from 'react';
import { 
  Button, 
  PrimaryButton, 
  SecondaryButton, 
  SuccessButton, 
  WarningButton, 
  DangerButton, 
  OutlineButton, 
  GhostButton, 
  GradientButton,
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter, 
  CourseCard, 
  StatsCard,
  Input, 
  SearchInput, 
  PasswordInput, 
  Textarea, 
  FileInput 
} from '../ui';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  Play, 
  Download, 
  Heart, 
  Star, 
  Search,
  Bell,
  Settings,
  User,
  Mail,
  Lock,
  Eye,
  Calendar,
  Clock,
  Globe,
  Zap
} from 'lucide-react';

/**
 * Component Showcase - หน้าทดสอบและแสดงผล UI Components
 * ใช้สำหรับตรวจสอบการทำงานและรูปลักษณ์ของ components
 */
const ComponentShowcase = () => {
  const [searchValue, setSearchValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            🎨 LMS UI Components Showcase
          </h1>
          <p className="text-xl text-purple-200">
            ทดสอบและแสดงผล UI Components ทั้งหมดของระบบ
          </p>
        </div>

        {/* Button Components */}
        <section>
          <Card variant="glass" padding="lg" className="backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800 flex items-center">
                <Zap className="mr-3" />
                Button Components
              </CardTitle>
              <p className="text-gray-600">ปุ่มในรูปแบบและขนาดต่างๆ</p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Button Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Button Variants</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PrimaryButton icon={Play}>Primary</PrimaryButton>
                  <SecondaryButton icon={Download}>Secondary</SecondaryButton>
                  <SuccessButton icon={Award}>Success</SuccessButton>
                  <WarningButton icon={Bell}>Warning</WarningButton>
                  <DangerButton icon={Heart}>Danger</DangerButton>
                  <OutlineButton icon={Star}>Outline</OutlineButton>
                  <GhostButton icon={Settings}>Ghost</GhostButton>
                  <GradientButton icon={Globe}>Gradient</GradientButton>
                </div>
              </div>

              {/* Button Sizes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Button Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="xs">Extra Small</Button>
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Button States</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="primary">Normal</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button variant="primary" fullWidth>Full Width</Button>
                </div>
              </div>

              {/* Icon Positions */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Icon Positions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button variant="secondary" icon={User} iconPosition="left">Left Icon</Button>
                  <Button variant="secondary" icon={Mail} iconPosition="right">Right Icon</Button>
                  <Button variant="secondary" icon={Star} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Components */}
        <section>
          <Card variant="glass" padding="lg" className="backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800 flex items-center">
                <BookOpen className="mr-3" />
                Card Components
              </CardTitle>
              <p className="text-gray-600">การ์ดในรูปแบบต่างๆ สำหรับแสดงเนื้อหา</p>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Card Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Card Variants</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card variant="default" padding="md">
                    <h4 className="font-semibold mb-2">Default Card</h4>
                    <p className="text-gray-600">การ์ดแบบปกติสำหรับเนื้อหาทั่วไป</p>
                  </Card>
                  
                  <Card variant="elevated" padding="md" hover>
                    <h4 className="font-semibold mb-2">Elevated Card</h4>
                    <p className="text-gray-600">การ์ดที่มีเงาและ hover effect</p>
                  </Card>
                  
                  <Card variant="glass" padding="md" className="backdrop-blur border-white/30">
                    <h4 className="font-semibold mb-2 text-white">Glass Card</h4>
                    <p className="text-white/80">การ์ดแบบกระจกโปร่งแสง</p>
                  </Card>
                </div>
              </div>

              {/* Colored Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Colored Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card variant="purple" padding="md">
                    <h4 className="font-semibold text-purple-800">Purple Card</h4>
                    <p className="text-purple-600">สำหรับเนื้อหาสำคัญ</p>
                  </Card>
                  
                  <Card variant="blue" padding="md">
                    <h4 className="font-semibold text-blue-800">Blue Card</h4>
                    <p className="text-blue-600">สำหรับข้อมูลทั่วไป</p>
                  </Card>
                  
                  <Card variant="green" padding="md">
                    <h4 className="font-semibold text-green-800">Green Card</h4>
                    <p className="text-green-600">สำหรับข้อมูลเชิงบวก</p>
                  </Card>
                  
                  <Card variant="yellow" padding="md">
                    <h4 className="font-semibold text-amber-800">Yellow Card</h4>
                    <p className="text-amber-600">สำหรับคำเตือน</p>
                  </Card>
                </div>
              </div>

              {/* Stats Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Stats Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatsCard
                    title="นักเรียนทั้งหมด"
                    value="1,250"
                    icon={Users}
                    color="blue"
                    trend={{ positive: true, value: 12 }}
                  />
                  <StatsCard
                    title="รายวิชาที่เปิดสอน"
                    value="89"
                    icon={BookOpen}
                    color="purple"
                    trend={{ positive: true, value: 8 }}
                  />
                  <StatsCard
                    title="แบบทดสอบ"
                    value="356"
                    icon={Award}
                    color="green"
                    trend={{ positive: false, value: 3 }}
                  />
                  <StatsCard
                    title="ความพึงพอใจ"
                    value="4.8"
                    icon={Star}
                    color="yellow"
                  />
                </div>
              </div>

              {/* Course Cards */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Course Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <CourseCard
                    title="JavaScript เบื้องต้น"
                    teacher="อาจารย์สมชาย"
                    thumbnail="/api/placeholder/64/64"
                    progress={75}
                    rating="4.8"
                    students="156"
                    duration="12 ชั่วโมง"
                    category="Programming"
                    gradient="from-blue-500 to-blue-600"
                    onClick={() => alert('เปิดวิชา JavaScript')}
                  />
                  
                  <CourseCard
                    title="UI/UX Design Fundamentals"
                    teacher="อาจารย์สมหญิง"
                    thumbnail="/api/placeholder/64/64"
                    progress={45}
                    rating="4.9"
                    students="89"
                    duration="8 ชั่วโมง"
                    category="Design"
                    gradient="from-pink-500 to-pink-600"
                    onClick={() => alert('เปิดวิชา UI/UX')}
                  />
                  
                  <CourseCard
                    title="การเขียนโปรแกรม Python"
                    teacher="อาจารย์วิทยา"
                    thumbnail="/api/placeholder/64/64"
                    progress={0}
                    rating="4.7"
                    students="234"
                    duration="20 ชั่วโมง"
                    category="Programming"
                    gradient="from-green-500 to-green-600"
                    onClick={() => alert('เปิดวิชา Python')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Input Components */}
        <section>
          <Card variant="glass" padding="lg" className="backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800 flex items-center">
                <Settings className="mr-3" />
                Input Components
              </CardTitle>
              <p className="text-gray-600">ช่องกรอกข้อมูลในรูปแบบต่างๆ</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Basic Inputs */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Basic Inputs</h3>
                  
                  <Input
                    label="ชื่อผู้ใช้"
                    placeholder="กรอกชื่อผู้ใช้"
                    icon={User}
                    helperText="ชื่อผู้ใช้จะแสดงในโปรไฟล์ของคุณ"
                  />
                  
                  <Input
                    label="อีเมล"
                    type="email"
                    placeholder="กรอกอีเมล"
                    icon={Mail}
                    required
                  />
                  
                  <PasswordInput
                    label="รหัสผ่าน"
                    placeholder="กรอกรหัสผ่าน"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    required
                    helperText="รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
                  />
                  
                  <SearchInput
                    label="ค้นหา"
                    placeholder="ค้นหาวิชาเรียน..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    clearable
                  />
                </div>

                {/* Advanced Inputs */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Advanced Inputs</h3>
                  
                  <Input
                    label="เบอร์โทรศัพท์"
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    variant="filled"
                    maxLength={10}
                  />
                  
                  <Input
                    label="วันเกิด"
                    type="date"
                    variant="outlined"
                    icon={Calendar}
                  />
                  
                  <Textarea
                    label="รายละเอียดเพิ่มเติม"
                    placeholder="กรอกรายละเอียด..."
                    value={textareaValue}
                    onChange={(e) => setTextareaValue(e.target.value)}
                    rows={4}
                    maxLength={200}
                  />
                  
                  <FileInput
                    label="อัปโหลดไฟล์"
                    accept="image/*"
                    multiple
                    onChange={(e) => setSelectedFile(e.target.files)}
                    helperText="เลือกไฟล์รูปภาพ (jpg, png)"
                  />
                </div>

                {/* Input States */}
                <div className="space-y-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800">Input States</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Normal State"
                      placeholder="ปกติ"
                      icon={User}
                    />
                    
                    <Input
                      label="Error State"
                      placeholder="มีข้อผิดพลาด"
                      icon={Mail}
                      error="อีเมลไม่ถูกต้อง"
                    />
                    
                    <Input
                      label="Success State"
                      placeholder="ถูกต้อง"
                      icon={Award}
                      success
                      value="correct@email.com"
                      readOnly
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Disabled State"
                      placeholder="ไม่สามารถแก้ไขได้"
                      disabled
                      value="disabled value"
                    />
                    
                    <Input
                      label="Read Only"
                      placeholder="อ่านอย่างเดียว"
                      readOnly
                      value="read only value"
                    />
                    
                    <Input
                      label="Glass Variant"
                      placeholder="แบบกระจก"
                      variant="glass"
                      icon={Eye}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interactive Demo */}
        <section>
          <Card variant="gradient" padding="lg" className="text-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-white">
                <TrendingUp className="mr-3" />
                Interactive Demo
              </CardTitle>
              <p className="text-purple-100">ทดสอบการทำงานของ components แบบ interactive</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Form Example */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">ตัวอย่างฟอร์ม</h3>
                  
                  <Input
                    label="ชื่อ-นามสกุล"
                    placeholder="กรอกชื่อ-นามสกุล"
                    variant="glass"
                    className="text-white placeholder-purple-200"
                  />
                  
                  <SearchInput
                    label="ค้นหาวิชา"
                    placeholder="ค้นหาวิชาที่สนใจ..."
                    variant="glass"
                    className="text-white placeholder-purple-200"
                    clearable
                  />
                  
                  <div className="flex space-x-4">
                    <Button variant="secondary" fullWidth>
                      ยกเลิก
                    </Button>
                    <PrimaryButton fullWidth>
                      บันทึก
                    </PrimaryButton>
                  </div>
                </div>

                {/* Button Playground */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">ปุ่มต่างๆ</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="secondary" 
                      icon={Play}
                      onClick={() => alert('เริ่มเรียน!')}
                    >
                      เริ่มเรียน
                    </Button>
                    
                    <Button 
                      variant="success" 
                      icon={Download}
                      onClick={() => alert('ดาวน์โหลด!')}
                    >
                      ดาวน์โหลด
                    </Button>
                    
                    <Button 
                      variant="warning" 
                      icon={Bell}
                      onClick={() => alert('แจ้งเตือน!')}
                    >
                      แจ้งเตือน
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      icon={Heart}
                      onClick={() => alert('ถูกใจ!')}
                    >
                      ถูกใจ
                    </Button>
                  </div>
                  
                  <GradientButton 
                    fullWidth 
                    icon={Star}
                    onClick={() => alert('ปุ่มไล่สี!')}
                  >
                    ปุ่มไล่สีพิเศษ
                  </GradientButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <Card variant="dark" padding="lg" className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            🎉 Component Showcase เสร็จสมบูรณ์!
          </h3>
          <p className="text-gray-300 mb-4">
            UI Components ทั้งหมดพร้อมใช้งานในระบบ LMS แล้ว
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" size="sm">
              ดู Documentation
            </Button>
            <PrimaryButton size="sm">
              เริ่มใช้งาน
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComponentShowcase;