-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTrialActive" BOOLEAN DEFAULT false,
ADD COLUMN     "planId" TEXT DEFAULT 'starter',
ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialPlanId" TEXT,
ADD COLUMN     "trialStartDate" TIMESTAMP(3);
