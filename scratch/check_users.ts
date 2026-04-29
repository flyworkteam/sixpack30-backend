
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firebaseUid: true,
        updatedAt: true
      }
    });
    console.log('--- Veritabanındaki Kullanıcılar ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('------------------------------------');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
