// File: addOrderIndexToQuizzes.js
// Path: backend/src/utils/database/addOrderIndexToQuizzes.js
// Script to add orderIndex column to existing quizzes table

const { Quiz, sequelize } = require('../../models');
const { Op } = require('sequelize');

async function addOrderIndexToQuizzes() {
  try {
    console.log('🔄 Adding orderIndex to quizzes...');
    
    const transaction = await sequelize.transaction();
    
    try {
      // Check if column exists
      const checkColumn = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='quizzes' AND column_name='order_index';
      `, { transaction });
      
      if (checkColumn[0].length === 0) {
        // Column doesn't exist, add it
        console.log('📊 Adding order_index column...');
        await sequelize.query(`
          ALTER TABLE quizzes 
          ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
        `, { transaction });
        console.log('✅ order_index column added');
      } else {
        console.log('✅ order_index column already exists');
      }
      
      // Update existing quizzes with orderIndex based on their current order
      const quizzes = await Quiz.findAll({
        order: [
          ['courseId', 'ASC'],
          ['lessonId', 'ASC NULLS LAST'],
          ['created_at', 'ASC']
        ],
        transaction
      });
      
      console.log(`Found ${quizzes.length} quizzes to update`);
      
      // Group by courseId and lessonId, then assign orderIndex
      const grouped = {};
      quizzes.forEach(quiz => {
        const key = `${quiz.courseId}_${quiz.lessonId || 'null'}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(quiz);
      });
      
      // Update orderIndex for each group
      for (const key in grouped) {
        const group = grouped[key];
        for (let i = 0; i < group.length; i++) {
          await group[i].update({ orderIndex: i }, { transaction });
          console.log(`✅ Updated quiz "${group[i].title}" with orderIndex: ${i}`);
        }
      }
      
      await transaction.commit();
      console.log('✅ All quizzes updated with orderIndex successfully!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error adding orderIndex to quizzes:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  addOrderIndexToQuizzes();
}

module.exports = { addOrderIndexToQuizzes };

