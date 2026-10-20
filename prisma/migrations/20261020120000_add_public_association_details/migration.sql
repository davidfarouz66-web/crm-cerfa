ALTER TABLE "Association"
  ADD COLUMN IF NOT EXISTS "presentationPublique" TEXT,
  ADD COLUMN IF NOT EXISTS "remiseFondsDescription" TEXT;
