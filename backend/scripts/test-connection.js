const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' });

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '***' : 'Not found');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    
    console.log('\nTables in the database:');
    console.table(tables);
    
  } catch (error) {
    console.error('❌ Error connecting to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
