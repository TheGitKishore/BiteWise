// db/db.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root', //user name in mysql
  // ZM password
  //password: '1234',
  
  // Leonard Password
  password: 'leonardpoon', //password to log into database in mysql
  database: 'fyp' //database name you created
});

export default db;