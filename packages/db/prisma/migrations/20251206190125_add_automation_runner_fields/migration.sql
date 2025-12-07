-- Add automation runner fields to RuleRun
-- M0.5: Automation Runner Foundation

-- Add timestamp fields for tracking run completion and failure
ALTER TABLE "RuleRun" ADD COLUMN "completedAt" TIMESTAMPTZ(6);
ALTER TABLE "RuleRun" ADD COLUMN "failedAt" TIMESTAMPTZ(6);

-- Add price fields to RuleTarget for fast queries
-- Complements beforeJson/afterJson with indexed integer values
ALTER TABLE "RuleTarget" ADD COLUMN "fromPrice" INTEGER;
ALTER TABLE "RuleTarget" ADD COLUMN "toPrice" INTEGER;
