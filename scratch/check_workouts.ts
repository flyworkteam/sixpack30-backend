
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = 1;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        completedProgramDays: true,
        progresses: {
          include: { exercise: true }
        }
      }
    });

    console.log('--- Kullanıcı Antrenman Verileri (ID: 1) ---');
    if (!user) {
      console.log('Kullanıcı bulunamadı.');
    } else {
      console.log(`Email: ${user.email}`);
      console.log(`Tamamlanan Günler (CompletedDay):`, JSON.stringify(user.completedProgramDays, null, 2));
      console.log(`Aktivite Kayıtları (Progress):`, JSON.stringify(user.progresses, null, 2));
    }
    console.log('-------------------------------------------');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
