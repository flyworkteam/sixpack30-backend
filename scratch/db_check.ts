import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE DIAGNOSIS ---');
  
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { questionnaires: true }
      }
    }
  });

  console.log(`Total Users found: ${users.length}`);
  
  users.forEach(u => {
    console.log(`User ID: ${u.id} | Email: ${u.email} | FirebaseUID: ${u.firebaseUid} | Questionnaires: ${u._count.questionnaires}`);
  });

  const questionnaires = await prisma.questionnaire.findMany();
  console.log(`\nTotal Questionnaires found: ${questionnaires.length}`);
  
  questionnaires.forEach(q => {
    console.log(`Questionnaire ID: ${q.id} | UserId: ${q.userId} | Goal: ${q.goal}`);
  });

  console.log('\n--- END DIAGNOSIS ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
