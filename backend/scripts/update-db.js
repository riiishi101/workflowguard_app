const { PrismaClient } = require('@prisma/client');

async function updateDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Updating database schema...');
    
    // Drop the unique constraint first
    await prisma.$executeRaw`
      ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_hubspotPortalId_key";
    `;
    
    // Update the column type
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ALTER COLUMN "hubspotPortalId" TYPE INTEGER USING "hubspotPortalId"::integer;
    `;
    
    // Recreate the unique constraint
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD CONSTRAINT "User_hubspotPortalId_key" UNIQUE ("hubspotPortalId");
    `;
    
    console.log('Database schema updated successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase();
