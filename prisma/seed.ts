import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create some daily challenges
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenges = [
    {
      challengeText: 'Put your phone face-down for 10 minutes',
      challengeDate: new Date(today),
    },
    {
      challengeText: 'Write down three things you are grateful for today',
      challengeDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    },
    {
      challengeText: 'Take 5 deep breaths and focus on the present moment',
      challengeDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    },
  ];

  for (const challenge of challenges) {
    await prisma.dailyChallenge.upsert({
      where: { challengeDate: challenge.challengeDate },
      update: {},
      create: challenge,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

