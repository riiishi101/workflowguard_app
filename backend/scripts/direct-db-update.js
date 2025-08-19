const { PrismaClient } = require('@prisma/client');

async function updateDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database update...');
    
    // 1. Drop the unique constraint if it exists
    console.log('Dropping unique constraint...');
    await prisma.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_hubspotPortalId_key"`;
    
    // 2. Add a temporary column
    console.log('Adding temporary column...');
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS temp_hubspot_portal_id INTEGER`;
    
    // 3. Copy and convert data
    console.log('Converting data...');
    await prisma.$executeRaw`
      UPDATE "User" 
      SET temp_hubspot_portal_id = CAST("hubspotPortalId" AS INTEGER)
      WHERE "hubspotPortalId" IS NOT NULL AND "hubspotPortalId" ~ '^[0-9]+$'`;
    
    // 4. Drop the old column
    console.log('Dropping old column...');
    await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN IF EXISTS "hubspotPortalId"`;
    
    // 5. Rename the temporary column
    console.log('Renaming column...');
    await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN temp_hubspot_portal_id TO "hubspotPortalId"`;
    
    // 6. Recreate the unique constraint
    console.log('Recreating unique constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD CONSTRAINT "User_hubspotPortalId_key" 
      UNIQUE ("hubspotPortalId")`;
    
    console.log('Database update completed successfully!');
    
  } catch (error) {
    console.error('Error updating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateDatabase().catch(console.error);
