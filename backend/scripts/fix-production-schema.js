const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductionSchema() {
  try {
    console.log('🔧 Starting production schema fix...');

    // Check if MonitoredWorkflow table exists and create it if needed
    console.log('📋 Checking MonitoredWorkflow table...');
    
    // Try to create the MonitoredWorkflow table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "MonitoredWorkflow" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "workflowId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY ("id")
        );
      `;
      console.log('✅ MonitoredWorkflow table created/verified');
    } catch (error) {
      console.log('⚠️ MonitoredWorkflow table already exists or error:', error.message);
    }

    // Add missing columns to Workflow table if they don't exist
    console.log('📋 Checking Workflow table columns...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "autoSync" BOOLEAN DEFAULT true;
      `;
      console.log('✅ Added autoSync column to Workflow table');
    } catch (error) {
      console.log('⚠️ autoSync column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "syncInterval" INTEGER DEFAULT 3600;
      `;
      console.log('✅ Added syncInterval column to Workflow table');
    } catch (error) {
      console.log('⚠️ syncInterval column already exists or error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN DEFAULT true;
      `;
      console.log('✅ Added notificationsEnabled column to Workflow table');
    } catch (error) {
      console.log('⚠️ notificationsEnabled column already exists or error:', error.message);
    }

    // Update WorkflowVersion table to rename versionNumber to version if needed
    console.log('📋 Checking WorkflowVersion table...');
    
    try {
      // Check if versionNumber column exists
      const columns = await prisma.$queryRaw`
        PRAGMA table_info("WorkflowVersion");
      `;
      
      const hasVersionNumber = columns.some(col => col.name === 'versionNumber');
      const hasVersion = columns.some(col => col.name === 'version');
      
      if (hasVersionNumber && !hasVersion) {
        await prisma.$executeRaw`
          ALTER TABLE "WorkflowVersion" RENAME COLUMN "versionNumber" TO "version";
        `;
        console.log('✅ Renamed versionNumber to version in WorkflowVersion table');
      } else if (hasVersion) {
        console.log('✅ Version column already exists in WorkflowVersion table');
      } else {
        // Add version column if neither exists
        await prisma.$executeRaw`
          ALTER TABLE "WorkflowVersion" ADD COLUMN "version" INTEGER;
        `;
        console.log('✅ Added version column to WorkflowVersion table');
      }
    } catch (error) {
      console.log('⚠️ WorkflowVersion table update error:', error.message);
    }

    // Add description column to WorkflowVersion if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "WorkflowVersion" ADD COLUMN IF NOT EXISTS "description" TEXT;
      `;
      console.log('✅ Added description column to WorkflowVersion table');
    } catch (error) {
      console.log('⚠️ description column already exists or error:', error.message);
    }

    console.log('🎉 Production schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionSchema()
  .then(() => {
    console.log('✅ Schema fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  }); 