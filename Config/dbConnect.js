// import { JSONCookie } from 'cookie-parser';
// import { query } from 'express';
// import mysql from 'mysql2/promise';

// export const connection = await mysql.createConnection({
//   host: 'localhost',
//   port:3306,
//   user: 'root',
//   database: 'smartbook',
// });
// try {
//   await connection.connect();

//   console.log('Connected to the MySQL database');
// } catch (err) {

//   console.error('Error connecting to the database:', err);
// }


//ralway .com production


import mysql from 'mysql2/promise';
import 'dotenv/config'; // To load environment variables from .env

export const connection = await mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
});

try {
  await connection.connect();
  console.log('✅ Connected to the Railway MySQL database');
} catch (err) {
  console.error('❌ Error connecting to the database:', err);
}



