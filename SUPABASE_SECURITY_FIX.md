# Supabase Security Fix - Row Level Security (RLS)

## Problem
The Supabase linter is reporting security issues because Row Level Security (RLS) is disabled on all database tables. This is a critical security concern for production applications.

## Solution
We need to enable RLS on all tables and create appropriate policies to control access to data.

## Files Created
1. `backend/supabase-rls-fix.sql` - SQL script to run in Supabase SQL Editor
2. `backend/scripts/apply-rls-policies.js` - Node.js script to apply RLS policies
3. `backend/prisma/migrations/20250709000000_enable_rls_policies/migration.sql` - Prisma migration file

## How to Fix

### Option 1: Run SQL Script in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `backend/supabase-rls-fix.sql`
4. Run the script

This will:
- Enable RLS on all tables
- Drop any existing policies (to avoid conflicts)
- Create comprehensive RLS policies for all tables
- Verify that RLS is enabled

### Option 2: Run Node.js Script

If you have database access from your local environment:

```bash
cd backend
node scripts/apply-rls-policies.js
```

### Option 3: Use Prisma Migration

If you can connect to the database locally:

```bash
cd backend
npx prisma migrate deploy
```

## RLS Policies Overview

The policies ensure:

### User Data Access
- Users can only view and update their own profile
- Admins can view and update all users

### Workflow Access
- Users can only access workflows they own
- Admins can view all workflows
- Workflow versions are protected by workflow ownership

### Audit Logs
- Users can only view their own audit logs
- Users can create audit logs for themselves
- Admins can view all audit logs

### Subscriptions & Billing
- Users can only access their own subscription data
- Admins can view all subscriptions

### Webhooks
- Users can only manage their own webhooks
- Admins can view all webhooks

### Plans
- All authenticated users can view plans (read-only)

### API Keys
- Users can only manage their own API keys
- Admins can view all API keys

### SSO Configuration
- Only admins can manage SSO configuration
- Authenticated users can view SSO config for login purposes

## Verification

After applying the fix, run this query in Supabase SQL Editor to verify RLS is enabled:

```sql
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
```

All tables should show `rowsecurity = true`.

## Important Notes

1. **Backup First**: Always backup your database before applying security changes
2. **Test Thoroughly**: Test all application functionality after applying RLS
3. **Monitor Logs**: Watch for any access denied errors in your application
4. **Admin Access**: Ensure you have at least one admin user before applying RLS

## Troubleshooting

If you encounter issues:

1. **Access Denied Errors**: Check that your application is properly authenticated
2. **Admin Functions**: Ensure admin users have the correct role in the database
3. **Policy Conflicts**: The script includes `DROP POLICY IF EXISTS` to avoid conflicts

## Security Benefits

After applying these RLS policies:

- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Admins have appropriate access levels
- ✅ No unauthorized data access possible
- ✅ Complies with Supabase security best practices 