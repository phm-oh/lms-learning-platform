// File: updateQuizzes.js
// Path: backend/src/utils/database/updateQuizzes.js
// Script to update existing quizzes with availableFrom/availableUntil

const { Quiz, sequelize } = require('../../models');
const { Op } = require('sequelize');

async function updateQuizzes() {
  try {
    console.log('🔄 Updating quizzes...');
    
    const transaction = await sequelize.transaction();
    
    try {
      // Get all quizzes without availableFrom or availableUntil
      const quizzes = await Quiz.findAll({
        where: {
          [Op.or]: [
            { availableFrom: null },
            { availableUntil: null }
          ]
        },
        transaction
      });
      
      console.log(`Found ${quizzes.length} quizzes to update`);
      
      for (const quiz of quizzes) {
        const updates = {};
        
        if (!quiz.availableFrom) {
          updates.availableFrom = new Date();
        }
        
        if (!quiz.availableUntil) {
          updates.availableUntil = null; // No expiry
        }
        
        if (Object.keys(updates).length > 0) {
          await quiz.update(updates, { transaction });
          console.log(`✅ Updated quiz: ${quiz.title}`);
        }
      }
      
      await transaction.commit();
      console.log('✅ All quizzes updated successfully!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error updating quizzes:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  updateQuizzes();
}

module.exports = { updateQuizzes };

