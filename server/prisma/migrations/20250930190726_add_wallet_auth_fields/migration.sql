/*
  Warnings:

  - A unique constraint covering the columns `[wallet]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wallet" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_key" ON "user"("wallet");
