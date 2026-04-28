
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.exercise.count();
  console.log('Exercise count:', count);
  const exercises = await prisma.exercise.findMany({
    select: { id: true, title_tr: true, title_en: true }
  });
  console.log('Exercises:', JSON.stringify(exercises, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
