/*
  Warnings:

  - You are about to drop the column `ValidTill` on the `Claim` table. All the data in the column will be lost.
  - Added the required column `validTill` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "ValidTill",
ADD COLUMN     "validTill" TIMESTAMP(3) NOT NULL;
