// db/db.js
import mysql from 'mysql2/promise';
import fs from 'fs';

const db = mysql.createPool({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',      // e.g. gateway01.ap-southeast-1.prod.aws.tidbcloud.com
  port: 4000,
  user: '5cYrmxXM5vvUWA9.root',
  password: 'ygIy5u4lVoppRYtY',
  database: 'fyp',

  // IMPORTANT for TiDB Cloud
  ssl: {
    ca: fs.readFileSync('./certs/isrgrootx1.pem'),
    rejectUnauthorized: true
  }
});

export default db;