/*
  Warnings:

  - A unique constraint covering the columns `[hubspotPortalId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hubspotPortalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_hubspotPortalId_key" ON "User"("hubspotPortalId");
