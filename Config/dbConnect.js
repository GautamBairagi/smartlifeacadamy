import { JSONCookie } from 'cookie-parser';
import { query } from 'express';
import mysql from 'mysql2/promise';

export const connection = await mysql.createConnection({
  host: 'localhost',
  port:3306,
  user: 'root',
  database: 'smartbook',
});
try {
  await connection.connect();

  console.log('Connected to the MySQL database');
} catch (err) {

  console.error('Error connecting to the database:', err);
}



