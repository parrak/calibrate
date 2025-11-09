-- CreateTable
CREATE TABLE "ExplainTrace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "priceChangeId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "trace" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExplainTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExplainTrace_tenantId_entity_entityId_idx" ON "ExplainTrace"("tenantId", "entity", "entityId");

-- CreateIndex
CREATE INDEX "ExplainTrace_priceChangeId_idx" ON "ExplainTrace"("priceChangeId");

-- CreateIndex
CREATE INDEX "ExplainTrace_createdAt_idx" ON "ExplainTrace"("createdAt");

-- CreateIndex
CREATE INDEX "ExplainTrace_actor_idx" ON "ExplainTrace"("actor");

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExplainTrace" ADD CONSTRAINT "ExplainTrace_priceChangeId_fkey" FOREIGN KEY ("priceChangeId") REFERENCES "PriceChange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

