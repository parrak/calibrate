-- AlterTable
ALTER TABLE "CopilotQueryLog" ADD COLUMN     "feedbackAt" TIMESTAMP(3),
ADD COLUMN     "feedbackComment" TEXT,
ADD COLUMN     "feedbackRating" INTEGER;
