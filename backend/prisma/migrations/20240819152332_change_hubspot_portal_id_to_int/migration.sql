-- AlterTable
ALTER TABLE "User" 
ALTER COLUMN "hubspotPortalId" TYPE INTEGER USING "hubspotPortalId"::integer;
