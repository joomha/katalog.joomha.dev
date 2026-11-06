import { z } from "zod";

export const CatalogItemTypeEnum = z.enum([
  "DIGITAL_PRODUCT",
  "SELF_PACED_COURSE",
  "PRIVATE_TUTORING",
  "BUSINESS_SERVICE",
]);
export type CatalogItemType = z.infer<typeof CatalogItemTypeEnum>;

export const CatalogItemStatusEnum = z.enum([
  "DRAFT",
  "COMING_SOON",
  "AVAILABLE",
  "ARCHIVED",
]);
export type CatalogItemStatus = z.infer<typeof CatalogItemStatusEnum>;

export const PriceTypeEnum = z.enum([
  "FIXED",
  "STARTING_AT",
  "CONSULTATION_BASED",
]);
export type PriceType = z.infer<typeof PriceTypeEnum>;

export const CatalogFilterSchema = z.object({
  search: z.string().optional(),
  type: CatalogItemTypeEnum.optional(),
  categorySlug: z.string().optional(),
  field: z.string().optional(),
  level: z.string().optional(),
  status: CatalogItemStatusEnum.optional(),
  isFeatured: z.boolean().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "title_asc"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

export type CatalogFilterInput = z.input<typeof CatalogFilterSchema>;
export type CatalogFilterOutput = z.output<typeof CatalogFilterSchema>;

export interface CatalogAssetDTO {
  id: string;
  assetType: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface CatalogCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  itemCount?: number;
}

export interface CatalogItemDTO {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  type: CatalogItemType;
  status: CatalogItemStatus;
  priceType: PriceType;
  basePrice: number | null;
  discountPrice: number | null;
  priceLabel: string;
  field: string;
  level: string | null;
  method: string | null;
  duration: string | null;
  targetAudience: string[];
  learningOutcomes: string[];
  prerequisites: string[];
  features: string[];
  curriculumSummary: unknown;
  faqs: { question: string; answer: string }[];
  ctaType: string;
  ctaText: string;
  ctaLink: string;
  isFeatured: boolean;
  category: CatalogCategoryDTO;
  primaryCover: string;
  assets: CatalogAssetDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PurchasabilityResult {
  canPurchase: boolean;
  reason?: string;
  checkoutType: "IMMEDIATE" | "COMING_SOON" | "CONSULTATION_REQUIRED" | "UNAVAILABLE";
  ctaText: string;
  ctaLink: string;
}

