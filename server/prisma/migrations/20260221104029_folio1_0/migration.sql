-- CreateEnum
CREATE TYPE "ShuoAttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'GIF');

-- CreateTable
CREATE TABLE "shuo_attachments" (
    "id" TEXT NOT NULL,
    "type" "ShuoAttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "size" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,

    CONSTRAINT "shuo_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shuo_attachments_postId_idx" ON "shuo_attachments"("postId");

-- AddForeignKey
ALTER TABLE "shuo_attachments" ADD CONSTRAINT "shuo_attachments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
