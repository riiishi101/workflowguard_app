const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  const prisma = new PrismaClient();
  
  try {
    // Check if the column exists and get its type
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'hubspotPortalId';
    `;
    
    console.log('Column information:', JSON.stringify(columnInfo, null, 2));
    
    // Check if the unique constraint exists
    const constraintInfo = await prisma.$queryRaw`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'User_hubspotPortalId_key';
    `;
    
    console.log('Constraint information:', JSON.stringify(constraintInfo, null, 2));
    
  } catch (error) {
    console.error('Error verifying schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
