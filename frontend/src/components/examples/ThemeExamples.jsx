// File: ThemeExamples.jsx
// Path: frontend/src/components/examples/ThemeExamples.jsx

import React from 'react';
import { 
  BookOpen, 
  Play, 
  Users, 
  Award, 
  TrendingUp, 
  Clock,
  Star,
  ArrowRight,
  Bell,
  Search,
  Filter
} from 'lucide-react';

const ThemeExamples = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900">
      
      {/* Header Example */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">LearnSync</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="glass-effect p-2 rounded-lg text-white hover:bg-white/20 transition-all">
                <Search className="w-5 h-5" />
              </button>
              <button className="glass-effect p-2 rounded-lg text-white hover:bg-white/20 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="avatar-md">
                <img src="/api/placeholder/40/40" alt="Profile" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        
        {/* Hero Section Example */}
        <section className="text-center mb-12">
          <h1 className="heading-1 mb-4">
            Learn New Skills with Online Courses
          </h1>
          <p className="body-large text-white/80 max-w-2xl mx-auto mb-8">
            Knowledge is power. Share it! You've just uncovered or gained more knowledge and it's time to find that perfect course for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary btn-lg">
              Start Learning
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="btn-secondary btn-lg">
              Browse Courses
            </button>
          </div>
        </section>

        {/* Stats Cards Example */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card-stats">
            <div className="w-12 h-12 bg-gradient-yellow rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">12,000+</h3>
            <p className="text-gray-600">Active Students</p>
          </div>
          
          <div className="card-stats">
            <div className="w-12 h-12 bg-gradient-blue rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">500+</h3>
            <p className="text-gray-600">Online Courses</p>
          </div>
          
          <div className="card-stats">
            <div className="w-12 h-12 bg-gradient-pink rounded-lg flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">98%</h3>
            <p className="text-gray-600">Success Rate</p>
          </div>
          
          <div className="card-stats">
            <div className="w-12 h-12 bg-gradient-teal rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">4.8/5</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </section>

        {/* Course Cards Example */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="heading-2 text-white">Popular Courses</h2>
            <button className="btn-outline text-white border-white/30">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Course Card 1 - Yellow Theme */}
            <div className="card-course group">
              <div className="relative mb-4">
                <div className="w-full h-32 bg-gradient-yellow rounded-lg flex items-center justify-center">
                  <img src="/api/placeholder/200/120" alt="UX Design" className="w-16 h-16 rounded-lg object-cover" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="badge-warning">Published</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Foundation of User Experience (UX) Design
              </h3>
              
              <div className="flex items-center mb-3">
                <div className="avatar-sm mr-2">
                  <img src="/api/placeholder/32/32" alt="Teacher" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-sm text-gray-600">By Sarah Johnson</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>12 hours</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                  <span>4.8</span>
                </div>
              </div>
              
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{width: '75%'}}></div>
              </div>
              
              <button className="btn-primary w-full">Continue Learning</button>
            </div>

            {/* Course Card 2 - Blue Theme */}
            <div className="card-course group">
              <div className="relative mb-4">
                <div className="w-full h-32 bg-gradient-blue rounded-lg flex items-center justify-center">
                  <img src="/api/placeholder/200/120" alt="Cybersecurity" className="w-16 h-16 rounded-lg object-cover" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="badge-info">Published</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Cybersecurity Basics: Protect Yourself Online
              </h3>
              
              <div className="flex items-center mb-3">
                <div className="avatar-sm mr-2">
                  <img src="/api/placeholder/32/32" alt="Teacher" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-sm text-gray-600">By Mike Chen</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>8 hours</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                  <span>4.9</span>
                </div>
              </div>
              
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{width: '50%'}}></div>
              </div>
              
              <button className="btn-primary w-full">Continue Learning</button>
            </div>

            {/* Course Card 3 - Teal Theme */}
            <div className="card-course group">
              <div className="relative mb-4">
                <div className="w-full h-32 bg-gradient-teal rounded-lg flex items-center justify-center">
                  <img src="/api/placeholder/200/120" alt="Business" className="w-16 h-16 rounded-lg object-cover" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="badge-success">Published</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Startup Guide: Launch your own business
              </h3>
              
              <div className="flex items-center mb-3">
                <div className="avatar-sm mr-2">
                  <img src="/api/placeholder/32/32" alt="Teacher" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-sm text-gray-600">By Emma Watson</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>15 hours</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                  <span>4.7</span>
                </div>
              </div>
              
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{width: '25%'}}></div>
              </div>
              
              <button className="btn-primary w-full">Start Course</button>
            </div>

            {/* Course Card 4 - Pink Theme */}
            <div className="card-course group">
              <div className="relative mb-4">
                <div className="w-full h-32 bg-gradient-pink rounded-lg flex items-center justify-center">
                  <img src="/api/placeholder/200/120" alt="Photography" className="w-16 h-16 rounded-lg object-cover" />
                </div>
                <div className="absolute top-2 right-2">
                  <span className="badge-primary">Published</span>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                Photography Masterclass: Shoot & Edit like a Pro
              </h3>
              
              <div className="flex items-center mb-3">
                <div className="avatar-sm mr-2">
                  <img src="/api/placeholder/32/32" alt="Teacher" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-sm text-gray-600">By David Park</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>20 hours</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                  <span>4.9</span>
                </div>
              </div>
              
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{width: '90%'}}></div>
              </div>
              
              <button className="btn-secondary w-full">Complete Course</button>
            </div>
          </div>
        </section>

        {/* Button Examples */}
        <section className="mb-12">
          <h2 className="heading-3 text-white mb-6">Button Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Primary Buttons</h4>
              <div className="space-y-3">
                <button className="btn-primary w-full">Primary Button</button>
                <button className="btn-primary btn-sm w-full">Small Primary</button>
                <button className="btn-primary btn-lg w-full">Large Primary</button>
              </div>
            </div>
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Secondary Buttons</h4>
              <div className="space-y-3">
                <button className="btn-secondary w-full">Secondary Button</button>
                <button className="btn-outline w-full">Outline Button</button>
                <button className="btn-ghost w-full">Ghost Button</button>
              </div>
            </div>
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">State Examples</h4>
              <div className="space-y-3">
                <button className="btn-primary w-full" disabled>Disabled</button>
                <button className="btn-primary w-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </button>
                <button className="btn-primary w-full">
                  <Play className="w-4 h-4 mr-2" />
                  With Icon
                </button>
              </div>
            </div>
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Badge Examples</h4>
              <div className="space-y-3">
                <div><span className="badge-primary">Primary</span></div>
                <div><span className="badge-success">Success</span></div>
                <div><span className="badge-warning">Warning</span></div>
                <div><span className="badge-error">Error</span></div>
                <div><span className="badge-info">Info</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Examples */}
        <section className="mb-12">
          <h2 className="heading-3 text-white mb-6">Form Components</h2>
          <div className="max-w-2xl mx-auto">
            <div className="card-base p-8">
              <h3 className="heading-3 mb-6">Contact Form</h3>
              
              <form className="space-y-6">
                <div>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Enter your email"
                  />
                  <p className="form-help">We'll never share your email with anyone else.</p>
                </div>
                
                <div>
                  <label className="form-label">Course Category</label>
                  <select className="form-input">
                    <option>Select a category</option>
                    <option>Web Development</option>
                    <option>Data Science</option>
                    <option>Design</option>
                    <option>Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-input" 
                    rows="4" 
                    placeholder="Enter your message"
                  ></textarea>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I agree to the Terms and Conditions
                  </label>
                </div>
                
                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Progress Examples */}
        <section>
          <h2 className="heading-3 text-white mb-6">Progress Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Course Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>JavaScript Basics</span>
                    <span>75%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>React Development</span>
                    <span>45%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '45%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Node.js Backend</span>
                    <span>20%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '20%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Skill Levels</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Beginner</span>
                  <span className="badge-success">40 Courses</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Intermediate</span>
                  <span className="badge-warning">25 Courses</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Advanced</span>
                  <span className="badge-error">15 Courses</span>
                </div>
              </div>
            </div>
            
            <div className="card-base p-6">
              <h4 className="font-semibold mb-4">Achievements</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                  <span className="text-xs text-yellow-700">First Course</span>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Award className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <span className="text-xs text-blue-700">Quiz Master</span>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Award className="w-6 h-6 text-green-500 mx-auto mb-1" />
                  <span className="text-xs text-green-700">Streak 7d</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeExamples;