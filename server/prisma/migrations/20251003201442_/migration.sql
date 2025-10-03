/*
  Warnings:

  - You are about to drop the column `vault_address` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vault_address]` on the table `Pass` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."user_vault_address_key";

-- AlterTable
ALTER TABLE "Pass" ADD COLUMN     "vault_address" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "vault_address";

-- CreateIndex
CREATE UNIQUE INDEX "Pass_vault_address_key" ON "Pass"("vault_address");
