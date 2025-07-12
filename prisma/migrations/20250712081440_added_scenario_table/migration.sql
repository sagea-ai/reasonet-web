/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `workspaces` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_creatorId_fkey";

-- DropIndex
DROP INDEX "workspaces_organizationId_slug_key";

-- AlterTable
ALTER TABLE "workspaces" ALTER COLUMN "icon" SET NOT NULL;

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "timeframe" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "marketData" TEXT,
    "verifiableFactors" TEXT,
    "backwardReasoning" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
