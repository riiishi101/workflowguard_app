import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed plans only - no demo/test data
  await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {},
    create: {
      id: 'starter',
      name: 'Starter',
      price: 19.00,
      description: 'Perfect for small teams getting started with workflow protection',
      features: [
        'workflow_selection',
        'dashboard_overview', 
        'basic_version_history',
        'simple_comparison',
        'basic_restore',
        'email_support',
        'basic_settings'
      ] as any,
    },
  });
  await prisma.plan.upsert({
    where: { id: 'professional' },
    update: {},
    create: {
      id: 'professional',
      name: 'Professional',
      price: 49.00,
      description: 'For growing businesses that need advanced workflow management',
      features: [
        'enhanced_dashboard',
        'advanced_workflow_history',
        'improved_comparison',
        'team_management',
        'audit_log',
        'api_access',
        'enhanced_settings',
        'priority_support'
      ] as any,
    },
  });
  await prisma.plan.upsert({
    where: { id: 'enterprise' },
    update: {},
    create: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.00,
      description: 'For large organizations requiring unlimited workflow protection',
      features: [
        'unlimited_workflows',
        'extended_history',
        'advanced_analytics',
        'unlimited_team',
        'extended_audit_log',
        'dedicated_support',
        'all_settings_features',
        'advanced_comparison'
      ] as any,
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