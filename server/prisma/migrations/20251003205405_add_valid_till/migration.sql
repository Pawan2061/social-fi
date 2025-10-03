/*
  Warnings:

  - Added the required column `ValidTill` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "ValidTill" TIMESTAMP(3) NOT NULL;
