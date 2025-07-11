-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('JUST_ME', 'TWO_TO_TEN', 'ELEVEN_TO_FIFTY', 'FIFTY_ONE_TO_TWO_HUNDRED', 'TWO_HUNDRED_PLUS', 'THOUSAND_PLUS');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET', 'SLACK', 'DISCORD', 'JIRA', 'LINEAR');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('CODEBASE', 'PULL_REQUEST', 'BRANCH', 'COMMIT');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('BUG', 'SECURITY', 'PERFORMANCE', 'CODE_QUALITY', 'SUGGESTION', 'VULNERABILITY', 'CODE_SMELL', 'ACCESSIBILITY', 'BEST_PRACTICE');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('REPOSITORY_CONNECTED', 'ANALYSIS_COMPLETED', 'ISSUE_FOUND', 'ISSUE_RESOLVED', 'MEMBER_INVITED', 'INTEGRATION_ADDED', 'ORGANIZATION_CREATED');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('REFERRAL_BONUS', 'REFERRED_BONUS', 'PROMOTIONAL', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO', 'TRIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "isTrialActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "companySize" "CompanySize",
    "industry" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "slackNotifications" BOOLEAN NOT NULL DEFAULT false,
    "discordNotifications" BOOLEAN NOT NULL DEFAULT false,
    "autoAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "analysisFrequency" TEXT NOT NULL DEFAULT 'daily',
    "analysisSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "url" TEXT NOT NULL,
    "cloneUrl" TEXT,
    "sshUrl" TEXT,
    "starCount" INTEGER DEFAULT 0,
    "forkCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubInstallationId" TEXT,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'READ',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_analyses" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "commitSha" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "results" JSONB,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "code_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "type" "AnalysisType" NOT NULL DEFAULT 'CODEBASE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prNumber" INTEGER,
    "branch" TEXT,
    "commit" TEXT,
    "options" JSONB NOT NULL,
    "fileIndexingJobId" TEXT,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" "IssueType" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "code" TEXT,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_indexing_jobs" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "file_indexing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_installations" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "events" JSONB NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_stats" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "languages" JSONB,
    "lastCommit" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "type" "IssueType" NOT NULL DEFAULT 'BUG',
    "filePath" TEXT,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "repositoryId" TEXT NOT NULL,
    "codeAnalysisId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_userId_organizationId_key" ON "organization_members"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON "organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_fullName_key" ON "repositories"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_githubId_key" ON "repositories"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_access_userId_repositoryId_key" ON "repository_access"("userId", "repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "github_installations_installationId_key" ON "github_installations"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_stats_repositoryId_key" ON "repository_stats"("repositoryId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_access" ADD CONSTRAINT "repository_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_access" ADD CONSTRAINT "repository_access_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_analyses" ADD CONSTRAINT "code_analyses_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_fileIndexingJobId_fkey" FOREIGN KEY ("fileIndexingJobId") REFERENCES "file_indexing_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_indexing_jobs" ADD CONSTRAINT "file_indexing_jobs_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_stats" ADD CONSTRAINT "repository_stats_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_codeAnalysisId_fkey" FOREIGN KEY ("codeAnalysisId") REFERENCES "code_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
