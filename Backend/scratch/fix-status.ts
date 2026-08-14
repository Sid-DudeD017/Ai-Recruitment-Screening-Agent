import { prisma } from '../src/infrastructure/database/prisma.client'

async function run() {
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

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
