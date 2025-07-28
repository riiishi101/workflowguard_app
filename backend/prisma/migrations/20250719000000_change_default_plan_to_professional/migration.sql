-- Change default plan from starter to professional
-- Update existing users who have starter plan and no trial to professional with trial
UPDATE "User" 
SET 
  "planId" = 'professional',
  "isTrialActive" = true,
  "trialPlanId" = 'professional',
  "trialStartDate" = NOW(),
  "trialEndDate" = NOW() + INTERVAL '21 days'
WHERE 
  "planId" = 'starter' 
  AND ("isTrialActive" IS NULL OR "isTrialActive" = false)
  AND ("trialPlanId" IS NULL OR "trialPlanId" != 'professional');

-- Update the default value for new users (this will be applied by schema change)
-- The schema change from @default("starter") to @default("professional") 
-- and @default(false) to @default(true) for isTrialActive will be applied 