import 'dotenv/config';
import * as mariadb from 'mariadb';

const url = new URL(process.env.DATABASE_URL!);
console.log('Connecting to:', url.hostname, ':', url.port || '3306');

const pool = mariadb.createPool({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.substring(1),
  connectionLimit: 1
});

try {
  const conn = await pool.getConnection();
  console.log('Successfully connected to MariaDB directly!');
  const rows = await conn.query('SELECT 1 as val');
  console.log('Query result:', rows);
  await conn.release();
  await pool.end();
} catch (error) {
  console.error('Direct MariaDB Connection Error:', error);
}
