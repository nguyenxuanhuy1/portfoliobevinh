-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "download_url" TYPE TEXT[] USING ARRAY[download_url];
