-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('LEARNING', 'BUSINESS', 'GENERAL');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('AI_CONSULTATION', 'PENDING_REVIEW', 'HUMAN_HANDOFF', 'HUMAN_ASSIGNED', 'REVISION_REQUIRED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsultationMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'ADMIN', 'TOOL');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('UPLOADED', 'INDEXING', 'INDEXED', 'FAILED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "KnowledgeVisibility" AS ENUM ('PUBLIC', 'CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusinessRequestStatus" AS ENUM ('NEW', 'NEEDS_DISCOVERY', 'IN_REVIEW', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT', 'CONVERTED_TO_PROJECT', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BusinessRequestSource" AS ENUM ('WEBSITE_FORM', 'AI_HANDOFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusinessProposalStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "BusinessProposalRevisionStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "BusinessProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'REVIEW', 'ACCEPTED', 'CHANGES_REQUESTED', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectDeliverableType" AS ENUM ('FILE', 'LINK', 'DESCRIPTION');

-- CreateEnum
CREATE TYPE "ProjectDeliverableReviewStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectProgressVisibility" AS ENUM ('CUSTOMER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ProjectPaymentTermStatus" AS ENUM ('PLANNED', 'INVOICE_REQUESTED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('DIGITAL_PRODUCT', 'SELF_PACED_COURSE', 'PRIVATE_TUTORING', 'BUSINESS_SERVICE');

-- CreateEnum
CREATE TYPE "CatalogItemStatus" AS ENUM ('DRAFT', 'COMING_SOON', 'AVAILABLE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'STARTING_AT', 'CONSULTATION_BASED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "OrderSourceType" AS ENUM ('CATALOG', 'TUTORING_QUOTE', 'BUSINESS_PROPOSAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('CUSTOMER', 'STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "LearningCourseStatus" AS ENUM ('DRAFT', 'COMING_SOON', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseEnrollmentMode" AS ENUM ('PAID', 'INVITE_ONLY', 'OPEN');

-- CreateEnum
CREATE TYPE "LearningEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LessonContentType" AS ENUM ('TEXT', 'VIDEO', 'IMAGE', 'FILE', 'CODE', 'EMBED', 'LINK', 'PRACTICE');

-- CreateEnum
CREATE TYPE "AssessmentStage" AS ENUM ('PRETEST', 'POSTTEST', 'CHAPTER_EXAM', 'FINAL_EXAM');

-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING', 'ORDERING');

-- CreateEnum
CREATE TYPE "AssessmentAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'PENDING_REVIEW', 'GRADED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LearningGameType" AS ENUM ('CROSSWORD', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'MATCHING_PAIRS', 'WORD_SCRAMBLE', 'FILL_IN_THE_BLANK', 'FLASHCARDS', 'ORDERING', 'TIMED_CHALLENGE');

-- CreateEnum
CREATE TYPE "LearningGameAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('SUBMITTED', 'LATE', 'UNDER_REVIEW', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'ISSUED', 'REVOKED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('TRANSACTIONAL', 'LEARNING', 'TUTORING', 'BUSINESS', 'CONSULTATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "StoredFileVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "StoredFileStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateTable
CREATE TABLE "consultation_conversations" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "guestSessionId" TEXT,
    "mode" "ConsultationMode" NOT NULL DEFAULT 'GENERAL',
    "status" "ConsultationStatus" NOT NULL DEFAULT 'AI_CONSULTATION',
    "assignedUserId" UUID,
    "handoffReason" TEXT,
    "consentAt" TIMESTAMP(3),
    "consentScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "ConsultationMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "sourceRefs" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_leads" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "mode" "ConsultationMode" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_summaries" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "consultation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "visibility" "KnowledgeVisibility" NOT NULL DEFAULT 'STAFF',
    "allowed_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "uploadedBy" UUID,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "embedding" vector,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_service_definitions" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" VARCHAR(320) NOT NULL,
    "longDescription" TEXT NOT NULL,
    "customerProblems" TEXT[],
    "targetUsers" TEXT[],
    "possibleDeliverables" TEXT[],
    "sampleScope" TEXT[],
    "customerPreparation" TEXT[],
    "pricingFactors" TEXT[],
    "durationFactors" TEXT[],
    "ctaLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_service_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_service_requests" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "serviceDefinitionId" TEXT,
    "serviceSlug" TEXT,
    "serviceTitleSnapshot" TEXT,
    "status" "BusinessRequestStatus" NOT NULL DEFAULT 'NEW',
    "source" "BusinessRequestSource" NOT NULL DEFAULT 'WEBSITE_FORM',
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactConsentAt" TIMESTAMP(3) NOT NULL,
    "businessName" TEXT,
    "businessType" TEXT,
    "organizationSize" TEXT,
    "currentProcess" TEXT,
    "mainProblem" TEXT NOT NULL,
    "workVolume" TEXT,
    "currentTools" TEXT[],
    "desiredOutcome" TEXT NOT NULL,
    "integrationNeeds" TEXT[],
    "budgetMin" DECIMAL(14,2),
    "budgetMax" DECIMAL(14,2),
    "budgetNote" TEXT,
    "targetDate" TIMESTAMP(3),
    "attachments" JSONB,
    "consultationLeadId" TEXT,
    "assignedToUserId" UUID,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_proposals" (
    "id" TEXT NOT NULL,
    "proposalCode" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" "BusinessProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_proposal_revisions" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BusinessProposalRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "scopeIn" TEXT[],
    "scopeOut" TEXT[],
    "deliverables" TEXT[],
    "timelineSummary" TEXT NOT NULL,
    "estimatedDurationDays" INTEGER NOT NULL,
    "plannedStartAt" TIMESTAMP(3),
    "targetCompletionAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "milestonePlan" JSONB NOT NULL,
    "paymentTerms" JSONB NOT NULL,
    "assumptions" TEXT[],
    "customerDependencies" TEXT[],
    "acceptanceCriteria" TEXT[],
    "exclusions" TEXT[],
    "validUntil" TIMESTAMP(3) NOT NULL,
    "approvedByUserId" UUID,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "customerDecisionAt" TIMESTAMP(3),
    "customerFeedback" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_proposal_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_projects" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalRevisionId" TEXT NOT NULL,
    "customerUserId" UUID,
    "assignedToUserId" UUID,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "BusinessProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "scopeSnapshot" JSONB NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "plannedStartAt" TIMESTAMP(3),
    "targetCompletionAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "handoverSummary" TEXT,
    "handoverConfirmedAt" TIMESTAMP(3),
    "handoverConfirmedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "ProjectMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "acceptanceCriteria" TEXT[],
    "completedAt" TIMESTAMP(3),
    "customerFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_deliverables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ProjectDeliverableType" NOT NULL,
    "fileName" TEXT,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedByUserId" UUID NOT NULL,
    "reviewStatus" "ProjectDeliverableReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewerUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_payment_terms" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "dueAt" TIMESTAMP(3),
    "paymentReferenceId" TEXT,
    "status" "ProjectPaymentTermStatus" NOT NULL DEFAULT 'PLANNED',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_progress_updates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "visibility" "ProjectProgressVisibility" NOT NULL DEFAULT 'CUSTOMER',
    "message" TEXT NOT NULL,
    "progress" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_progress_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "status" "CatalogItemStatus" NOT NULL DEFAULT 'COMING_SOON',
    "priceType" "PriceType" NOT NULL DEFAULT 'FIXED',
    "basePrice" DECIMAL(12,2),
    "discountPrice" DECIMAL(12,2),
    "priceLabel" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "level" TEXT,
    "method" TEXT,
    "duration" TEXT,
    "targetAudience" TEXT[],
    "learningOutcomes" TEXT[],
    "prerequisites" TEXT[],
    "features" TEXT[],
    "curriculumSummary" JSONB,
    "faqs" JSONB,
    "ctaType" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "ctaLink" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_assets" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT,
    "sourceType" "OrderSourceType" NOT NULL DEFAULT 'CATALOG',
    "sourceReferenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "sku" TEXT,
    "itemType" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commerce_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerTransactionId" TEXT,
    "paymentMethod" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "checkoutUrl" TEXT,
    "rawResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_payment_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "orderId" TEXT,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processingNotes" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commerce_payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "refundNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "providerRefundId" TEXT,
    "approvedByUserId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commerce_digital_entitlements" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "assetDownloadUrl" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_digital_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "refresh_token_expires_in" INTEGER,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "userId" UUID
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_attempts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "userAgent" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role" "RoleType" NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "instructor_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "specializations" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "educationLevel" TEXT,
    "learningGoals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "recipientName" TEXT,
    "phone" TEXT,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "postalCode" TEXT,
    "fullAddress" TEXT NOT NULL,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "serviceUseConsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_courses" (
    "id" UUID NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT NOT NULL,
    "status" "LearningCourseStatus" NOT NULL DEFAULT 'DRAFT',
    "enrollmentMode" "CourseEnrollmentMode" NOT NULL DEFAULT 'PAID',
    "language" TEXT NOT NULL DEFAULT 'id',
    "level" TEXT,
    "estimatedDurationMinutes" INTEGER,
    "accessDurationDays" INTEGER,
    "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "certificatePolicy" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_course_chapters" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "gatePolicy" JSONB,
    "estimatedDurationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_course_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_lessons" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedDurationMinutes" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_lesson_content_blocks" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "type" "LessonContentType" NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "resourceUrl" TEXT,
    "storageKey" TEXT,
    "codeLanguage" TEXT,
    "metadata" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_lesson_content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_enrollments" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" TEXT,
    "status" "LearningEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessExpiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_lesson_progress" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assessments" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "chapterId" UUID,
    "lessonId" UUID,
    "stage" "AssessmentStage" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "passingScore" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER,
    "timeLimitSeconds" INTEGER,
    "retryCooldownSeconds" INTEGER NOT NULL DEFAULT 0,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showExplanation" BOOLEAN NOT NULL DEFAULT true,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assessment_questions" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "type" "AssessmentQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "points" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "correctAnswer" JSONB,
    "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assessment_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "optionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assessment_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assessment_attempts" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "AssessmentAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "score" DECIMAL(8,2),
    "maxScore" DECIMAL(8,2),
    "passed" BOOLEAN,
    "pendingReview" BOOLEAN NOT NULL DEFAULT false,
    "answerSnapshot" JSONB,
    "questionOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionOrder" JSONB,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assessment_answers" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answer" JSONB,
    "isCorrect" BOOLEAN,
    "pointsEarned" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "graderFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_games" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "chapterId" UUID,
    "lessonId" UUID,
    "type" "LearningGameType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "introduction" TEXT,
    "instructions" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "scoringPolicy" JSONB,
    "feedback" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_game_attempts" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "LearningGameAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "answers" JSONB,
    "stateSnapshot" JSONB,
    "score" DECIMAL(8,2),
    "maxScore" DECIMAL(8,2),
    "passed" BOOLEAN,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_game_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assignments" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "chapterId" UUID,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "maxScore" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "dueAfterDays" INTEGER,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_assignment_submissions" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "submittedByUserId" UUID NOT NULL,
    "status" "AssignmentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "responseText" TEXT,
    "attachments" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" UUID,
    "score" DECIMAL(8,2),
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_certificates" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "participantNameSnapshot" TEXT NOT NULL,
    "courseTitleSnapshot" TEXT NOT NULL,
    "issuerNameSnapshot" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "pdfStorageKey" TEXT,
    "verificationUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_content_progress" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "contentBlockId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_content_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "eventName" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "correlationId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "ownerId" UUID,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "visibility" "StoredFileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "StoredFileStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "consultation_conversations_userId_updatedAt_idx" ON "consultation_conversations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "consultation_conversations_guestSessionId_updatedAt_idx" ON "consultation_conversations"("guestSessionId", "updatedAt");

-- CreateIndex
CREATE INDEX "consultation_conversations_status_updatedAt_idx" ON "consultation_conversations"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "consultation_messages_conversationId_createdAt_idx" ON "consultation_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_leads_conversationId_key" ON "consultation_leads"("conversationId");

-- CreateIndex
CREATE INDEX "consultation_leads_userId_createdAt_idx" ON "consultation_leads"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "consultation_leads_mode_createdAt_idx" ON "consultation_leads"("mode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_summaries_conversationId_key" ON "consultation_summaries"("conversationId");

-- CreateIndex
CREATE INDEX "knowledge_documents_status_visibility_idx" ON "knowledge_documents"("status", "visibility");

-- CreateIndex
CREATE INDEX "knowledge_documents_uploadedBy_createdAt_idx" ON "knowledge_documents"("uploadedBy", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_chunks_document_id_chunk_index_idx" ON "knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_document_id_chunk_index_key" ON "knowledge_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "business_service_definitions_catalogItemId_key" ON "business_service_definitions"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "business_service_definitions_slug_key" ON "business_service_definitions"("slug");

-- CreateIndex
CREATE INDEX "business_service_definitions_isActive_idx" ON "business_service_definitions"("isActive");

-- CreateIndex
CREATE INDEX "business_service_requests_userId_createdAt_idx" ON "business_service_requests"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "business_service_requests_status_createdAt_idx" ON "business_service_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "business_service_requests_assignedToUserId_status_idx" ON "business_service_requests"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "business_service_requests_serviceSlug_idx" ON "business_service_requests"("serviceSlug");

-- CreateIndex
CREATE INDEX "business_service_requests_consultationLeadId_idx" ON "business_service_requests"("consultationLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "business_proposals_proposalCode_key" ON "business_proposals"("proposalCode");

-- CreateIndex
CREATE INDEX "business_proposals_requestId_createdAt_idx" ON "business_proposals"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "business_proposals_status_updatedAt_idx" ON "business_proposals"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "business_proposal_revisions_proposalId_status_idx" ON "business_proposal_revisions"("proposalId", "status");

-- CreateIndex
CREATE INDEX "business_proposal_revisions_validUntil_idx" ON "business_proposal_revisions"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "business_proposal_revisions_proposalId_version_key" ON "business_proposal_revisions"("proposalId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "business_projects_projectCode_key" ON "business_projects"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "business_projects_proposalId_key" ON "business_projects"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "business_projects_proposalRevisionId_key" ON "business_projects"("proposalRevisionId");

-- CreateIndex
CREATE INDEX "business_projects_customerUserId_status_idx" ON "business_projects"("customerUserId", "status");

-- CreateIndex
CREATE INDEX "business_projects_assignedToUserId_status_idx" ON "business_projects"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "business_projects_status_updatedAt_idx" ON "business_projects"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "project_milestones_projectId_status_idx" ON "project_milestones"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_milestones_projectId_sequence_key" ON "project_milestones"("projectId", "sequence");

-- CreateIndex
CREATE INDEX "project_deliverables_projectId_createdAt_idx" ON "project_deliverables"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_deliverables_milestoneId_idx" ON "project_deliverables"("milestoneId");

-- CreateIndex
CREATE INDEX "project_deliverables_reviewStatus_idx" ON "project_deliverables"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "project_payment_terms_paymentReferenceId_key" ON "project_payment_terms"("paymentReferenceId");

-- CreateIndex
CREATE INDEX "project_payment_terms_projectId_status_idx" ON "project_payment_terms"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_payment_terms_projectId_sequence_key" ON "project_payment_terms"("projectId", "sequence");

-- CreateIndex
CREATE INDEX "project_progress_updates_projectId_visibility_createdAt_idx" ON "project_progress_updates"("projectId", "visibility", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_categories_slug_key" ON "catalog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_slug_key" ON "catalog_items"("slug");

-- CreateIndex
CREATE INDEX "catalog_items_type_idx" ON "catalog_items"("type");

-- CreateIndex
CREATE INDEX "catalog_items_status_idx" ON "catalog_items"("status");

-- CreateIndex
CREATE INDEX "catalog_items_field_idx" ON "catalog_items"("field");

-- CreateIndex
CREATE INDEX "catalog_items_isFeatured_idx" ON "catalog_items"("isFeatured");

-- CreateIndex
CREATE INDEX "catalog_assets_itemId_idx" ON "catalog_assets"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_carts_sessionId_key" ON "commerce_carts"("sessionId");

-- CreateIndex
CREATE INDEX "commerce_carts_userId_idx" ON "commerce_carts"("userId");

-- CreateIndex
CREATE INDEX "commerce_cart_items_cartId_idx" ON "commerce_cart_items"("cartId");

-- CreateIndex
CREATE INDEX "commerce_cart_items_catalogItemId_idx" ON "commerce_cart_items"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_cart_items_cartId_catalogItemId_key" ON "commerce_cart_items"("cartId", "catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_orders_orderNumber_key" ON "commerce_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_orders_idempotencyKey_key" ON "commerce_orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "commerce_orders_userId_idx" ON "commerce_orders"("userId");

-- CreateIndex
CREATE INDEX "commerce_orders_status_idx" ON "commerce_orders"("status");

-- CreateIndex
CREATE INDEX "commerce_orders_customerEmail_idx" ON "commerce_orders"("customerEmail");

-- CreateIndex
CREATE INDEX "commerce_orders_sourceReferenceId_idx" ON "commerce_orders"("sourceReferenceId");

-- CreateIndex
CREATE INDEX "commerce_order_items_orderId_idx" ON "commerce_order_items"("orderId");

-- CreateIndex
CREATE INDEX "commerce_order_items_catalogItemId_idx" ON "commerce_order_items"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payments_paymentNumber_key" ON "commerce_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "commerce_payments_orderId_idx" ON "commerce_payments"("orderId");

-- CreateIndex
CREATE INDEX "commerce_payments_provider_providerTransactionId_idx" ON "commerce_payments"("provider", "providerTransactionId");

-- CreateIndex
CREATE INDEX "commerce_payments_status_idx" ON "commerce_payments"("status");

-- CreateIndex
CREATE INDEX "commerce_payment_events_paymentId_idx" ON "commerce_payment_events"("paymentId");

-- CreateIndex
CREATE INDEX "commerce_payment_events_orderId_idx" ON "commerce_payment_events"("orderId");

-- CreateIndex
CREATE INDEX "commerce_payment_events_eventType_idx" ON "commerce_payment_events"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payment_events_provider_providerEventId_key" ON "commerce_payment_events"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_refunds_refundNumber_key" ON "commerce_refunds"("refundNumber");

-- CreateIndex
CREATE INDEX "commerce_refunds_orderId_idx" ON "commerce_refunds"("orderId");

-- CreateIndex
CREATE INDEX "commerce_refunds_paymentId_idx" ON "commerce_refunds"("paymentId");

-- CreateIndex
CREATE INDEX "commerce_digital_entitlements_userId_idx" ON "commerce_digital_entitlements"("userId");

-- CreateIndex
CREATE INDEX "commerce_digital_entitlements_orderId_idx" ON "commerce_digital_entitlements"("orderId");

-- CreateIndex
CREATE INDEX "commerce_digital_entitlements_catalogItemId_idx" ON "commerce_digital_entitlements"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_digital_entitlements_userId_catalogItemId_key" ON "commerce_digital_entitlements"("userId", "catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "auth_attempts_email_createdAt_idx" ON "auth_attempts"("email", "createdAt");

-- CreateIndex
CREATE INDEX "auth_attempts_ip_createdAt_idx" ON "auth_attempts"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionKey_key" ON "role_permissions"("role", "permissionKey");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionKey_key" ON "user_permissions"("userId", "permissionKey");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_userId_key" ON "instructor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_courses_catalogItemId_key" ON "learning_courses"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_courses_slug_key" ON "learning_courses"("slug");

-- CreateIndex
CREATE INDEX "learning_courses_status_publishedAt_idx" ON "learning_courses"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "learning_courses_createdByUserId_idx" ON "learning_courses"("createdByUserId");

-- CreateIndex
CREATE INDEX "learning_course_chapters_courseId_isPublished_displayOrder_idx" ON "learning_course_chapters"("courseId", "isPublished", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_course_chapters_courseId_slug_key" ON "learning_course_chapters"("courseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_course_chapters_courseId_displayOrder_key" ON "learning_course_chapters"("courseId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_lessons_chapterId_isPublished_displayOrder_idx" ON "learning_lessons"("chapterId", "isPublished", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lessons_chapterId_slug_key" ON "learning_lessons"("chapterId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lessons_chapterId_displayOrder_key" ON "learning_lessons"("chapterId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_lesson_content_blocks_lessonId_displayOrder_idx" ON "learning_lesson_content_blocks"("lessonId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_enrollments_orderId_idx" ON "learning_enrollments"("orderId");

-- CreateIndex
CREATE INDEX "learning_enrollments_userId_status_idx" ON "learning_enrollments"("userId", "status");

-- CreateIndex
CREATE INDEX "learning_enrollments_courseId_status_idx" ON "learning_enrollments"("courseId", "status");

-- CreateIndex
CREATE INDEX "learning_enrollments_accessExpiresAt_idx" ON "learning_enrollments"("accessExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_enrollments_courseId_userId_key" ON "learning_enrollments"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_enrollments_orderId_courseId_key" ON "learning_enrollments"("orderId", "courseId");

-- CreateIndex
CREATE INDEX "learning_lesson_progress_enrollmentId_status_idx" ON "learning_lesson_progress"("enrollmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learning_lesson_progress_enrollmentId_lessonId_key" ON "learning_lesson_progress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE INDEX "learning_assessments_courseId_stage_isPublished_idx" ON "learning_assessments"("courseId", "stage", "isPublished");

-- CreateIndex
CREATE INDEX "learning_assessments_chapterId_stage_idx" ON "learning_assessments"("chapterId", "stage");

-- CreateIndex
CREATE INDEX "learning_assessments_lessonId_stage_idx" ON "learning_assessments"("lessonId", "stage");

-- CreateIndex
CREATE INDEX "learning_assessment_questions_assessmentId_displayOrder_idx" ON "learning_assessment_questions"("assessmentId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_assessment_options_questionId_displayOrder_idx" ON "learning_assessment_options"("questionId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_assessment_options_questionId_optionKey_key" ON "learning_assessment_options"("questionId", "optionKey");

-- CreateIndex
CREATE INDEX "learning_assessment_attempts_enrollmentId_assessmentId_stat_idx" ON "learning_assessment_attempts"("enrollmentId", "assessmentId", "status");

-- CreateIndex
CREATE INDEX "learning_assessment_attempts_assessmentId_submittedAt_idx" ON "learning_assessment_attempts"("assessmentId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_assessment_attempts_enrollmentId_assessmentId_atte_key" ON "learning_assessment_attempts"("enrollmentId", "assessmentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "learning_assessment_answers_questionId_idx" ON "learning_assessment_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_assessment_answers_attemptId_questionId_key" ON "learning_assessment_answers"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "learning_games_courseId_type_isPublished_idx" ON "learning_games"("courseId", "type", "isPublished");

-- CreateIndex
CREATE INDEX "learning_games_chapterId_displayOrder_idx" ON "learning_games"("chapterId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_games_lessonId_displayOrder_idx" ON "learning_games"("lessonId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "learning_games_courseId_slug_key" ON "learning_games"("courseId", "slug");

-- CreateIndex
CREATE INDEX "learning_game_attempts_enrollmentId_gameId_status_idx" ON "learning_game_attempts"("enrollmentId", "gameId", "status");

-- CreateIndex
CREATE INDEX "learning_game_attempts_gameId_completedAt_idx" ON "learning_game_attempts"("gameId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_game_attempts_enrollmentId_gameId_attemptNumber_key" ON "learning_game_attempts"("enrollmentId", "gameId", "attemptNumber");

-- CreateIndex
CREATE INDEX "learning_assignments_courseId_isPublished_idx" ON "learning_assignments"("courseId", "isPublished");

-- CreateIndex
CREATE INDEX "learning_assignments_chapterId_displayOrder_idx" ON "learning_assignments"("chapterId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_assignments_lessonId_displayOrder_idx" ON "learning_assignments"("lessonId", "displayOrder");

-- CreateIndex
CREATE INDEX "learning_assignment_submissions_assignmentId_status_idx" ON "learning_assignment_submissions"("assignmentId", "status");

-- CreateIndex
CREATE INDEX "learning_assignment_submissions_enrollmentId_submittedAt_idx" ON "learning_assignment_submissions"("enrollmentId", "submittedAt");

-- CreateIndex
CREATE INDEX "learning_assignment_submissions_reviewedByUserId_idx" ON "learning_assignment_submissions"("reviewedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_certificates_enrollmentId_key" ON "learning_certificates"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_certificates_certificateNumber_key" ON "learning_certificates"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "learning_certificates_verificationCode_key" ON "learning_certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "learning_certificates_status_issuedAt_idx" ON "learning_certificates"("status", "issuedAt");

-- CreateIndex
CREATE INDEX "learning_content_progress_enrollmentId_completedAt_idx" ON "learning_content_progress"("enrollmentId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_content_progress_enrollmentId_contentBlockId_key" ON "learning_content_progress"("enrollmentId", "contentBlockId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupeKey_key" ON "notifications"("dedupeKey");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_category_key" ON "notification_preferences"("userId", "category");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_createdAt_idx" ON "audit_logs"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");

-- CreateIndex
CREATE INDEX "stored_files_ownerId_createdAt_idx" ON "stored_files"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "stored_files_visibility_status_idx" ON "stored_files"("visibility", "status");

-- CreateIndex
CREATE INDEX "system_settings_isPublic_idx" ON "system_settings"("isPublic");

-- AddForeignKey
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "consultation_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_leads" ADD CONSTRAINT "consultation_leads_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "consultation_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_summaries" ADD CONSTRAINT "consultation_summaries_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "consultation_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_proposals" ADD CONSTRAINT "business_proposals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "business_service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_proposal_revisions" ADD CONSTRAINT "business_proposal_revisions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "business_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_projects" ADD CONSTRAINT "business_projects_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "business_service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_projects" ADD CONSTRAINT "business_projects_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "business_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_projects" ADD CONSTRAINT "business_projects_proposalRevisionId_fkey" FOREIGN KEY ("proposalRevisionId") REFERENCES "business_proposal_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "business_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "business_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deliverables" ADD CONSTRAINT "project_deliverables_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_payment_terms" ADD CONSTRAINT "project_payment_terms_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "business_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_progress_updates" ADD CONSTRAINT "project_progress_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "business_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "catalog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_assets" ADD CONSTRAINT "catalog_assets_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_cart_items" ADD CONSTRAINT "commerce_cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "commerce_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_order_items" ADD CONSTRAINT "commerce_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payments" ADD CONSTRAINT "commerce_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_payment_events" ADD CONSTRAINT "commerce_payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "commerce_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_refunds" ADD CONSTRAINT "commerce_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_refunds" ADD CONSTRAINT "commerce_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "commerce_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commerce_digital_entitlements" ADD CONSTRAINT "commerce_digital_entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "commerce_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_attempts" ADD CONSTRAINT "auth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionKey_fkey" FOREIGN KEY ("permissionKey") REFERENCES "permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_course_chapters" ADD CONSTRAINT "learning_course_chapters_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lessons" ADD CONSTRAINT "learning_lessons_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "learning_course_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_content_blocks" ADD CONSTRAINT "learning_lesson_content_blocks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_enrollments" ADD CONSTRAINT "learning_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_progress" ADD CONSTRAINT "learning_lesson_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_lesson_progress" ADD CONSTRAINT "learning_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessments" ADD CONSTRAINT "learning_assessments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessments" ADD CONSTRAINT "learning_assessments_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "learning_course_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessments" ADD CONSTRAINT "learning_assessments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_questions" ADD CONSTRAINT "learning_assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "learning_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_options" ADD CONSTRAINT "learning_assessment_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "learning_assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_attempts" ADD CONSTRAINT "learning_assessment_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_attempts" ADD CONSTRAINT "learning_assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "learning_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_answers" ADD CONSTRAINT "learning_assessment_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "learning_assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assessment_answers" ADD CONSTRAINT "learning_assessment_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "learning_assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_games" ADD CONSTRAINT "learning_games_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_games" ADD CONSTRAINT "learning_games_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "learning_course_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_games" ADD CONSTRAINT "learning_games_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_game_attempts" ADD CONSTRAINT "learning_game_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_game_attempts" ADD CONSTRAINT "learning_game_attempts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "learning_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assignments" ADD CONSTRAINT "learning_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assignments" ADD CONSTRAINT "learning_assignments_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "learning_course_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assignments" ADD CONSTRAINT "learning_assignments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "learning_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assignment_submissions" ADD CONSTRAINT "learning_assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "learning_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_assignment_submissions" ADD CONSTRAINT "learning_assignment_submissions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_certificates" ADD CONSTRAINT "learning_certificates_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_content_progress" ADD CONSTRAINT "learning_content_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "learning_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_content_progress" ADD CONSTRAINT "learning_content_progress_contentBlockId_fkey" FOREIGN KEY ("contentBlockId") REFERENCES "learning_lesson_content_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

