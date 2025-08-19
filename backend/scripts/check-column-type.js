const { PrismaClient } = require('@prisma/client');

async function checkColumnType() {
  const prisma = new PrismaClient();
  
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'hubspotPortalId';
    `;
    
    console.log('Column type check result:', result);
  } catch (error) {
    console.error('Error checking column type:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnType();
