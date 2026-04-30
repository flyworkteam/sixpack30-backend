import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

console.log('DB_CONNECTION_STRING:', process.env.DB_CONNECTION_STRING ? 'Defined' : 'Undefined');

try {
  const url = new URL(process.env.DB_CONNECTION_STRING!);
  console.log('Host:', url.hostname);
  console.log('Port:', url.port || '3306');
  console.log('User:', url.username);
  
  const pool = mariadb.createPool({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.substring(1),
    connectionLimit: 1
  });
  const adapter = new PrismaMariaDb(pool);
  const prisma = new PrismaClient({ adapter });
  
  console.log('Prisma initialized successfully with adapter');
  await prisma.$connect();
  console.log('Prisma connected successfully');
  
  const userCount = await prisma.user.count();
  console.log('User count:', userCount);
  
  await prisma.$disconnect();
} catch (error) {
  console.error('Error:', error);
}
