-- Make Policy.projectId unique for upserts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Policy_projectId_key'
  ) THEN
    ALTER TABLE "Policy" ADD CONSTRAINT "Policy_projectId_key" UNIQUE ("projectId");
  END IF;
END $$;

