-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "GroupInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_token_key" ON "GroupInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvitation_email_groupId_key" ON "GroupInvitation"("email", "groupId");

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
