-- CreateTable: Audit
-- This table was defined in schema.prisma but the migration was missing
-- It's used to track audit logs for price changes and other entities

CREATE TABLE IF NOT EXISTS "Audit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "explain" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Audit_tenantId_entity_entityId_idx" ON "Audit"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Audit_actor_idx" ON "Audit"("actor");

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
