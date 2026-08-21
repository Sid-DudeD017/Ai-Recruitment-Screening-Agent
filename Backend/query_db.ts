import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const interviews = await prisma.interview.findMany();
  console.log(interviews.map(i => i.meetingLink));
}

main().catch(console.error).finally(() => prisma.$disconnect());
