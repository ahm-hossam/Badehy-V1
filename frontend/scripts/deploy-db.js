const { execSync } = require('child_process');

console.log('🚀 Deploying database schema to Vercel Postgres...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema to database
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Database schema deployed successfully!');
  console.log('🎉 Your app is now ready to use!');
} catch (error) {
  console.error('❌ Error deploying database schema:', error.message);
  process.exit(1);
} 