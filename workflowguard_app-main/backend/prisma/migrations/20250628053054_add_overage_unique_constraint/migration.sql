/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,periodStart,periodEnd]` on the table `Overage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Overage_userId_type_periodStart_periodEnd_key" ON "Overage"("userId", "type", "periodStart", "periodEnd");
