/*
  Warnings:

  - A unique constraint covering the columns `[vault_address]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "vault_address" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_vault_address_key" ON "user"("vault_address");
