-- Societies are removed from the product and replaced by the virtual campus
-- tour. The data below must be cleared BEFORE the enum types are rewritten:
-- Postgres casts every existing row through the new enum, so a surviving
-- 'SOCIETY' value would abort the whole migration.

-- Society categories seeded for the old module.
DELETE FROM "TaxonomyTerm" WHERE "kind" = 'SOCIETY';

-- Public submissions that targeted societies, if any were ever received.
DELETE FROM "Submission" WHERE "kind" = 'SOCIETY';

-- Homepage layouts keep their position: the societies slot becomes the tour.
-- Done as an UPDATE rather than delete-and-insert so each university's chosen
-- ordering and enabled/disabled state carry over.
UPDATE "UniversityHomepageSection" SET "sectionKey" = 'tour' WHERE "sectionKey" = 'societies';

-- AlterEnum
BEGIN;
CREATE TYPE "SubmissionKind_new" AS ENUM ('EVENT', 'TIP', 'BUSINESS', 'SRC_CORRECTION', 'LISTING_UPDATE', 'OTHER');
ALTER TABLE "Submission" ALTER COLUMN "kind" TYPE "SubmissionKind_new" USING ("kind"::text::"SubmissionKind_new");
ALTER TYPE "SubmissionKind" RENAME TO "SubmissionKind_old";
ALTER TYPE "SubmissionKind_new" RENAME TO "SubmissionKind";
DROP TYPE "public"."SubmissionKind_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaxonomyKind_new" AS ENUM ('EVENT', 'TIP', 'BUSINESS', 'SRC_PORTFOLIO');
ALTER TABLE "TaxonomyTerm" ALTER COLUMN "kind" TYPE "TaxonomyKind_new" USING ("kind"::text::"TaxonomyKind_new");
ALTER TYPE "TaxonomyKind" RENAME TO "TaxonomyKind_old";
ALTER TYPE "TaxonomyKind_new" RENAME TO "TaxonomyKind";
DROP TYPE "public"."TaxonomyKind_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Society" DROP CONSTRAINT "Society_campusId_fkey";

-- DropForeignKey
ALTER TABLE "Society" DROP CONSTRAINT "Society_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Society" DROP CONSTRAINT "Society_universityId_fkey";

-- AlterTable
ALTER TABLE "CampusBusiness" ADD COLUMN     "mapEmbedUrl" TEXT,
ADD COLUMN     "showOnMap" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "Society";

-- CreateTable
CREATE TABLE "CampusTourStop" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "practicalNote" TEXT,
    "photoUrl" TEXT,
    "mapEmbedUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "placeQuery" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "evidenceLevel" "EvidenceLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "sourceNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampusTourStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampusTourStop_universityId_status_displayOrder_idx" ON "CampusTourStop"("universityId", "status", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CampusTourStop_universityId_slug_key" ON "CampusTourStop"("universityId", "slug");

-- AddForeignKey
ALTER TABLE "CampusTourStop" ADD CONSTRAINT "CampusTourStop_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusTourStop" ADD CONSTRAINT "CampusTourStop_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

