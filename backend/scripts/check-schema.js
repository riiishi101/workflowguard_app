const { PrismaClient } = require('@prisma/client');

async function checkSchema() {
  const prisma = new PrismaClient();
  
  try {
    // Check if the column exists and its type
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `;
    
    console.log('User table columns:');
    console.table(columnInfo);
    
    // Check for the unique constraint
    const constraints = await prisma.$queryRaw`
      SELECT conname, conkey, contype
      FROM pg_constraint
      WHERE conrelid = 'public."User"'::regclass;
    `;
    
    console.log('\nTable constraints:');
    console.table(constraints);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
