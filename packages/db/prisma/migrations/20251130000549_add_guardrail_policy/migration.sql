-- CreateTable
CREATE TABLE "GuardrailPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "minMarginPct" DOUBLE PRECISION,
    "minPriceCents" INTEGER,
    "maxPriceIncreasePct" DOUBLE PRECISION,
    "maxPriceDecreasePct" DOUBLE PRECISION,
    "maxChangesPerDay" INTEGER,
    "minChangeIntervalMinutes" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardrailPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardrailPolicy_projectId_key" ON "GuardrailPolicy"("projectId");

-- CreateIndex
CREATE INDEX "GuardrailPolicy_tenantId_projectId_idx" ON "GuardrailPolicy"("tenantId", "projectId");

-- AddForeignKey
ALTER TABLE "GuardrailPolicy" ADD CONSTRAINT "GuardrailPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardrailPolicy" ADD CONSTRAINT "GuardrailPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
