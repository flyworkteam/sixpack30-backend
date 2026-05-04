
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 1;
  const daysToComplete = [1, 2, 3];

  try {
    console.log(`Kullanıcı ID ${userId} için 3 günlük antrenman verisi işleniyor...`);

    for (const day of daysToComplete) {
      await prisma.completedDay.upsert({
        where: {
          userId_dayNumber: {
            userId: userId,
            dayNumber: day,
          },
        },
        update: {},
        create: {
          userId: userId,
          dayNumber: day,
          completedAt: new Date(new Date().setDate(new Date().getDate() - (3 - day)))
        },
      });

      await prisma.progress.create({
        data: {
          userId: userId,
          exerciseId: day,
          duration: 600,
          calories: 250,
          completedAt: new Date(new Date().setDate(new Date().getDate() - (3 - day)))
        }
      });
    }

    console.log('İşlem başarıyla tamamlandı. 1, 2 ve 3. günler eklendi.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
