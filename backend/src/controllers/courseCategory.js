// File: courseCategory.js
// Path: backend/src/controllers/courseCategory.js
// Purpose: Course Category Controllers

const { CourseCategory } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// @desc    Get all course categories
// @route   GET /api/course-categories
// @access  Public
const getCourseCategories = catchAsync(async (req, res, next) => {
  try {
    const categories = await CourseCategory.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    return next(new AppError('Error fetching course categories', 500));
  }
});

module.exports = {
  getCourseCategories
};


