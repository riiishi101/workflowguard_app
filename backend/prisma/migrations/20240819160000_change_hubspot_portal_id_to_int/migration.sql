-- First, drop any existing constraints that reference the column
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_hubspotPortalId_key";

-- Then alter the column type
ALTER TABLE "User" 
ALTER COLUMN "hubspotPortalId" TYPE INTEGER USING "hubspotPortalId"::integer;

-- Recreate the unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_hubspotPortalId_key" UNIQUE ("hubspotPortalId");
