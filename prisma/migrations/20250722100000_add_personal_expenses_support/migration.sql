-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_groupId_fkey";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "groupId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
