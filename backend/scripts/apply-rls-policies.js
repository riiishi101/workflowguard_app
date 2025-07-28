const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyRLSPolicies() {
  try {
    console.log('Applying RLS policies...');
    
    // Enable RLS on all tables
    await prisma.$executeRaw`ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "WorkflowVersion" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Webhook" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "Overage" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;`;
    await prisma.$executeRaw`ALTER TABLE "SsoConfig" ENABLE ROW LEVEL SECURITY;`;

    console.log('RLS enabled on all tables');

    // User table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own profile" ON "User"
        FOR SELECT USING (auth.uid()::text = id);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own profile" ON "User"
        FOR UPDATE USING (auth.uid()::text = id);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all users" ON "User"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can update all users" ON "User"
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // Workflow table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own workflows" ON "Workflow"
        FOR SELECT USING (ownerId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create their own workflows" ON "Workflow"
        FOR INSERT WITH CHECK (ownerId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own workflows" ON "Workflow"
        FOR UPDATE USING (ownerId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can delete their own workflows" ON "Workflow"
        FOR DELETE USING (ownerId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all workflows" ON "Workflow"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // WorkflowVersion table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view versions of their workflows" ON "WorkflowVersion"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "Workflow" 
            WHERE id = "WorkflowVersion".workflowId AND ownerId = auth.uid()::text
          )
        );
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create versions for their workflows" ON "WorkflowVersion"
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM "Workflow" 
            WHERE id = "WorkflowVersion".workflowId AND ownerId = auth.uid()::text
          )
        );
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all workflow versions" ON "WorkflowVersion"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // AuditLog table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own audit logs" ON "AuditLog"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create audit logs" ON "AuditLog"
        FOR INSERT WITH CHECK (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all audit logs" ON "AuditLog"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // Subscription table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own subscription" ON "Subscription"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own subscription" ON "Subscription"
        FOR UPDATE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all subscriptions" ON "Subscription"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // Webhook table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own webhooks" ON "Webhook"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create their own webhooks" ON "Webhook"
        FOR INSERT WITH CHECK (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own webhooks" ON "Webhook"
        FOR UPDATE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can delete their own webhooks" ON "Webhook"
        FOR DELETE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all webhooks" ON "Webhook"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // Plan table policies
    await prisma.$executeRaw`
      CREATE POLICY "Authenticated users can view plans" ON "Plan"
        FOR SELECT USING (auth.role() = 'authenticated');
    `;

    // Overage table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own overages" ON "Overage"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create their own overages" ON "Overage"
        FOR INSERT WITH CHECK (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own overages" ON "Overage"
        FOR UPDATE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all overages" ON "Overage"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // NotificationSettings table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own notification settings" ON "NotificationSettings"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own notification settings" ON "NotificationSettings"
        FOR UPDATE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can insert their own notification settings" ON "NotificationSettings"
        FOR INSERT WITH CHECK (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all notification settings" ON "NotificationSettings"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // ApiKey table policies
    await prisma.$executeRaw`
      CREATE POLICY "Users can view their own API keys" ON "ApiKey"
        FOR SELECT USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can create their own API keys" ON "ApiKey"
        FOR INSERT WITH CHECK (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can update their own API keys" ON "ApiKey"
        FOR UPDATE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Users can delete their own API keys" ON "ApiKey"
        FOR DELETE USING (userId = auth.uid()::text);
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Admins can view all API keys" ON "ApiKey"
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    // SsoConfig table policies
    await prisma.$executeRaw`
      CREATE POLICY "Admins can manage SSO config" ON "SsoConfig"
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
          )
        );
    `;

    await prisma.$executeRaw`
      CREATE POLICY "Authenticated users can view SSO config" ON "SsoConfig"
        FOR SELECT USING (auth.role() = 'authenticated');
    `;

    console.log('All RLS policies applied successfully!');
  } catch (error) {
    console.error('Error applying RLS policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLSPolicies(); 