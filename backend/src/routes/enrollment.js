// File: enrollment.js
// Path: backend/src/routes/enrollment.js

const express = require('express');
const router = express.Router();

// Import middleware
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

// Import controllers
const { getMyEnrollments } = require('../controllers/course');

// Apply rate limiting
router.use(generalLimiter);

// ========================================
// STUDENT ENROLLMENT ROUTES
// ========================================

// @desc    Get my enrollments
// @route   GET /api/enrollments/my
// @access  Student
router.get('/my',
  protect,
  (req, res, next) => {
    console.log('📥 GET /api/enrollments/my - Request received');
    console.log('   User ID:', req.user?.id);
    console.log('   User Role:', req.user?.role);
    
    // Check if getMyEnrollments is a function
    if (typeof getMyEnrollments !== 'function') {
      console.error('❌ getMyEnrollments is not a function:', typeof getMyEnrollments);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: getMyEnrollments controller not found'
      });
    }
    
    // Call the controller
    getMyEnrollments(req, res, next);
  }
);

module.exports = router;


