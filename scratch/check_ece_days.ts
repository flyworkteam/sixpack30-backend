import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firebaseUid = 'PqPbfc3JtfcVrqxtrTRklI8Rz042'; // Ece's UID
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    include: { completedProgramDays: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User:', user.email);
  console.log('Completed Days:', user.completedProgramDays.map(d => d.dayNumber).sort((a, b) => a - b));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
