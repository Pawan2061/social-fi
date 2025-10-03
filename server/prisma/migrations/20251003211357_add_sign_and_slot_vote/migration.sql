/*
  Warnings:

  - Added the required column `txSig` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "blockSlot" INTEGER,
ADD COLUMN     "txSig" TEXT NOT NULL;
