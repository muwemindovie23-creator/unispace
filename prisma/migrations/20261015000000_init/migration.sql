-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('COMING_SOON', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ThemeVariant" AS ENUM ('PUBLISHED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('PLATFORM', 'UNIVERSITY', 'CAMPUS');

-- CreateEnum
CREATE TYPE "AdminAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "TaxonomyKind" AS ENUM ('EVENT', 'SOCIETY', 'TIP', 'BUSINESS', 'SRC_PORTFOLIO');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'NEEDS_REVIEW', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('EVENT', 'SOCIETY', 'TIP', 'BUSINESS', 'SRC_CORRECTION', 'LISTING_UPDATE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('RECEIVED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CONTACTED', 'APPROVED', 'DECLINED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('GENERAL', 'UNIVERSITY_INFO_CORRECTION', 'SRC_INFO_CORRECTION', 'EVENT_CORRECTION', 'BUSINESS_LISTING', 'PRIVACY_REQUEST', 'ADVERTISING', 'INTELLECTUAL_PROPERTY', 'ABUSE_REPORT');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PollResultsVisibility" AS ENUM ('BEFORE_VOTE', 'AFTER_VOTE', 'AFTER_CLOSE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "LegalDocumentKind" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_USE', 'MODERATION_POLICY', 'BUSINESS_VERIFICATION_POLICY', 'ADVERTISING_POLICY');

-- CreateEnum
CREATE TYPE "EvidenceLevel" AS ENUM ('UNVERIFIED', 'STUDENT_REPORTED', 'STAFF_CHECKED', 'OFFICIAL_SOURCE');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "officialWebsite" TEXT,
    "officialWebsiteVerifiedAt" TIMESTAMP(3),
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Malawi',
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'COMING_SOON',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "description" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'COMING_SOON',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityTheme" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "variant" "ThemeVariant" NOT NULL DEFAULT 'PUBLISHED',
    "primaryColor" TEXT NOT NULL DEFAULT '#1d4ed8',
    "primaryContrast" TEXT NOT NULL DEFAULT '#ffffff',
    "secondaryColor" TEXT NOT NULL DEFAULT '#334155',
    "secondaryContrast" TEXT NOT NULL DEFAULT '#ffffff',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "accentContrast" TEXT NOT NULL DEFAULT '#1f2937',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "surfaceColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "surfaceMutedColor" TEXT NOT NULL DEFAULT '#f1f5f9',
    "textPrimaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "textSecondaryColor" TEXT NOT NULL DEFAULT '#475569',
    "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
    "highlightColor" TEXT NOT NULL DEFAULT '#dbeafe',
    "radius" TEXT NOT NULL DEFAULT '1rem',
    "decorativePatternUrl" TEXT,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityOfficialLink" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityOfficialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityHomepageSection" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityHomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyTerm" (
    "id" TEXT NOT NULL,
    "kind" "TaxonomyKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "colorHint" TEXT,
    "universityId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "status" "AdminAccountStatus" NOT NULL DEFAULT 'INVITED',
    "lastLoginAt" TIMESTAMP(3),
    "sessionEpoch" INTEGER NOT NULL DEFAULT 0,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedScopes" "ScopeType"[],
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAssignment" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" "ScopeType" NOT NULL,
    "universityId" TEXT,
    "campusId" TEXT,
    "grantedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL DEFAULT 0,
    "csrfSecret" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHint" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvite" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "venue" TEXT,
    "posterUrl" TEXT,
    "organizer" TEXT,
    "organizerLink" TEXT,
    "registrationUrl" TEXT,
    "recurrenceNote" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "evidenceLevel" "EvidenceLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "sourceNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SrcCouncil" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "termStart" TIMESTAMP(3),
    "termEnd" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrcCouncil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SrcPosition" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsibilities" TEXT,
    "portfolioId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrcPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SrcRepresentative" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "councilId" TEXT,
    "positionId" TEXT,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "biography" TEXT,
    "responsibilities" TEXT,
    "officialEmail" TEXT,
    "officialLink" TEXT,
    "contactPublicationAuthorised" BOOLEAN NOT NULL DEFAULT false,
    "termStart" TIMESTAMP(3),
    "termEnd" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "evidenceLevel" "EvidenceLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "sourceNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrcRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Society" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "activities" TEXT,
    "joiningInstructions" TEXT,
    "meetingInfo" TEXT,
    "publicEmail" TEXT,
    "publicPhone" TEXT,
    "socialLinks" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "evidenceLevel" "EvidenceLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "sourceNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusTip" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "evidenceLevel" "EvidenceLevel" NOT NULL DEFAULT 'STUDENT_REPORTED',
    "sourceUrl" TEXT,
    "sourceNote" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "reviewDueAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampusTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "universityId" TEXT,
    "campusId" TEXT,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "maxSelections" INTEGER,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "resultsVisibility" "PollResultsVisibility" NOT NULL DEFAULT 'AFTER_VOTE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "firstVoteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "ballotHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusBusiness" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "categoryId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationNote" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "socialLinks" JSONB,
    "openingHours" JSONB,
    "priceRange" TEXT,
    "services" TEXT,
    "photos" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationExpiresAt" TIMESTAMP(3),
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT,

    CONSTRAINT "CampusBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessApplication" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "businessName" TEXT NOT NULL,
    "categoryHint" TEXT,
    "description" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "locationNote" TEXT,
    "website" TEXT,
    "socialLinks" JSONB,
    "evidenceNote" TEXT,
    "evidenceUrls" JSONB,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessVerification" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "applicationId" TEXT,
    "fromStatus" "VerificationStatus",
    "toStatus" "VerificationStatus" NOT NULL,
    "checksPerformed" TEXT,
    "note" TEXT,
    "evidenceUrls" JSONB,
    "reviewerId" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BusinessVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisingPlacement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "universityId" TEXT,
    "campusId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisingPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisingEnquiry" (
    "id" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "objective" TEXT NOT NULL,
    "universityId" TEXT,
    "campusHint" TEXT,
    "placementId" TEXT,
    "preferredStart" TIMESTAMP(3),
    "preferredEnd" TIMESTAMP(3),
    "budgetRange" TEXT,
    "notes" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNote" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisingEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "kind" "SubmissionKind" NOT NULL,
    "universityId" TEXT,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "contactEmail" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "reporterEmail" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "reviewerId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "category" "ContactCategory" NOT NULL DEFAULT 'GENERAL',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "universityId" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNote" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "kind" "LegalDocumentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedVersionId" TEXT,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summaryOfChanges" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isMaterialChange" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "universityId" TEXT,
    "campusId" TEXT,
    "metadata" JSONB,
    "ipHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitCounter" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "windowKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE INDEX "University_isPublished_displayOrder_idx" ON "University"("isPublished", "displayOrder");

-- CreateIndex
CREATE INDEX "Campus_universityId_isPublished_idx" ON "Campus"("universityId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_universityId_slug_key" ON "Campus"("universityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityTheme_universityId_variant_key" ON "UniversityTheme"("universityId", "variant");

-- CreateIndex
CREATE INDEX "UniversityOfficialLink_universityId_displayOrder_idx" ON "UniversityOfficialLink"("universityId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityHomepageSection_universityId_campusId_sectionKey_key" ON "UniversityHomepageSection"("universityId", "campusId", "sectionKey");

-- CreateIndex
CREATE INDEX "TaxonomyTerm_kind_isActive_displayOrder_idx" ON "TaxonomyTerm"("kind", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyTerm_kind_universityId_slug_key" ON "TaxonomyTerm"("kind", "universityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_status_idx" ON "AdminUser"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_key_key" ON "AdminRole"("key");

-- CreateIndex
CREATE INDEX "AdminAssignment_adminUserId_revokedAt_idx" ON "AdminAssignment"("adminUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "AdminAssignment_universityId_idx" ON "AdminAssignment"("universityId");

-- CreateIndex
CREATE INDEX "AdminAssignment_campusId_idx" ON "AdminAssignment"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAssignment_adminUserId_roleId_scopeType_universityId_c_key" ON "AdminAssignment"("adminUserId", "roleId", "scopeType", "universityId", "campusId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminUserId_idx" ON "AdminSession"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvite_tokenHash_key" ON "AdminInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminInvite_adminUserId_idx" ON "AdminInvite"("adminUserId");

-- CreateIndex
CREATE INDEX "Event_universityId_status_startsAt_idx" ON "Event"("universityId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Event_campusId_status_startsAt_idx" ON "Event"("campusId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_universityId_slug_key" ON "Event"("universityId", "slug");

-- CreateIndex
CREATE INDEX "SrcCouncil_universityId_isCurrent_idx" ON "SrcCouncil"("universityId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "SrcPosition_universityId_title_key" ON "SrcPosition"("universityId", "title");

-- CreateIndex
CREATE INDEX "SrcRepresentative_universityId_status_isCurrent_idx" ON "SrcRepresentative"("universityId", "status", "isCurrent");

-- CreateIndex
CREATE INDEX "Society_universityId_status_idx" ON "Society"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Society_universityId_slug_key" ON "Society"("universityId", "slug");

-- CreateIndex
CREATE INDEX "CampusTip_universityId_status_idx" ON "CampusTip"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampusTip_universityId_slug_key" ON "CampusTip"("universityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_slug_key" ON "Poll"("slug");

-- CreateIndex
CREATE INDEX "Poll_status_isFeatured_idx" ON "Poll"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "Poll_universityId_status_idx" ON "Poll"("universityId", "status");

-- CreateIndex
CREATE INDEX "PollOption_pollId_displayOrder_idx" ON "PollOption"("pollId", "displayOrder");

-- CreateIndex
CREATE INDEX "PollVote_pollId_idx" ON "PollVote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollId_ballotHash_optionId_key" ON "PollVote"("pollId", "ballotHash", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "CampusBusiness_applicationId_key" ON "CampusBusiness"("applicationId");

-- CreateIndex
CREATE INDEX "CampusBusiness_universityId_status_verificationStatus_idx" ON "CampusBusiness"("universityId", "status", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CampusBusiness_universityId_slug_key" ON "CampusBusiness"("universityId", "slug");

-- CreateIndex
CREATE INDEX "BusinessApplication_universityId_status_idx" ON "BusinessApplication"("universityId", "status");

-- CreateIndex
CREATE INDEX "BusinessVerification_businessId_decidedAt_idx" ON "BusinessVerification"("businessId", "decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisingPlacement_key_key" ON "AdvertisingPlacement"("key");

-- CreateIndex
CREATE INDEX "AdvertisingEnquiry_status_createdAt_idx" ON "AdvertisingEnquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_universityId_status_idx" ON "Submission"("universityId", "status");

-- CreateIndex
CREATE INDEX "ModerationReport_status_createdAt_idx" ON "ModerationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_targetType_targetId_idx" ON "ModerationReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_createdAt_idx" ON "ContactEnquiry"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_kind_key" ON "LegalDocument"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_slug_key" ON "LegalDocument"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_publishedVersionId_key" ON "LegalDocument"("publishedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentId_version_key" ON "LegalDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "RateLimitCounter_expiresAt_idx" ON "RateLimitCounter"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitCounter_bucket_windowKey_key" ON "RateLimitCounter"("bucket", "windowKey");

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityTheme" ADD CONSTRAINT "UniversityTheme_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityOfficialLink" ADD CONSTRAINT "UniversityOfficialLink_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityOfficialLink" ADD CONSTRAINT "UniversityOfficialLink_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityHomepageSection" ADD CONSTRAINT "UniversityHomepageSection_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityHomepageSection" ADD CONSTRAINT "UniversityHomepageSection_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxonomyTerm" ADD CONSTRAINT "TaxonomyTerm_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAssignment" ADD CONSTRAINT "AdminAssignment_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAssignment" ADD CONSTRAINT "AdminAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AdminRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAssignment" ADD CONSTRAINT "AdminAssignment_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAssignment" ADD CONSTRAINT "AdminAssignment_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAssignment" ADD CONSTRAINT "AdminAssignment_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvite" ADD CONSTRAINT "AdminInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcCouncil" ADD CONSTRAINT "SrcCouncil_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcCouncil" ADD CONSTRAINT "SrcCouncil_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcPosition" ADD CONSTRAINT "SrcPosition_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcPosition" ADD CONSTRAINT "SrcPosition_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcRepresentative" ADD CONSTRAINT "SrcRepresentative_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcRepresentative" ADD CONSTRAINT "SrcRepresentative_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcRepresentative" ADD CONSTRAINT "SrcRepresentative_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "SrcCouncil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SrcRepresentative" ADD CONSTRAINT "SrcRepresentative_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SrcPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusTip" ADD CONSTRAINT "CampusTip_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusTip" ADD CONSTRAINT "CampusTip_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusTip" ADD CONSTRAINT "CampusTip_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusBusiness" ADD CONSTRAINT "CampusBusiness_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusBusiness" ADD CONSTRAINT "CampusBusiness_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusBusiness" ADD CONSTRAINT "CampusBusiness_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaxonomyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusBusiness" ADD CONSTRAINT "CampusBusiness_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessVerification" ADD CONSTRAINT "BusinessVerification_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "CampusBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessVerification" ADD CONSTRAINT "BusinessVerification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BusinessApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessVerification" ADD CONSTRAINT "BusinessVerification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingPlacement" ADD CONSTRAINT "AdvertisingPlacement_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingPlacement" ADD CONSTRAINT "AdvertisingPlacement_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingEnquiry" ADD CONSTRAINT "AdvertisingEnquiry_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisingEnquiry" ADD CONSTRAINT "AdvertisingEnquiry_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "AdvertisingPlacement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEnquiry" ADD CONSTRAINT "ContactEnquiry_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "LegalDocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocumentVersion" ADD CONSTRAINT "LegalDocumentVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

