const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load root .env (same as server.ts behavior)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function main() {
  const trainerEmail = process.env.SEED_TRAINER_EMAIL || 'trainer@example.com';
  const clientEmail = process.env.SEED_CLIENT_EMAIL || 'client@example.com';
  const clientPhone = process.env.SEED_CLIENT_PHONE || '+201000000000';
  const clientPassword = process.env.SEED_CLIENT_PASSWORD || 'password123';

  // 1) Upsert a trainer (Registered)
  const trainer = await prisma.registered.upsert({
    where: { email: trainerEmail },
    update: {},
    create: {
      fullName: 'Seed Trainer',
      email: trainerEmail,
      countryCode: '20',
      countryName: 'Egypt',
      phoneNumber: '+201111111111',
      passwordHash: await bcrypt.hash('seed-trainer-pass', 10),
      accountStatus: 'approved',
      subscriptionStatus: 'active',
    },
  });

  // 2) Upsert a client for that trainer
  let client = await prisma.trainerClient.findFirst({
    where: { email: clientEmail, trainerId: trainer.id },
  });
  if (!client) {
    client = await prisma.trainerClient.create({
      data: {
        trainerId: trainer.id,
        fullName: 'Seed Client',
        phone: clientPhone,
        email: clientEmail,
        injuriesHealthNotes: [],
        goals: [],
      },
    });
  }

  // 3) Upsert ClientAuth credentials for the client
  const passwordHash = await bcrypt.hash(clientPassword, 10);
  await prisma.clientAuth.upsert({
    where: { clientId: client.id },
    update: { email: clientEmail, phone: clientPhone, passwordHash },
    create: { clientId: client.id, email: clientEmail, phone: clientPhone, passwordHash },
  });

  console.log('Seeded mobile client credentials:');
  console.log({ trainerId: trainer.id, clientId: client.id, clientEmail, clientPhone, clientPassword });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


