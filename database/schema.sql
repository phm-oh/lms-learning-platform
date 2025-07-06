-- File: database/schema.sql
-- Path: database/schema.sql
-- LMS Platform Database Schema for PostgreSQL

-- ========================================
-- 1. USERS & AUTHENTICATION
-- ========================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending',
    profile_image VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP
);

-- User sessions for tracking
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ========================================
-- 2. COURSES & CURRICULUM
-- ========================================

-- Course categories
CREATE TABLE course_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    thumbnail VARCHAR(255),
    category_id INTEGER REFERENCES course_categories(id),
    teacher_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    course_code VARCHAR(20) UNIQUE,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration INTEGER, -- hours
    max_students INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[], -- PostgreSQL array
    prerequisites TEXT[],
    learning_objectives TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status approval_status DEFAULT 'pending',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_grade DECIMAL(5,2),
    certificate_issued BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(course_id, student_id)
);

-- ========================================
-- 3. LESSONS & CONTENT
-- ========================================

-- Lesson types
CREATE TYPE lesson_type AS ENUM ('video', 'text', 'document', 'quiz', 'assignment', 'discussion');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

-- Lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content
    lesson_type lesson_type NOT NULL,
    video_url VARCHAR(500), -- YouTube/Vimeo links
    video_duration INTEGER, -- seconds
    file_attachments JSONB, -- Array of file objects
    order_index INTEGER NOT NULL,
    estimated_time INTEGER, -- minutes
    status content_status DEFAULT 'draft',
    is_required BOOLEAN DEFAULT TRUE,
    prerequisites INTEGER[], -- lesson IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson progress tracking
CREATE TABLE lesson_progress (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
    time_spent INTEGER DEFAULT 0, -- seconds
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    UNIQUE(lesson_id, student_id)
);

-- ========================================
-- 4. QUIZZES & ASSESSMENTS
-- ========================================

-- Quiz types and settings
CREATE TYPE quiz_type AS ENUM ('practice', 'assessment', 'final_exam');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank');

-- Quizzes
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type quiz_type DEFAULT 'practice',
    time_limit INTEGER, -- minutes
    max_attempts INTEGER DEFAULT 1,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    randomize_questions BOOLEAN DEFAULT FALSE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    show_results_immediately BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INTEGER NOT NULL,
    explanation TEXT,
    image_url VARCHAR(255),
    options JSONB, -- For multiple choice: [{"text": "A", "is_correct": true}]
    correct_answer TEXT, -- For short answer/fill blank
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempts and results
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent INTEGER, -- seconds
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    is_completed BOOLEAN DEFAULT FALSE,
    auto_submitted BOOLEAN DEFAULT FALSE, -- if time ran out
    answers JSONB, -- Student's answers
    UNIQUE(quiz_id, student_id, attempt_number)
);

-- Individual question responses
CREATE TABLE quiz_responses (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_options INTEGER[], -- For multiple choice
    points_earned DECIMAL(5,2) DEFAULT 0.00,
    is_correct BOOLEAN,
    time_spent INTEGER, -- seconds on this question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. NOTIFICATIONS & COMMUNICATIONS
-- ========================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'enrollment_request', 'enrollment_approved', 'enrollment_rejected',
    'new_content', 'quiz_assigned', 'quiz_graded', 'course_update',
    'system_announcement', 'reminder', 'achievement'
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Email queue for sending notifications
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    template_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 6. ML & ANALYTICS DATA
-- ========================================

-- User behavior tracking for ML
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL, -- login, view_lesson, start_quiz, submit_quiz, etc.
    details JSONB, -- Additional activity details
    session_duration INTEGER, -- seconds
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning analytics aggregated data
CREATE TABLE learning_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Engagement metrics
    time_spent INTEGER DEFAULT 0, -- seconds
    lessons_viewed INTEGER DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_quiz_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    
    -- Behavioral patterns
    preferred_study_time INTEGER, -- hour of day (0-23)
    study_streak INTEGER DEFAULT 0,
    help_requests INTEGER DEFAULT 0,
    
    -- ML features
    feature_vector JSONB, -- Computed features for ML
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id, date)
);

-- ML predictions and recommendations
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- performance, dropout_risk, recommendation
    confidence_score DECIMAL(5,4),
    predicted_value JSONB, -- The actual prediction data
    model_version VARCHAR(20),
    features_used JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ========================================
-- 7. FILE MANAGEMENT
-- ========================================

-- File uploads and attachments
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 8. SYSTEM CONFIGURATION
-- ========================================

-- System settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for important actions
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Course indexes
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_active ON courses(is_active, is_published);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Lesson indexes
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, order_index);

-- Quiz indexes
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- Activity indexes
CREATE INDEX idx_activities_user ON user_activities(user_id);
CREATE INDEX idx_activities_course ON user_activities(course_id);
CREATE INDEX idx_activities_date ON user_activities(created_at);

-- Analytics indexes
CREATE INDEX idx_analytics_user_course ON learning_analytics(user_id, course_id);
CREATE INDEX idx_analytics_date ON learning_analytics(date);

-- ========================================
-- TRIGGERS FOR AUTO-UPDATES
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables that need it
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INITIAL DATA
-- ========================================

-- Default course categories
INSERT INTO course_categories (name, description, color, icon) VALUES
('Mathematics', 'Mathematics and related subjects', '#FF6B6B', 'calculator'),
('Science', 'Physics, Chemistry, Biology', '#4ECDC4', 'microscope'),
('Language', 'Language learning and literature', '#45B7D1', 'book-open'),
('Technology', 'Computer Science and IT', '#96CEB4', 'computer'),
('Business', 'Business and Management', '#FFEAA7', 'briefcase'),
('Arts', 'Arts and Creative subjects', '#DDA0DD', 'palette');

-- Default system settings
INSERT INTO system_settings (key, value, description, data_type, is_public) VALUES
('site_name', 'LMS Learning Platform', 'Website name', 'string', true),
('site_description', 'Learning Management System with AI-powered insights', 'Website description', 'string', true),
('max_file_size', '10485760', 'Maximum file upload size in bytes', 'number', false),
('session_timeout', '604800', 'Session timeout in seconds (7 days)', 'number', false),
('email_from_address', 'noreply@lms-platform.com', 'Default from email address', 'string', false),
('quiz_auto_submit_buffer', '30', 'Buffer time in seconds before auto-submit', 'number', false);

-- Default admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, status, email_verified) VALUES
('admin@lms-platform.com', '$2a$10$rXBwR5FZZvKkQk8rY8xKzeeQPr9lKmrKzNx8Qf5HMGxCZRUKYx1m2', 'System', 'Administrator', 'admin', 'active', true);