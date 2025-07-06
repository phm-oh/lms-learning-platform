# LMS Learning Platform with ML Prediction

## 🎯 Project Overview
Learning Management System with Machine Learning prediction capabilities for academic research.

## 🏗️ Architecture
- **Backend**: Express.js + PostgreSQL
- **Frontend**: React.js
- **ML Service**: Python FastAPI + TensorFlow
- **Database**: PostgreSQL (192.168.191.66:5432)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- PostgreSQL access

### Installation
```bash
# Clone and setup
git clone <your-repo>
cd lms-learning-platform

# Install all dependencies
npm run setup

# Setup environment
cp backend/.env.example backend/.env

# Start development servers
npm run dev
```

### Individual Services
```bash
# Backend only
cd backend && npm run dev

# Frontend only  
cd frontend && npm start

# ML Service only
cd ml-service && python app.py
```

## 📁 Project Structure
```
lms-learning-platform/
├── backend/           # Express.js API
├── frontend/          # React.js UI
├── ml-service/        # Python ML API
├── shared/            # Shared utilities
├── database/          # DB migrations/seeds
└── docs/              # Documentation
```

## 🔧 Configuration
- Database: PostgreSQL at 192.168.191.66:5432
- Backend: http://localhost:5000
- Frontend: http://localhost:3000  
- ML Service: http://localhost:8000

## 📊 Features
- Multi-role system (Admin/Teacher/Student)
- Course & lesson management
- Quiz engine with timer
- ML-powered predictions
- Real-time analytics
- Email notifications

## 🤖 ML Prediction Features
- Academic performance prediction
- Dropout risk detection
- Learning path recommendations
- Content effectiveness analysis
