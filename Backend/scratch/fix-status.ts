import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const apps = await prisma.application.findMany({
    where: {
      status: { in: ['APPLIED', 'SCREENING'] },
      matchScore: { not: null }
    }
  })

  let fixed = 0;
  for (const app of apps) {
    const targetStatus = app.matchScore! > 75 ? 'PENDING_REVIEW' : 'REJECTED';
    await prisma.application.update({
      where: { id: app.id },
      data: { status: targetStatus }
    });
    console.log(`Updated ${app.id} to ${targetStatus} (score: ${app.matchScore})`);
    fixed++;
  }
  console.log(`Fixed ${fixed} applications.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
