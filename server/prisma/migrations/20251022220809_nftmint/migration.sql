/*
  Warnings:

  - A unique constraint covering the columns `[nftMint]` on the table `Ownership` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ownership" ADD COLUMN     "nftMint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_nftMint_key" ON "Ownership"("nftMint");
