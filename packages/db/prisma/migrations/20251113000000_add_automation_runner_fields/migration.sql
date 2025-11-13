-- M0.5: Automation Runner Foundation
-- Add fields to RuleRun and RuleTarget for automation, retry tracking, and state management

-- Add new fields to RuleRun
ALTER TABLE "RuleRun" ADD COLUMN "queuedAt" TIMESTAMPTZ(6);
ALTER TABLE "RuleRun" ADD COLUMN "metadata" JSONB;

-- Add new fields to RuleTarget
ALTER TABLE "RuleTarget" ADD COLUMN "skuId" TEXT;
ALTER TABLE "RuleTarget" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RuleTarget" ADD COLUMN "lastAttempt" TIMESTAMPTZ(6);
ALTER TABLE "RuleTarget" ADD COLUMN "appliedAt" TIMESTAMPTZ(6);

-- Add PARTIAL status to RuleRunStatus enum
ALTER TYPE "RuleRunStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- Add APPLYING status to RuleTargetStatus enum
ALTER TYPE "RuleTargetStatus" ADD VALUE IF NOT EXISTS 'APPLYING';

-- Create indexes for automation runner queries
CREATE INDEX IF NOT EXISTS "RuleRun_queuedAt_idx" ON "RuleRun"("queuedAt");
CREATE INDEX IF NOT EXISTS "RuleTarget_status_lastAttempt_idx" ON "RuleTarget"("status", "lastAttempt");
CREATE INDEX IF NOT EXISTS "RuleTarget_skuId_idx" ON "RuleTarget"("skuId");

-- Add comments
COMMENT ON COLUMN "RuleRun"."queuedAt" IS 'M0.5: Timestamp when run was queued for processing';
COMMENT ON COLUMN "RuleRun"."metadata" IS 'M0.5: Additional context (actor, correlation ID, etc.)';
COMMENT ON COLUMN "RuleTarget"."skuId" IS 'M0.5: SKU reference for price lookups';
COMMENT ON COLUMN "RuleTarget"."attempts" IS 'M0.5: Number of retry attempts';
COMMENT ON COLUMN "RuleTarget"."lastAttempt" IS 'M0.5: Timestamp of last retry attempt';
COMMENT ON COLUMN "RuleTarget"."appliedAt" IS 'M0.5: Timestamp when successfully applied';
