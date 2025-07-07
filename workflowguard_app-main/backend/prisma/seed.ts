import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const testUser = await prisma.user.upsert({
    where: { email: 'test@workflowguard.com' },
    update: {},
    create: {
      email: 'test@workflowguard.com',
      name: 'Test User',
      role: 'admin',
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@workflowguard.com' },
    update: {},
    create: {
      email: 'demo@workflowguard.com',
      name: 'Demo User',
      role: 'restorer',
    },
  });

  console.log('✅ Created test users');

  // Create subscriptions for test users
  await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      planId: 'professional',
      status: 'trial',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      planId: 'starter',
      status: 'active',
      trialEndDate: null,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create test workflows
  const workflows = [
    {
      hubspotId: 'workflow_001',
      name: 'Customer Onboarding Flow',
      ownerId: testUser.id,
    },
    {
      hubspotId: 'workflow_002',
      name: 'Lead Nurturing Campaign',
      ownerId: testUser.id,
    },
    {
      hubspotId: 'workflow_003',
      name: 'Email Marketing Automation',
      ownerId: demoUser.id,
    },
    {
      hubspotId: 'workflow_004',
      name: 'Sales Pipeline Management',
      ownerId: testUser.id,
    },
    {
      hubspotId: 'workflow_005',
      name: 'Customer Feedback Collection',
      ownerId: demoUser.id,
    },
  ];

  for (const workflowData of workflows) {
    const workflow = await prisma.workflow.upsert({
      where: { hubspotId: workflowData.hubspotId },
      update: {},
      create: workflowData,
    });

    // Create some workflow versions for each workflow
    const versions = [
      {
        versionNumber: 1,
        snapshotType: 'manual',
        createdBy: workflowData.ownerId,
        data: {
          name: workflowData.name,
          version: '1.0',
          steps: [
            { id: 'step1', type: 'trigger', name: 'Contact Created' },
            { id: 'step2', type: 'action', name: 'Send Welcome Email' },
          ],
        },
      },
      {
        versionNumber: 2,
        snapshotType: 'on-publish',
        createdBy: workflowData.ownerId,
        data: {
          name: workflowData.name,
          version: '1.1',
          steps: [
            { id: 'step1', type: 'trigger', name: 'Contact Created' },
            { id: 'step2', type: 'action', name: 'Send Welcome Email' },
            { id: 'step3', type: 'action', name: 'Add to Nurture List' },
          ],
        },
      },
    ];

    for (const versionData of versions) {
      await prisma.workflowVersion.upsert({
        where: {
          workflowId_versionNumber: {
            workflowId: workflow.id,
            versionNumber: versionData.versionNumber,
          },
        },
        update: {},
        create: {
          ...versionData,
          workflowId: workflow.id,
        },
      });
    }
  }

  console.log('✅ Created test workflows with versions');

  // Create some audit logs
  const auditLogs = [
    {
      userId: testUser.id,
      action: 'create',
      entityType: 'workflow',
      entityId: 'workflow_001',
      newValue: { name: 'Customer Onboarding Flow' },
    },
    {
      userId: testUser.id,
      action: 'update',
      entityType: 'workflow',
      entityId: 'workflow_001',
      oldValue: { version: '1.0' },
      newValue: { version: '1.1' },
    },
    {
      userId: demoUser.id,
      action: 'restore',
      entityType: 'workflow',
      entityId: 'workflow_003',
      oldValue: { version: '1.2' },
      newValue: { version: '1.0' },
    },
  ];

  for (const logData of auditLogs) {
    await prisma.auditLog.create({
      data: logData,
    });
  }

  console.log('✅ Created test audit logs');

  // Seed plans
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