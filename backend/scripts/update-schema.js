const { PrismaClient } = require('@prisma/client');

async function updateSchema() {
  // Use the direct connection URL from the environment
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connection successful!');

    // List all tables to verify connection
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    
    console.log('\nCurrent tables in database:');
    console.table(tables);

    // Check if User table exists
    const userTableExists = tables.some(t => t.table_name === 'User');
    
    if (!userTableExists) {
      console.error('Error: User table does not exist in the database.');
      console.log('Please run database migrations first.');
      return;
    }

    // Check current schema of User table
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `;
    
    console.log('\nCurrent User table columns:');
    console.table(userColumns);

    // Check if we need to update the hubspotPortalId column
    const hubspotColumn = userColumns.find(col => col.column_name === 'hubspotPortalId');
    
    if (hubspotColumn) {
      console.log('\nCurrent hubspotPortalId type:', hubspotColumn.data_type);
      
      if (hubspotColumn.data_type.toLowerCase() === 'integer') {
        console.log('hubspotPortalId is already an integer. No changes needed.');
        return;
      }
      
      console.log('Updating hubspotPortalId to integer type...');
      
      // Drop the unique constraint if it exists
      try {
        await prisma.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_hubspotPortalId_key"`;
        console.log('Dropped unique constraint on hubspotPortalId');
      } catch (error) {
        console.log('No unique constraint to drop or error dropping:', error.message);
      }
      
      // Create a temporary column
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS temp_hubspot_portal_id INTEGER`;
      
      // Copy and convert data
      await prisma.$executeRaw`
        UPDATE "User" 
        SET temp_hubspot_portal_id = CAST("hubspotPortalId" AS INTEGER)
        WHERE "hubspotPortalId" IS NOT NULL AND "hubspotPortalId" ~ '^[0-9]+$';
      `;
      
      // Drop the old column
      await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN IF EXISTS "hubspotPortalId"`;
      
      // Rename the temporary column
      await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN temp_hubspot_portal_id TO "hubspotPortalId"`;
      
      // Recreate the unique constraint
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD CONSTRAINT "User_hubspotPortalId_key" 
        UNIQUE ("hubspotPortalId");
      `;
      
      console.log('Successfully updated hubspotPortalId to integer type');
    } else {
      console.log('hubspotPortalId column does not exist. Creating it as integer type...');
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ADD COLUMN "hubspotPortalId" INTEGER UNIQUE;
      `;
      console.log('Created hubspotPortalId as integer type');
    }
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Run the update
updateSchema();
