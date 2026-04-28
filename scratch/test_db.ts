
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Veritabanına başarıyla bağlandı!');
    const users = await prisma.user.count();
    console.log(`Veritabanında ${users} kullanıcı var.`);
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
