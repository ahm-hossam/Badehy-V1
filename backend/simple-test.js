console.log('Testing basic Node.js functionality...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('Prisma client loaded successfully');
  
  const prisma = new PrismaClient();
  console.log('Prisma client created successfully');
  
  prisma.$disconnect();
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
