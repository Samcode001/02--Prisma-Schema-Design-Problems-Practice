/*
  Warnings:

  - Made the column `seen` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "seen" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL;
