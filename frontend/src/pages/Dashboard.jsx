// File: Dashboard.jsx
// Path: frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Clock,
    BookOpen,
    Award,
    TrendingUp,
    MoreHorizontal,
    PlayCircle,
    Calendar as CalendarIcon,
    ChevronRight
} from 'lucide-react';
import { Card, Button } from '../components/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import studentService from '../services/studentService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // TODO: Replace with actual API call when endpoint is ready
                // const data = await studentService.getDashboard();
                
                // Mock data for now - will be replaced with real API
                const mockData = {
                    stats: {
                        totalCourses: 5,
                        activeCourses: 3,
                        completedCourses: 2,
                        totalLessonsCompleted: 45,
                        totalQuizzesTaken: 28,
                        averageScore: 78.5,
                        totalStudyTime: 2340
                    },
                    recentCourses: [],
                    upcomingQuizzes: [],
                    recentActivity: [],
                    monthlyProgress: [
                        { name: 'Jan', value: 20 },
                        { name: 'Feb', value: 45 },
                        { name: 'Mar', value: 30 },
                        { name: 'Apr', value: 70 },
                        { name: 'May', value: 45 },
                        { name: 'Jun', value: 60 },
                        { name: 'Jul', value: 35 },
                        { name: 'Aug', value: 55 },
                        { name: 'Sep', value: 40 },
                        { name: 'Oct', value: 80 },
                        { name: 'Nov', value: 65 },
                        { name: 'Dec', value: 50 },
                    ]
                };
                
                setDashboardData(mockData);
            } catch (err) {
                setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
                <Card className="p-8 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
                </Card>
            </div>
        );
    }

    const stats = dashboardData?.stats || {};
    const activityData = dashboardData?.monthlyProgress || [
        { name: 'Jan', value: 20 },
        { name: 'Feb', value: 45 },
        { name: 'Mar', value: 30 },
        { name: 'Apr', value: 70 },
        { name: 'May', value: 45 },
        { name: 'Jun', value: 60 },
        { name: 'Jul', value: 35 },
        { name: 'Aug', value: 55 },
        { name: 'Sep', value: 40 },
        { name: 'Oct', value: 80 },
        { name: 'Nov', value: 65 },
        { name: 'Dec', value: 50 },
    ];
    const myCourses = dashboardData?.recentCourses || [
        { title: 'Learn UI Design', progress: 27, color: 'bg-primary-500', image: '🎨' },
        { title: 'Web Development', progress: 70, color: 'bg-yellow-500', image: '💻' },
        { title: 'Data Science', progress: 16, color: 'bg-pink-500', image: '📊' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 space-y-8">

                {/* Welcome Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            สวัสดี, {user?.firstName || 'ผู้ใช้'}! 👋
                        </h1>
                        <p className="text-gray-500 mt-1">เริ่มต้นการเรียนรู้ของคุณวันนี้</p>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-400">
                            {new Date().toLocaleDateString('th-TH', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {stats.totalCourses || 0}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">หลักสูตรทั้งหมด</p>
                            </div>
                            <div className="p-2 rounded-xl bg-blue-50">
                                <BookOpen size={20} className="text-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400">
                                {stats.activeCourses || 0} หลักสูตรที่กำลังเรียน
                            </span>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '0%'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">คะแนนเฉลี่ย</p>
                            </div>
                            <div className="p-2 rounded-xl bg-yellow-50">
                                <TrendingUp size={20} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400">
                                {stats.totalQuizzesTaken || 0} แบบทดสอบ
                            </span>
                        </div>
                    </Card>

                    <Card className="flex flex-col justify-between h-32">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {stats.totalLessonsCompleted || 0}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">บทเรียนที่เสร็จแล้ว</p>
                            </div>
                            <div className="p-2 rounded-xl bg-pink-50">
                                <FileText size={20} className="text-pink-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400">
                                {stats.totalStudyTime ? `${Math.floor(stats.totalStudyTime / 60)} ชั่วโมง` : '0 ชั่วโมง'}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* My Courses */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">หลักสูตรของฉัน</h2>
                        <button 
                            onClick={() => navigate('/my-courses')}
                            className="text-sm text-primary-600 font-medium hover:text-primary-700"
                        >
                            ดูทั้งหมด
                        </button>
                    </div>
                    {myCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {myCourses.map((course, index) => (
                                <Card key={index} className="group cursor-pointer border-transparent hover:border-primary-100">
                                    <div className={`h-24 rounded-xl mb-4 flex items-center justify-center text-4xl ${course.color} bg-opacity-10`}>
                                        {course.image}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <span>{course.progress}% เสร็จแล้ว</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                                        <div
                                            className={`h-1.5 rounded-full ${course.color}`}
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        className="w-full py-2 text-sm rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all"
                                        onClick={() => navigate(`/my-courses/${course.id}`)}
                                    >
                                        เรียนต่อ
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-600 mb-4">คุณยังไม่ได้ลงทะเบียนเรียนหลักสูตรใด</p>
                            <Button 
                                variant="primary"
                                onClick={() => navigate('/courses')}
                            >
                                ดูหลักสูตรทั้งหมด
                            </Button>
                        </Card>
                    )}
                </section>

                {/* Monthly Progress Chart */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">ความคืบหน้ารายเดือน</h2>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span> ปัจจุบัน
                            </span>
                        </div>
                    </div>
                    <Card className="h-80 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </section>
            </div>

            {/* Right Column (Widgets) */}
            <div className="space-y-8">

                {/* Calendar Widget */}
                <Card className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">ปฏิทิน</h3>
                    </div>
                    <div className="p-4">
                        {/* Simple Calendar Mockup */}
                        <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-gray-400 text-xs">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-sm">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(date => {
                                const isToday = date === 12;
                                const isEvent = [15, 22].includes(date);
                                return (
                                    <div
                                        key={date}
                                        className={`
                      aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all
                      ${isToday ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'hover:bg-gray-50 text-gray-700'}
                      ${isEvent ? 'relative' : ''}
                    `}
                                    >
                                        {date}
                                        {isEvent && <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Today's Activity */}
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">กิจกรรมวันนี้</h3>
                        <MoreHorizontal size={20} className="text-gray-400 cursor-pointer" />
                    </div>
                    <div className="relative h-48 flex items-center justify-center">
                        {/* Circular Progress Mockup */}
                        <div className="w-40 h-40 rounded-full border-[12px] border-gray-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-[12px] border-primary-500 border-t-transparent border-l-transparent rotate-45"></div>
                            <div className="text-center">
                                <span className="text-3xl font-bold text-gray-900">
                                    {stats.totalLessonsCompleted ? 
                                        Math.round((stats.totalLessonsCompleted / (stats.totalLessonsCompleted + 10)) * 100) : 
                                        0}%
                                </span>
                                <p className="text-xs text-gray-400">เสร็จแล้ว</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            <span className="text-gray-600">กำลังเรียน</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                            <span className="text-gray-600">พัก</span>
                        </div>
                    </div>
                </Card>

                {/* Upcoming Quizzes */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">แบบทดสอบที่ใกล้ถึงกำหนด</h3>
                        <MoreHorizontal size={20} className="text-gray-400 cursor-pointer" />
                    </div>
                    {dashboardData?.upcomingQuizzes && dashboardData.upcomingQuizzes.length > 0 ? (
                        <div className="space-y-4">
                            {dashboardData.upcomingQuizzes.map((quiz, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Award className="text-primary-600" size={20} />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{quiz.title}</p>
                                            <p className="text-[10px] text-gray-400">{quiz.course}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                                        {new Date(quiz.dueDate).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Award className="mx-auto mb-2 text-gray-400" size={32} />
                            <p className="text-sm text-gray-500">ไม่มีแบบทดสอบที่ใกล้ถึงกำหนด</p>
                        </div>
                    )}
                    <Button 
                        variant="outline" 
                        className="w-full mt-4 text-xs py-2"
                        onClick={() => navigate('/quizzes')}
                    >
                        ดูทั้งหมด
                    </Button>
                </Card>

            </div>
        </div>
    );
};

// Helper Icon for stats
const FileText = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export default Dashboard;
