-- Check actual column names in the database
-- Run this first to see what column names actually exist

-- Check Workflow table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Workflow' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check WorkflowVersion table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'WorkflowVersion' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check AuditLog table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AuditLog' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check Subscription table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Subscription' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check Webhook table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Webhook' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check Overage table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Overage' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check NotificationSettings table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'NotificationSettings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check ApiKey table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ApiKey' 
AND table_schema = 'public'
ORDER BY ordinal_position; 