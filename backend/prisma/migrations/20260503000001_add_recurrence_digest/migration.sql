-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "recurrenceRule" TEXT,
ADD COLUMN "parentId" TEXT;

-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN "recurrenceRule" TEXT,
ADD COLUMN "parentId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "digestSentAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ActionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
