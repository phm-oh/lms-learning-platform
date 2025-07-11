-- File: database/news-schema.sql
-- Path: database/news-schema.sql
-- News System Database Schema Extension for LMS Platform

-- ========================================
-- NEWS SYSTEM ENUMS
-- ========================================

-- News status enum
CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived', 'scheduled');

-- News priority enum  
CREATE TYPE news_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- News type enum
CREATE TYPE news_type AS ENUM ('announcement', 'technology', 'course_update', 'system', 'event', 'general');

-- ========================================
-- NEWS CATEGORIES TABLE
-- ========================================

CREATE TABLE news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff', -- hex color for UI
    icon VARCHAR(50) DEFAULT 'newspaper', -- icon class name
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEWS TABLE
-- ========================================

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT, -- สรุปข่าว/excerpt
    content TEXT NOT NULL, -- เนื้อหาข่าวแบบ rich text/markdown
    featured_image VARCHAR(255), -- รูปภาพหลัก
    featured_image_alt VARCHAR(255), -- alt text สำหรับ SEO
    
    -- Category & Classification
    category_id INTEGER REFERENCES news_categories(id) ON DELETE SET NULL,
    news_type news_type DEFAULT 'general',
    priority news_priority DEFAULT 'normal',
    tags TEXT[], -- PostgreSQL array สำหรับ tags
    
    -- Publishing Info
    author_id INTEGER REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    status news_status DEFAULT 'draft',
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP, -- สำหรับ scheduled publishing
    expires_at TIMESTAMP, -- วันหมดอายุข่าว (optional)
    
    -- SEO & Meta
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    meta_keywords TEXT[],
    
    -- Engagement Stats
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Settings
    is_featured BOOLEAN DEFAULT FALSE, -- ข่าวเด่น
    is_pinned BOOLEAN DEFAULT FALSE, -- ปักหมุดข่าว
    allow_comments BOOLEAN DEFAULT TRUE,
    is_external_link BOOLEAN DEFAULT FALSE, -- กรณีเป็นลิงก์ไปข่าวภายนอก
    external_url VARCHAR(500), -- URL ภายนอก
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEWS VIEWS TRACKING
-- ========================================

CREATE TABLE news_views (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- null สำหรับ anonymous
    ip_address INET,
    user_agent TEXT,
    view_duration INTEGER, -- วินาที
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ป้องกันการนับซ้ำจากผู้ใช้เดียวกันในวันเดียวกัน
    UNIQUE(news_id, user_id, DATE(created_at))
);

-- ========================================
-- NEWS COMMENTS (Optional)
-- ========================================

