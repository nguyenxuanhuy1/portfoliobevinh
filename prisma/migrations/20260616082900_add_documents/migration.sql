-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" VARCHAR(50) NOT NULL,
    "tags" TEXT[],
    "md_download_url" VARCHAR(500) NOT NULL,
    "download_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
