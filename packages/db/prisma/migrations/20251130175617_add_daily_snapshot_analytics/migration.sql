-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalSkus" INTEGER NOT NULL,
    "totalPriceChanges" INTEGER NOT NULL,
    "approvedChanges" INTEGER NOT NULL,
    "rejectedChanges" INTEGER NOT NULL,
    "pendingChanges" INTEGER NOT NULL,
    "appliedChanges" INTEGER NOT NULL,
    "averagePrice" INTEGER NOT NULL,
    "minPrice" INTEGER NOT NULL,
    "maxPrice" INTEGER NOT NULL,
    "medianPrice" INTEGER NOT NULL,
    "totalRevenue" INTEGER,
    "totalUnits" INTEGER,
    "averageOrderValue" INTEGER,
    "averageMargin" DOUBLE PRECISION,
    "minMargin" DOUBLE PRECISION,
    "maxMargin" DOUBLE PRECISION,
    "competitorsSampled" INTEGER,
    "avgCompetitiveDelta" DOUBLE PRECISION,
    "pricesBelowMarket" INTEGER,
    "pricesAboveMarket" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_projectId_snapshotDate_key" ON "DailySnapshot"("projectId", "snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_projectId_snapshotDate_idx" ON "DailySnapshot"("projectId", "snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_snapshotDate_idx" ON "DailySnapshot"("snapshotDate");

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
