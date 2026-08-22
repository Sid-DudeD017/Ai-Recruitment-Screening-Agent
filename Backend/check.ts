import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
async function main() {
  const apps = await prisma.application.findMany({
    where: { candidate: { firstName: { contains: 'Siddharth' } } },
    include: { job: true, candidate: true }
  });
  console.log(apps.map(a => `${a.id} | ${a.candidate.firstName} ${a.candidate.lastName} | ${a.job?.title} | ${a.status}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
