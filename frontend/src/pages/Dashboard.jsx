// File: Dashboard.jsx
// Path: frontend/src/pages/Dashboard.jsx

import React from 'react';
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

const Dashboard = () => {
    // Mock Data
    const stats = [
        { label: 'Time Spend', value: '15:30:45', change: '+1.5%', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Course Progress', value: '75%', change: '-0.35%', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { label: 'Assignments', value: '17/33', change: '+1', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-50' },
    ];

    const activityData = [
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

    const myCourses = [
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
                        <h1 className="text-3xl font-bold text-gray-900">Hello, Phanumet! 👋</h1>
                        <p className="text-gray-500 mt-1">Good Morning, Let's start learning</p>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                        <Card key={index} className="flex flex-col justify-between h-32">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                                </div>
                                <div className={`p-2 rounded-xl ${stat.bg}`}>
                                    <stat.icon size={20} className={stat.color} />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <span className={stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                                    {stat.change}
                                </span>
                                <span className="text-gray-400">This Week</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* My Courses */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">My Course</h2>
                        <button className="text-sm text-primary-600 font-medium hover:text-primary-700">See all</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {myCourses.map((course, index) => (
                            <Card key={index} className="group cursor-pointer border-transparent hover:border-primary-100">
                                <div className={`h-24 rounded-xl mb-4 flex items-center justify-center text-4xl ${course.color} bg-opacity-10`}>
                                    {course.image}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span>{course.progress}% Completed</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                                    <div
                                        className={`h-1.5 rounded-full ${course.color}`}
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                                <Button variant="primary" className="w-full py-2 text-sm rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all">
                                    Continue
                                </Button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Monthly Progress Chart */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Monthly Progress</h2>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span> Current
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-pink-500"></span> Previous
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
                        <h3 className="font-bold text-gray-900">Event Dates</h3>
                        <button className="text-xs text-primary-600">See all</button>
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
                        <h3 className="font-bold text-gray-900">Today's Activity</h3>
                        <MoreHorizontal size={20} className="text-gray-400 cursor-pointer" />
                    </div>
                    <div className="relative h-48 flex items-center justify-center">
                        {/* Circular Progress Mockup */}
                        <div className="w-40 h-40 rounded-full border-[12px] border-gray-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-[12px] border-primary-500 border-t-transparent border-l-transparent rotate-45"></div>
                            <div className="text-center">
                                <span className="text-3xl font-bold text-gray-900">75%</span>
                                <p className="text-xs text-gray-400">Completed</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            <span className="text-gray-600">Learning</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                            <span className="text-gray-600">Rest</span>
                        </div>
                    </div>
                </Card>

                {/* Top Performers */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">Top Performer</h3>
                        <MoreHorizontal size={20} className="text-gray-400 cursor-pointer" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'Rasel Mondol', score: '85/100', img: 'https://ui-avatars.com/api/?name=RM&background=random' },
                            { name: 'Jenny Wilson', score: '78/100', img: 'https://ui-avatars.com/api/?name=JW&background=random' },
                            { name: 'Robert Fox', score: '75/100', img: 'https://ui-avatars.com/api/?name=RF&background=random' },
                        ].map((user, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                                    <img src={user.img} alt={user.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-[10px] text-gray-400">Student</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">{user.score}</span>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4 text-xs py-2">View All</Button>
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
