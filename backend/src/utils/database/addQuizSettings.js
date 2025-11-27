// File: backend/src/utils/database/addQuizSettings.js
// Path: backend/src/utils/database/addQuizSettings.js
// Purpose: Add isActive and allowRetake columns to quizzes table

const { Quiz, sequelize } = require('../../models');
const { QueryTypes, Op } = require('sequelize');

async function addQuizSettings() {
  try {
    console.log('🔄 Adding isActive and allowRetake to quizzes...');
    const transaction = await sequelize.transaction();

    try {
      // Check if is_active column exists
      const [isActiveExists] = await sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name='quizzes' AND column_name='is_active';`,
        { transaction, type: QueryTypes.SELECT }
      );

      if (!isActiveExists) {
        console.log('📊 Adding is_active column...');
        await sequelize.query(
          `ALTER TABLE quizzes
           ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;`,
          { transaction }
        );
        console.log('✅ is_active column added');
      } else {
        console.log('✅ is_active column already exists');
      }

      // Check if allow_retake column exists
      const [allowRetakeExists] = await sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name='quizzes' AND column_name='allow_retake';`,
        { transaction, type: QueryTypes.SELECT }
      );

      if (!allowRetakeExists) {
        console.log('📊 Adding allow_retake column...');
        await sequelize.query(
          `ALTER TABLE quizzes
           ADD COLUMN allow_retake BOOLEAN DEFAULT true NOT NULL;`,
          { transaction }
        );
        console.log('✅ allow_retake column added');
      } else {
        console.log('✅ allow_retake column already exists');
      }

      // Update existing quizzes to have default values if they're null
      const quizzesToUpdate = await Quiz.findAll({
        where: {
          [Op.or]: [
            { isActive: null },
            { allowRetake: null }
          ]
        },
        transaction
      });

      if (quizzesToUpdate.length > 0) {
        console.log(`Found ${quizzesToUpdate.length} quizzes to update`);
        for (const quiz of quizzesToUpdate) {
          await quiz.update({
            isActive: quiz.isActive !== null ? quiz.isActive : true,
            allowRetake: quiz.allowRetake !== null ? quiz.allowRetake : true
          }, { transaction });
          console.log(`✅ Updated quiz: ${quiz.title}`);
        }
      }

      await transaction.commit();
      console.log('✅ All quiz settings updated successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding quiz settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Migration setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addQuizSettings();
}

module.exports = addQuizSettings;

