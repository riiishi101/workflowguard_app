-- Fix Supabase RLS Security Issues (Corrected for PostgreSQL column names)
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkflowVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Webhook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Overage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SsoConfig" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
DROP POLICY IF EXISTS "Admins can view all users" ON "User";
DROP POLICY IF EXISTS "Admins can update all users" ON "User";

DROP POLICY IF EXISTS "Users can view their own workflows" ON "Workflow";
DROP POLICY IF EXISTS "Users can create their own workflows" ON "Workflow";
DROP POLICY IF EXISTS "Users can update their own workflows" ON "Workflow";
DROP POLICY IF EXISTS "Users can delete their own workflows" ON "Workflow";
DROP POLICY IF EXISTS "Admins can view all workflows" ON "Workflow";

DROP POLICY IF EXISTS "Users can view versions of their workflows" ON "WorkflowVersion";
DROP POLICY IF EXISTS "Users can create versions for their workflows" ON "WorkflowVersion";
DROP POLICY IF EXISTS "Admins can view all workflow versions" ON "WorkflowVersion";

DROP POLICY IF EXISTS "Users can view their own audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "Users can create audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "Admins can view all audit logs" ON "AuditLog";

DROP POLICY IF EXISTS "Users can view their own subscription" ON "Subscription";
DROP POLICY IF EXISTS "Users can update their own subscription" ON "Subscription";
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON "Subscription";

DROP POLICY IF EXISTS "Users can view their own webhooks" ON "Webhook";
DROP POLICY IF EXISTS "Users can create their own webhooks" ON "Webhook";
DROP POLICY IF EXISTS "Users can update their own webhooks" ON "Webhook";
DROP POLICY IF EXISTS "Users can delete their own webhooks" ON "Webhook";
DROP POLICY IF EXISTS "Admins can view all webhooks" ON "Webhook";

DROP POLICY IF EXISTS "Authenticated users can view plans" ON "Plan";

DROP POLICY IF EXISTS "Users can view their own overages" ON "Overage";
DROP POLICY IF EXISTS "Users can create their own overages" ON "Overage";
DROP POLICY IF EXISTS "Users can update their own overages" ON "Overage";
DROP POLICY IF EXISTS "Admins can view all overages" ON "Overage";

DROP POLICY IF EXISTS "Users can view their own notification settings" ON "NotificationSettings";
DROP POLICY IF EXISTS "Users can update their own notification settings" ON "NotificationSettings";
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON "NotificationSettings";
DROP POLICY IF EXISTS "Admins can view all notification settings" ON "NotificationSettings";

DROP POLICY IF EXISTS "Users can view their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can create their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can update their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can delete their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Admins can view all API keys" ON "ApiKey";

DROP POLICY IF EXISTS "Admins can manage SSO config" ON "SsoConfig";
DROP POLICY IF EXISTS "Authenticated users can view SSO config" ON "SsoConfig";

-- User table policies
CREATE POLICY "Users can view their own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Admins can view all users" ON "User"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" ON "User"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Workflow table policies (using lowercase column names)
CREATE POLICY "Users can view their own workflows" ON "Workflow"
    FOR SELECT USING ("ownerId" = auth.uid()::text);

CREATE POLICY "Users can create their own workflows" ON "Workflow"
    FOR INSERT WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY "Users can update their own workflows" ON "Workflow"
    FOR UPDATE USING ("ownerId" = auth.uid()::text);

CREATE POLICY "Users can delete their own workflows" ON "Workflow"
    FOR DELETE USING ("ownerId" = auth.uid()::text);

CREATE POLICY "Admins can view all workflows" ON "Workflow"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- WorkflowVersion table policies (using lowercase column names)
CREATE POLICY "Users can view versions of their workflows" ON "WorkflowVersion"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Workflow" 
            WHERE id = "WorkflowVersion"."workflowId" AND "ownerId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can create versions for their workflows" ON "WorkflowVersion"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Workflow" 
            WHERE id = "WorkflowVersion"."workflowId" AND "ownerId" = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all workflow versions" ON "WorkflowVersion"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- AuditLog table policies (using lowercase column names)
CREATE POLICY "Users can view their own audit logs" ON "AuditLog"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create audit logs" ON "AuditLog"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all audit logs" ON "AuditLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Subscription table policies (using lowercase column names)
CREATE POLICY "Users can view their own subscription" ON "Subscription"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own subscription" ON "Subscription"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all subscriptions" ON "Subscription"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Webhook table policies (using lowercase column names)
CREATE POLICY "Users can view their own webhooks" ON "Webhook"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own webhooks" ON "Webhook"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own webhooks" ON "Webhook"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete their own webhooks" ON "Webhook"
    FOR DELETE USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all webhooks" ON "Webhook"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Plan table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view plans" ON "Plan"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Overage table policies (using lowercase column names)
CREATE POLICY "Users can view their own overages" ON "Overage"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own overages" ON "Overage"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own overages" ON "Overage"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all overages" ON "Overage"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- NotificationSettings table policies (using lowercase column names)
CREATE POLICY "Users can view their own notification settings" ON "NotificationSettings"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own notification settings" ON "NotificationSettings"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can insert their own notification settings" ON "NotificationSettings"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all notification settings" ON "NotificationSettings"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- ApiKey table policies (using lowercase column names)
CREATE POLICY "Users can view their own API keys" ON "ApiKey"
    FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can create their own API keys" ON "ApiKey"
    FOR INSERT WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own API keys" ON "ApiKey"
    FOR UPDATE USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete their own API keys" ON "ApiKey"
    FOR DELETE USING ("userId" = auth.uid()::text);

CREATE POLICY "Admins can view all API keys" ON "ApiKey"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- SsoConfig table policies (admin only)
CREATE POLICY "Admins can manage SSO config" ON "SsoConfig"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Allow authenticated users to read SSO config for login purposes
CREATE POLICY "Authenticated users can view SSO config" ON "SsoConfig"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'User', 'Workflow', 'WorkflowVersion', 'AuditLog', 
        'Subscription', 'Webhook', 'Plan', 'Overage', 
        'NotificationSettings', 'ApiKey', 'SsoConfig'
    ); 