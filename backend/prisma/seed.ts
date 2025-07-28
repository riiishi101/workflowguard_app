import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed plans (production only)
  await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {},
    create: {
      id: 'starter',
      name: 'Starter',
      maxWorkflows: 25,
      historyDays: 30,
      features: ['basic_monitoring', 'email_support'],
    },
  });
  await prisma.plan.upsert({
    where: { id: 'professional' },
    update: {},
    create: {
      id: 'professional',
      name: 'Professional',
      maxWorkflows: 500,
      historyDays: 90,
      features: [
        'advanced_monitoring',
        'priority_support',
        'custom_notifications',
      ],
    },
  });
  await prisma.plan.upsert({
    where: { id: 'enterprise' },
    update: {},
    create: {
      id: 'enterprise',
      name: 'Enterprise',
      maxWorkflows: null,
      historyDays: null,
      features: [
        'unlimited_workflows',
        'advanced_monitoring',
        '24_7_support',
        'api_access',
        'user_permissions',
        'audit_logs',
      ],
    },
  });
  console.log('✅ Seeded plans');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 