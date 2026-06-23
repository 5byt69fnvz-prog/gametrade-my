CREATE TYPE "ListingImageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingImageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingImage_listingId_status_sortOrder_idx" ON "ListingImage"("listingId", "status", "sortOrder");
CREATE INDEX "ListingImage_uploaderId_createdAt_idx" ON "ListingImage"("uploaderId", "createdAt");

ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