CREATE TABLE news_comments (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES news_comments(id) ON DELETE CASCADE, -- สำหรับ nested comments
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEWS ATTACHMENTS
-- ========================================

CREATE TABLE news_attachments (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER, -- bytes
    file_type VARCHAR(100), -- MIME type
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEWS REACTIONS (Like/Love/etc)
-- ========================================

CREATE TABLE news_reactions (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) DEFAULT 'like', -- like, love, laugh, wow, sad, angry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ผู้ใช้หนึ่งคนทำ reaction ได้เพียงครั้งเดียวต่อข่าวหนึ่งข่าว
    UNIQUE(news_id, user_id)
);

-- ========================================
-- NEWS SHARING TRACKING
-- ========================================

CREATE TABLE news_shares (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50), -- facebook, twitter, line, email, etc.
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- News indexes
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_category ON news(category_id);
CREATE INDEX idx_news_author ON news(author_id);
CREATE INDEX idx_news_featured ON news(is_featured, published_at DESC);
CREATE INDEX idx_news_pinned ON news(is_pinned, published_at DESC);
CREATE INDEX idx_news_type ON news(news_type);
CREATE INDEX idx_news_priority ON news(priority);
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_news_scheduled ON news(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_news_tags ON news USING GIN (tags);

-- News views indexes
CREATE INDEX idx_news_views_news ON news_views(news_id);
CREATE INDEX idx_news_views_user ON news_views(user_id);
CREATE INDEX idx_news_views_date ON news_views(created_at);

-- News comments indexes
CREATE INDEX idx_news_comments_news ON news_comments(news_id);
CREATE INDEX idx_news_comments_user ON news_comments(user_id);
CREATE INDEX idx_news_comments_parent ON news_comments(parent_id);
CREATE INDEX idx_news_comments_approved ON news_comments(is_approved);

-- News categories indexes
CREATE INDEX idx_news_categories_active ON news_categories(is_active);
CREATE INDEX idx_news_categories_order ON news_categories(order_index);

-- ========================================
-- TRIGGERS FOR AUTO-UPDATES
-- ========================================

-- Update news updated_at timestamp
CREATE TRIGGER update_news_updated_at 
    BEFORE UPDATE ON news 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update news categories updated_at timestamp  
CREATE TRIGGER update_news_categories_updated_at 
    BEFORE UPDATE ON news_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update news comments updated_at timestamp
CREATE TRIGGER update_news_comments_updated_at 
    BEFORE UPDATE ON news_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-publish scheduled news (requires cron job)
-- This is just the function, actual scheduling needs external cron
CREATE OR REPLACE FUNCTION publish_scheduled_news()
RETURNS void AS $$
BEGIN
    UPDATE news 
    SET status = 'published', 
        published_at = CURRENT_TIMESTAMP 
    WHERE status = 'scheduled' 
    AND scheduled_at <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert sample news categories
INSERT INTO news_categories (name, slug, description, color, icon, order_index) VALUES
('ประชาสัมพันธ์', 'announcements', 'ข่าวประชาสัมพันธ์ทั่วไป', '#007bff', 'megaphone', 1),
('เทคโนโลยี', 'technology', 'ข่าวเทคโนโลยีและนวัตกรรม', '#28a745', 'cpu', 2),
('อัปเดตคอร์ส', 'course-updates', 'ข่าวอัปเดตคอร์สเรียน', '#ffc107', 'book-open', 3),
('ระบบ', 'system', 'ข่าวระบบและการบำรุงรักษา', '#dc3545', 'settings', 4),
('กิจกรรม', 'events', 'ข่าวกิจกรรมและการแข่งขัน', '#6f42c1', 'calendar', 5),
('ทั่วไป', 'general', 'ข่าวทั่วไป', '#6c757d', 'newspaper', 6);

-- Insert sample news
INSERT INTO news (title, slug, summary, content, category_id, author_id, status, published_at, news_type, priority, is_featured) VALUES
('ยินดีต้อนรับสู่ระบบ LMS ใหม่!', 'welcome-new-lms', 
'ระบบการจัดการเรียนรู้ใหม่พร้อมให้บริการแล้ว พร้อมฟีเจอร์ที่ทันสมัยและใช้งานง่าย', 
'เรามีความยินดีที่จะประกาศเปิดตัวระบบ LMS ใหม่ที่มาพร้อมกับฟีเจอร์ที่ทันสมัย...', 
1, 1, 'published', CURRENT_TIMESTAMP, 'announcement', 'high', true),

('AI และการศึกษาในยุคดิจิทัล', 'ai-digital-education',
'เทคโนโลยี AI กำลังเปลี่ยนแปลงโลกการศึกษา มาดูกันว่ามีผลกระทบอย่างไร',
'ปัญญาประดิษฐ์หรือ AI กำลังเข้ามามีบทบาทสำคัญในการศึกษา...',
2, 1, 'published', CURRENT_TIMESTAMP - INTERVAL '1 day', 'technology', 'normal', false);

-- ========================================
-- COMMENTS
-- ========================================

/*
News System Features:
✅ หมวดหมู่ข่าวที่ยืดหยุ่น
✅ ระบบสถานะข่าว (draft, published, archived, scheduled)  
✅ ข่าวเด่นและปักหมุด
✅ SEO-friendly (slug, meta tags)
✅ การติดตามสถิติ (views, likes, shares)
✅ ระบบแสดงความคิดเห็น
✅ ไฟล์แนบ/สื่อประกอบ
✅ ระบบ reaction (like, love, etc.)
✅ กำหนดเวลาเผยแพร่
✅ ข่าวมีวันหมดอายุ
✅ รองรับลิงก์ภายนอก
✅ การจัดลำดับและ priority
✅ ระบบ tag สำหรับการค้นหา

Performance Optimizations:
✅ Indexes สำหรับ query ที่ใช้บ่อย
✅ Unique constraints ป้องกัน duplicate
✅ Proper foreign key relationships
✅ Automatic timestamp updates
✅ Efficient pagination support
*/