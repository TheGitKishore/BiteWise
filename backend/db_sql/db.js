// db/db.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root', //user name in mysql
  password: '1234', //password to log into database in mysql
  database: 'fyp' //database name you created
});

export default db;