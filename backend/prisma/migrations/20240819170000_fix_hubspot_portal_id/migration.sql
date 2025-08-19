-- Drop the unique constraint if it exists
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_hubspotPortalId_key";

-- Add a temporary column to store the integer values
ALTER TABLE "User" ADD COLUMN "temp_hubspot_portal_id" INTEGER;

-- Copy and convert the data
UPDATE "User" SET "temp_hubspot_portal_id" = "hubspotPortalId"::INTEGER 
WHERE "hubspotPortalId" IS NOT NULL AND "hubspotPortalId" ~ '^[0-9]+$';

-- Drop the old column
ALTER TABLE "User" DROP COLUMN "hubspotPortalId";

-- Rename the temporary column
ALTER TABLE "User" RENAME COLUMN "temp_hubspot_portal_id" TO "hubspotPortalId";

-- Recreate the unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_hubspotPortalId_key" 
UNIQUE ("hubspotPortalId");
