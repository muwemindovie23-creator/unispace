-- Postgres treats NULLs as distinct in a unique index, so a compound unique key
-- containing a nullable column does NOT prevent duplicates when that column is
-- NULL. Three of our keys use NULL to mean "wider scope":
--
--   TaxonomyTerm.universityId        NULL = platform-wide category
--   UniversityHomepageSection.campusId NULL = university-wide section
--   AdminAssignment.universityId/campusId NULL = wider administrative scope
--
-- The partial unique indexes below close that gap. They are written by hand
-- because Prisma's schema language cannot express a partial index.

-- A platform-wide category is unique per (kind, slug).
CREATE UNIQUE INDEX "TaxonomyTerm_platform_wide_key"
  ON "TaxonomyTerm" ("kind", "slug")
  WHERE "universityId" IS NULL;

-- A university-wide homepage section is unique per (universityId, sectionKey).
CREATE UNIQUE INDEX "UniversityHomepageSection_university_wide_key"
  ON "UniversityHomepageSection" ("universityId", "sectionKey")
  WHERE "campusId" IS NULL;

-- One platform-scoped assignment per administrator per role.
CREATE UNIQUE INDEX "AdminAssignment_platform_scope_key"
  ON "AdminAssignment" ("adminUserId", "roleId")
  WHERE "universityId" IS NULL AND "campusId" IS NULL;

-- One university-scoped assignment per administrator per role per university.
CREATE UNIQUE INDEX "AdminAssignment_university_scope_key"
  ON "AdminAssignment" ("adminUserId", "roleId", "universityId")
  WHERE "universityId" IS NOT NULL AND "campusId" IS NULL;
