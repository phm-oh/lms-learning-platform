const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || '192.168.191.66',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lms_platform',
  username: process.env.DB_USER || 'oasisuser',
  password: process.env.DB_PASSWORD || 'Oasis6566',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
