/*
  Warnings:

  - A unique constraint covering the columns `[creatorId]` on the table `Pass` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pass_creatorId_key" ON "Pass"("creatorId");
