/*
  Warnings:

  - You are about to drop the column `proofUrl` on the `Claim` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "proofUrl";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "claimId" INTEGER;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
