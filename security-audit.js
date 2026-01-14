#!/usr/bin/env node

/**
 * Security Audit Script for eCommerce Platform
 * Run with: node security-audit.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Security Audit for eCommerce Platform\n');

const issues = [];
const warnings = [];
const passed = [];

// Check 1: Environment Variables
console.log('Checking environment variables...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check JWT secrets
  if (envContent.includes('your-secret-key') || envContent.includes('change-in-production')) {
    issues.push('❌ CRITICAL: Default JWT secrets detected in .env.local');
  } else if (envContent.match(/JWT_SECRET="[^"]{1,32}"/)) {
    warnings.push('⚠️  WARNING: JWT_SECRET appears to be less than 32 characters');
  } else {
    passed.push('✅ JWT secrets appear to be customized');
  }
  
  // Check database URL
  if (envContent.includes('localhost') || envContent.includes('127.0.0.1')) {
    warnings.push('⚠️  WARNING: Database URL points to localhost (OK for dev, not for production)');
  }
  
  // Check for SSL in database URL
  if (!envContent.includes('sslmode=require') && !envContent.includes('localhost')) {
    warnings.push('⚠️  WARNING: Database URL missing SSL mode for production');
  }
  
  // Check APP_URL
  if (envContent.includes('localhost:3000')) {
    warnings.push('⚠️  WARNING: APP_URL points to localhost (OK for dev, not for production)');
  }
} else {
  issues.push('❌ CRITICAL: .env.local file not found');
}

// Check 2: Next.js Configuration
console.log('Checking Next.js configuration...');
const nextConfigPath = path.join(__dirname, 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes('ignoreBuildErrors: true')) {
    issues.push('❌ CRITICAL: TypeScript build errors are being ignored');
  } else {
    passed.push('✅ TypeScript build errors are not ignored');
  }
  
  if (nextConfig.includes('unoptimized: true')) {
    warnings.push('⚠️  WARNING: Image optimization is disabled');
  } else {
    passed.push('✅ Image optimization is enabled');
  }
  
  if (nextConfig.includes('Strict-Transport-Security')) {
    passed.push('✅ Security headers are configured');
  } else {
    issues.push('❌ CRITICAL: Security headers are not configured');
  }
} else {
  issues.push('❌ CRITICAL: next.config.mjs not found');
}

// Check 3: Package.json
console.log('Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.dependencies['bcrypt'] || packageJson.dependencies['bcryptjs']) {
    passed.push('✅ Password hashing library installed');
  } else {
    issues.push('❌ CRITICAL: No password hashing library found');
  }
  
  if (packageJson.dependencies['jsonwebtoken']) {
    passed.push('✅ JWT library installed');
  } else {
    issues.push('❌ CRITICAL: JWT library not found');
  }
  
  if (packageJson.dependencies['@prisma/client']) {
    passed.push('✅ Prisma ORM installed');
  } else {
    issues.push('❌ CRITICAL: Prisma ORM not found');
  }
}

// Check 4: Auth Implementation
console.log('Checking authentication implementation...');
const authPath = path.join(__dirname, 'lib', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  if (authContent.includes('bcrypt.hash') && authContent.includes(', 12')) {
    passed.push('✅ Password hashing uses bcrypt with 12 rounds');
  } else {
    warnings.push('⚠️  WARNING: Password hashing configuration unclear');
  }
  
  if (authContent.includes('jwt.sign') && authContent.includes('expiresIn')) {
    passed.push('✅ JWT tokens have expiration');
  } else {
    issues.push('❌ CRITICAL: JWT tokens may not have expiration');
  }
} else {
  issues.push('❌ CRITICAL: Auth implementation file not found');
}

// Check 5: Prisma Schema
console.log('Checking database schema...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  if (schemaContent.includes('@@index')) {
    passed.push('✅ Database indexes are defined');
  } else {
    warnings.push('⚠️  WARNING: No database indexes found');
  }
  
  if (schemaContent.includes('onDelete: Cascade')) {
    passed.push('✅ Cascade deletes are configured');
  } else {
    warnings.push('⚠️  WARNING: Cascade deletes may not be configured');
  }
} else {
  issues.push('❌ CRITICAL: Prisma schema not found');
}

// Check 6: Git Security
console.log('Checking git configuration...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  if (gitignoreContent.includes('.env')) {
    passed.push('✅ .env files are in .gitignore');
  } else {
    issues.push('❌ CRITICAL: .env files are not in .gitignore');
  }
  
  if (gitignoreContent.includes('node_modules')) {
    passed.push('✅ node_modules is in .gitignore');
  } else {
    warnings.push('⚠️  WARNING: node_modules not in .gitignore');
  }
}

// Print Results
console.log('\n' + '='.repeat(60));
console.log('SECURITY AUDIT RESULTS');
console.log('='.repeat(60) + '\n');

if (issues.length > 0) {
  console.log('🚨 CRITICAL ISSUES:\n');
  issues.forEach(issue => console.log(issue));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(warning => console.log(warning));
  console.log('');
}

if (passed.length > 0) {
  console.log('✅ PASSED CHECKS:\n');
  passed.forEach(pass => console.log(pass));
  console.log('');
}

// Final Verdict
console.log('='.repeat(60));
if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 PRODUCTION READY: All security checks passed!');
} else if (issues.length === 0) {
  console.log('⚠️  MOSTLY READY: No critical issues, but review warnings');
} else {
  console.log('❌ NOT PRODUCTION READY: Fix critical issues before deploying');
}
console.log('='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);
