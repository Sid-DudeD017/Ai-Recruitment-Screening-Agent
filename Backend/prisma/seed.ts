import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo company
  const company = await prisma.company.upsert({
    where: { domain: "demo.recruitai.com" },
    update: {},
    create: {
      name: "Demo Corp",
      domain: "demo.recruitai.com",
      website: "https://demo.recruitai.com",
    },
  });
  console.log(`  ✓ Company: ${company.name} (${company.id})`);

  // Create demo users (these would normally come from Clerk webhook)
  const admin = await prisma.user.upsert({
    where: { clerkId: "seed_admin_001" },
    update: {},
    create: {
      clerkId: "seed_admin_001",
      email: "admin@demo.recruitai.com",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      companyId: company.id,
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { clerkId: "seed_recruiter_001" },
    update: {},
    create: {
      clerkId: "seed_recruiter_001",
      email: "recruiter@demo.recruitai.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "RECRUITER",
      companyId: company.id,
    },
  });
  console.log(`  ✓ Users: ${admin.email}, ${recruiter.email}`);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: "seed_job_001" },
      update: {},
      create: {
        id: "seed_job_001",
        title: "Senior Full Stack Developer",
        description:
          "We are looking for an experienced Full Stack Developer to join our team. You will be responsible for building and maintaining web applications using modern technologies.",
        requirements:
          "5+ years of experience with React, Node.js, TypeScript. Experience with PostgreSQL and cloud services (AWS/GCP).",
        location: "San Francisco, CA (Remote)",
        type: "FULL_TIME",
        salaryMin: 150000,
        salaryMax: 200000,
        currency: "USD",
        status: "OPEN",
        publishedAt: new Date(),
        companyId: company.id,
        createdById: recruiter.id,
      },
    }),
    prisma.job.upsert({
      where: { id: "seed_job_002" },
      update: {},
      create: {
        id: "seed_job_002",
        title: "Product Designer (UX/UI)",
        description:
          "Join our design team to create beautiful and intuitive user experiences. You will work closely with product managers and engineers.",
        requirements:
          "3+ years of product design experience. Proficiency in Figma. Strong portfolio demonstrating UX thinking.",
        location: "New York, NY",
        type: "FULL_TIME",
        salaryMin: 120000,
        salaryMax: 160000,
        currency: "USD",
        status: "OPEN",
        publishedAt: new Date(),
        companyId: company.id,
        createdById: recruiter.id,
      },
    }),
    prisma.job.upsert({
      where: { id: "seed_job_003" },
      update: {},
      create: {
        id: "seed_job_003",
        title: "DevOps Engineer",
        description:
          "We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines.",
        requirements:
          "Experience with Kubernetes, Docker, Terraform. Strong Linux skills. AWS/GCP certification preferred.",
        location: "Remote",
        type: "REMOTE",
        salaryMin: 140000,
        salaryMax: 180000,
        currency: "USD",
        status: "DRAFT",
        companyId: company.id,
        createdById: admin.id,
      },
    }),
  ]);
  console.log(`  ✓ Jobs: ${jobs.length} created`);

  // Create sample candidates
  const candidates = await Promise.all([
    prisma.candidate.upsert({
      where: {
        email_companyId: {
          email: "alice@example.com",
          companyId: company.id,
        },
      },
      update: {},
      create: {
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Chen",
        phone: "+1-555-0101",
        linkedinUrl: "https://linkedin.com/in/alicechen",
        source: "LinkedIn",
        companyId: company.id,
      },
    }),
    prisma.candidate.upsert({
      where: {
        email_companyId: {
          email: "bob@example.com",
          companyId: company.id,
        },
      },
      update: {},
      create: {
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Martinez",
        phone: "+1-555-0102",
        source: "Referral",
        companyId: company.id,
      },
    }),
    prisma.candidate.upsert({
      where: {
        email_companyId: {
          email: "carol@example.com",
          companyId: company.id,
        },
      },
      update: {},
      create: {
        email: "carol@example.com",
        firstName: "Carol",
        lastName: "Kim",
        phone: "+1-555-0103",
        linkedinUrl: "https://linkedin.com/in/carolkim",
        source: "Website",
        companyId: company.id,
      },
    }),
  ]);
  console.log(`  ✓ Candidates: ${candidates.length} created`);

  // Create sample applications
  const applications = await Promise.all([
    prisma.application.upsert({
      where: {
        candidateId_jobId: {
          candidateId: candidates[0].id,
          jobId: jobs[0].id,
        },
      },
      update: {},
      create: {
        candidateId: candidates[0].id,
        jobId: jobs[0].id,
        status: "SHORTLISTED",
        matchScore: 87.5,
      },
    }),
    prisma.application.upsert({
      where: {
        candidateId_jobId: {
          candidateId: candidates[1].id,
          jobId: jobs[0].id,
        },
      },
      update: {},
      create: {
        candidateId: candidates[1].id,
        jobId: jobs[0].id,
        status: "SCREENING",
        matchScore: 72.0,
      },
    }),
    prisma.application.upsert({
      where: {
        candidateId_jobId: {
          candidateId: candidates[2].id,
          jobId: jobs[1].id,
        },
      },
      update: {},
      create: {
        candidateId: candidates[2].id,
        jobId: jobs[1].id,
        status: "APPLIED",
      },
    }),
  ]);
  console.log(`  ✓ Applications: ${applications.length} created`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
