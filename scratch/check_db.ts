import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const q = await prisma.questionnaire.findFirst();
  console.log('Latest Questionnaire:', JSON.stringify(q, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
