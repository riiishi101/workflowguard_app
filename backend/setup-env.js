#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔧 WorkflowGuard Environment Setup');
console.log('=====================================\n');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('📋 Environment Variables for Render:');
console.log('=====================================\n');

console.log('DATABASE_URL=postgresql://postgres.lynnyddkcfurwgzgekpn:Liverpoolisthebest%401998@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
console.log('DIRECT_URL=postgresql://postgres.lynnyddkcfurwgzgekpn:Liverpoolisthebest%401998@aws-0-us-west-1.pooler.supabase.com:5432/postgres');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('HUBSPOT_CLIENT_ID=your-hubspot-client-id');
console.log('HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret');
console.log('HUBSPOT_REDIRECT_URI=https://your-backend-url.onrender.com/api/auth/callback');
console.log('FRONTEND_URL=https://your-frontend-url.vercel.app');
console.log('NODE_ENV=production');

console.log('\n📝 Instructions:');
console.log('1. Copy these environment variables to your Render dashboard');
console.log('2. Replace "your-hubspot-client-id" and "your-hubspot-client-secret" with your actual HubSpot credentials');
console.log('3. Update "your-backend-url.onrender.com" with your actual Render backend URL');
console.log('4. Update "your-frontend-url.vercel.app" with your actual frontend URL');
console.log('5. The @ symbol in your password has been URL-encoded as %40');
console.log('6. PORT will be automatically assigned by Render (no need to set it)');
console.log('7. DATABASE_URL uses connection pooling (port 6543)');
console.log('8. DIRECT_URL is for migrations (port 5432)');

console.log('\n🔍 Database Connection Test:');
console.log('After setting up the environment variables, you can test the database connection by:');
console.log('1. Going to your Render service dashboard');
console.log('2. Click on "Shell" tab');
console.log('3. Run: npx prisma db pull');
console.log('4. If successful, run: npx prisma generate'); 