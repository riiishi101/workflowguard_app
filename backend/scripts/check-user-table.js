const { PrismaClient } = require('@prisma/client');

async function checkUserTable() {
  const prisma = new PrismaClient();
  
  try {
    // Get the table definition
    const tableDef = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User';
    `;
    
    console.log('User table columns:');
    console.table(tableDef);
    
    // Check for the unique constraint
    const constraints = await prisma.$queryRaw`
      SELECT conname, conkey, contype
      FROM pg_constraint
      WHERE conrelid = 'public."User"'::regclass;
    `;
    
    console.log('\nTable constraints:');
    console.table(constraints);
    
  } catch (error) {
    console.error('Error checking User table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTable();
