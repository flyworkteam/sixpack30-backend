import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = 'PqPbfc3JtfcVrqxtrTRklI8Rz042';

  const user = await prisma.user.findUnique({
    where: { firebaseUid }
  });

  if (!user) {
    console.error('User not found');
    return;
  }

  const userId = user.id;

  // Mark survey as completed
  const existingQ = await prisma.questionnaire.findFirst({
    where: { userId }
  });

  if (existingQ) {
    await prisma.questionnaire.update({
      where: { id: existingQ.id },
      data: { 
        gender: 'female',
        birthYear: 1999,
        height: 165,
        weight: 52,
        targetWeight: 50,
        activityLevel: 2,
        bodyType: 2
      }
    });
  } else {
    await prisma.questionnaire.create({
      data: {
        userId,
        gender: 'female',
        birthYear: 1999,
        height: 165,
        weight: 52,
        targetWeight: 50,
        activityLevel: 2,
        bodyType: 2
      }
    });
  }

  console.log('User survey marked as completed');

  // Add some completed days
  for (let i = 0; i < 5; i++) {
    await prisma.completedDay.upsert({
      where: {
        userId_dayNumber: {
          userId,
          dayNumber: i + 1
        }
      },
      update: {},
      create: {
        userId,
        dayNumber: i + 1
      }
    });
  }

  console.log('Added 5 completed days');

  // Add some daily activities for stats
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);

    await prisma.dailyActivity.create({
      data: {
        userId,
        date,
        steps: 6000 + i * 500,
        calories: 200 + i * 20,
        sleepMinutes: 480 + i * 10,
        weight: 52 - (i * 0.1)
      }
    });
  }

  console.log('Added 7 days of activity stats');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
