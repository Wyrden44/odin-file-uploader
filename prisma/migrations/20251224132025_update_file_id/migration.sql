/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("storageKey");
