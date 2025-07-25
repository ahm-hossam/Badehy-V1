// Migration script to link legacy CheckInSubmissions to TrainerClients
// Run with: node backend/scripts/migrate-link-checkin-submissions.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Link CheckInSubmissions with null clientId
  const unlinkedSubs = await prisma.checkInSubmission.findMany({
    where: { clientId: null },
    include: { form: { include: { questions: true } } },
  });
  let linked = 0;
  for (const sub of unlinkedSubs) {
    const answers = sub.answers || {};
    // Try to find email or full name question
    let email = null, fullName = null;
    for (const q of sub.form.questions) {
      if (!email && /email/i.test(q.label)) email = answers[String(q.id)];
      if (!fullName && /name/i.test(q.label)) fullName = answers[String(q.id)];
    }
    // Try to find client by email first, then full name
    let client = null;
    if (email) {
      client = await prisma.trainerClient.findFirst({ where: { email: String(email).toLowerCase() } });
    }
    if (!client && fullName) {
      client = await prisma.trainerClient.findFirst({ where: { fullName: String(fullName) } });
    }
    if (client) {
      await prisma.checkInSubmission.update({ where: { id: sub.id }, data: { clientId: client.id } });
      linked++;
      console.log(`Linked submission ${sub.id} to client ${client.id} (${client.email || client.fullName})`);
    } else {
      console.warn(`Could not link submission ${sub.id} (no matching client for email: ${email}, name: ${fullName})`);
    }
  }
  // 2. Log TrainerClients with no submissions
  const clients = await prisma.trainerClient.findMany({ include: { submissions: true } });
  const noSubClients = clients.filter(c => !c.submissions || c.submissions.length === 0);
  if (noSubClients.length > 0) {
    console.log(`Clients with no submissions: ${noSubClients.length}`);
    for (const c of noSubClients) {
      console.log(`Client ${c.id}: ${c.email} / ${c.fullName}`);
    }
  } else {
    console.log('All clients have at least one submission.');
  }
  console.log(`Linked ${linked} submissions.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect()); 