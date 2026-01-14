#!/usr/bin/env node

/**
 * Quick Production Setup Script
 * Generates secure secrets and creates production .env file
 */

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 eCommerce Platform - Production Setup\n');
console.log('This script will help you generate a production-ready .env file\n');

// Generate secure secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log('✅ Generated secure JWT secrets\n');

// Ask for database URL
rl.question('Enter your production DATABASE_URL: ', (databaseUrl) => {
  if (!databaseUrl) {
    console.log('❌ Database URL is required');
    rl.close();
    return;
  }

  // Ask for app URL
  rl.question('Enter your production APP_URL (e.g., https://yourdomain.com): ', (appUrl) => {
    if (!appUrl) {
      console.log('❌ App URL is required');
      rl.close();
      return;
    }

    // Create .env.production file
    const envContent = `# Production Environment Variables
# Generated: ${new Date().toISOString()}

# Database Configuration
DATABASE_URL="${databaseUrl}"

# JWT Secrets (Auto-generated - Keep secure!)
JWT_SECRET="${jwtSecret}"
JWT_REFRESH_SECRET="${jwtRefreshSecret}"

# Application URL
NEXT_PUBLIC_APP_URL="${appUrl}"

# Node Environment
NODE_ENV="production"

# Optional: Add these if you have them
# EMAIL_FROM="noreply@yourdomain.com"
# EMAIL_API_KEY="your-email-service-api-key"
# STRIPE_SECRET_KEY="sk_live_..."
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
`;

    fs.writeFileSync('.env.production', envContent);
    
    console.log('\n✅ Created .env.production file');
    console.log('\n📋 Next Steps:');
    console.log('1. Review .env.production file');
    console.log('2. Run: npm run production:check');
    console.log('3. Deploy to Vercel: vercel --prod');
    console.log('4. Run migrations: npx prisma migrate deploy');
    console.log('\n⚠️  IMPORTANT: Never commit .env.production to git!\n');
    
    rl.close();
  });
});
