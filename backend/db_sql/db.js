// db/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const isProduction = env === 'production';

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// IMPORTANT for TiDB Cloud
// only use SSL for cloud production
if (isProduction) {
  dbConfig.ssl = {
    ca: fs.readFileSync('./certs/isrgrootx1.pem'),
    rejectUnauthorized: true
  };
}

const db = mysql.createPool(dbConfig);

export default db;