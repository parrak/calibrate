-- CreateEnum
CREATE TYPE "RuleRunStatus" AS ENUM ('PREVIEW', 'QUEUED', 'APPLYING', 'APPLIED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "RuleTargetStatus" AS ENUM ('PREVIEW', 'QUEUED', 'APPLIED', 'FAILED', 'ROLLED_BACK');

-- AlterTable
ALTER TABLE "PriceChange" ADD COLUMN "productId" TEXT,
ADD COLUMN "variantId" TEXT,
ADD COLUMN "ruleRunId" TEXT,
ADD COLUMN "compareAtOld" INTEGER,
ADD COLUMN "compareAtNew" INTEGER;

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "selectorJson" JSONB NOT NULL,
    "transformJson" JSONB NOT NULL,
    "scheduleAt" TIMESTAMPTZ(6),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "RuleRunStatus" NOT NULL DEFAULT 'PREVIEW',
    "scheduledFor" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "explainJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RuleRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleTarget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ruleRunId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "status" "RuleTargetStatus" NOT NULL DEFAULT 'PREVIEW',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RuleTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingRule_tenantId_projectId_enabled_idx" ON "PricingRule"("tenantId", "projectId", "enabled");

-- CreateIndex
CREATE INDEX "PricingRule_scheduleAt_idx" ON "PricingRule"("scheduleAt");

-- CreateIndex
CREATE INDEX "PricingRule_deletedAt_idx" ON "PricingRule"("deletedAt");

-- CreateIndex
CREATE INDEX "RuleRun_tenantId_projectId_status_idx" ON "RuleRun"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "RuleRun_ruleId_status_idx" ON "RuleRun"("ruleId", "status");

-- CreateIndex
CREATE INDEX "RuleRun_scheduledFor_idx" ON "RuleRun"("scheduledFor");

-- CreateIndex
CREATE INDEX "RuleRun_createdAt_idx" ON "RuleRun"("createdAt");

-- CreateIndex
CREATE INDEX "RuleTarget_tenantId_projectId_status_idx" ON "RuleTarget"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "RuleTarget_ruleRunId_status_idx" ON "RuleTarget"("ruleRunId", "status");

-- CreateIndex
CREATE INDEX "RuleTarget_productId_idx" ON "RuleTarget"("productId");

-- CreateIndex
CREATE INDEX "RuleTarget_variantId_idx" ON "RuleTarget"("variantId");

-- CreateIndex
CREATE INDEX "PriceChange_ruleRunId_idx" ON "PriceChange"("ruleRunId");

-- CreateIndex
CREATE INDEX "PriceChange_productId_idx" ON "PriceChange"("productId");

-- CreateIndex
CREATE INDEX "PriceChange_variantId_idx" ON "PriceChange"("variantId");

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleRun" ADD CONSTRAINT "RuleRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PricingRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleTarget" ADD CONSTRAINT "RuleTarget_ruleRunId_fkey" FOREIGN KEY ("ruleRunId") REFERENCES "RuleRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
