import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = 'PqPbfc3JtfcVrqxtrTRklI8Rz042'; // Ece's UID
  const user = await prisma.user.findUnique({
    where: { firebaseUid }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  // Delete all completed days first
  await prisma.completedDay.deleteMany({
    where: { userId: user.id }
  });

  // Add only days 1, 2, 3 so current is 4
  for (let i = 1; i <= 3; i++) {
    await prisma.completedDay.create({
      data: {
        userId: user.id,
        dayNumber: i
      }
    });
  }

  console.log('Reset Ece to Day 4 (Completed 1, 2, 3)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
