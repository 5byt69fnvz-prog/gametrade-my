-- CreateEnum
CREATE TYPE "VariantSelectionMode" AS ENUM ('NONE', 'PLATFORM', 'LOGIN', 'PLATFORM_LOGIN', 'REGION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TradeRiskStatus" AS ENUM ('NORMAL', 'REVIEW_REQUIRED', 'DISABLED');

-- User contact and seller passport
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phoneNormalized" DROP NOT NULL;
ALTER TABLE "SellerProfile" ADD COLUMN "onTimeRate" DECIMAL(5,2) NOT NULL DEFAULT 100;
ALTER TABLE "SellerProfile" ADD COLUMN "disputeRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "SellerProfile" ADD COLUMN "trustGrade" TEXT NOT NULL DEFAULT 'B';

-- Parent game metadata
ALTER TABLE "Game" ADD COLUMN "isService" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Game" ADD COLUMN "selectionMode" "VariantSelectionMode" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Game" ADD COLUMN "shortDescription" TEXT;

-- Game variants
CREATE TABLE "GameVariant" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platform" TEXT,
    "loginChannel" TEXT,
    "regionLabel" TEXT,
    "compatibilityNote" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameVariant_gameId_slug_key" ON "GameVariant"("gameId", "slug");
CREATE INDEX "GameVariant_gameId_active_sortOrder_idx" ON "GameVariant"("gameId", "active", "sortOrder");
ALTER TABLE "GameVariant" ADD CONSTRAINT "GameVariant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product policy per game
CREATE TABLE "GameProductType" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "labelZh" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelMs" TEXT NOT NULL,
    "riskStatus" "TradeRiskStatus" NOT NULL DEFAULT 'NORMAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameProductType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameProductType_gameId_code_key" ON "GameProductType"("gameId", "code");
CREATE INDEX "GameProductType_gameId_active_sortOrder_idx" ON "GameProductType"("gameId", "active", "sortOrder");
ALTER TABLE "GameProductType" ADD CONSTRAINT "GameProductType_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Listings reference the parent game and optional variant
ALTER TABLE "Listing" ADD COLUMN "gameVariantId" TEXT;
ALTER TABLE "Listing" ADD COLUMN "riskStatus" "TradeRiskStatus" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Listing" ADD COLUMN "termsRiskAcknowledged" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Listing_gameVariantId_status_createdAt_idx" ON "Listing"("gameVariantId", "status", "createdAt");
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_gameVariantId_fkey" FOREIGN KEY ("gameVariantId") REFERENCES "GameVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
