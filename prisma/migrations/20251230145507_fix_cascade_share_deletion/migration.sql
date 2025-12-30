-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_folderId_fkey";

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
