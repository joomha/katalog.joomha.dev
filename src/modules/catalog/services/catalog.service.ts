import { prisma } from "@/lib/db/prisma";
import {
  CatalogFilterInput,
  CatalogItemDTO,
  CatalogCategoryDTO,
  PaginatedResult,
  PurchasabilityResult,
} from "../types";
import { SEED_CATEGORIES, RAW_SEED_ITEMS, RawSeedItem } from "../data/seed-items";

function mapRawToDTO(item: RawSeedItem, id?: string): CatalogItemDTO {
  const cat = SEED_CATEGORIES.find((c) => c.slug === item.categorySlug) ?? SEED_CATEGORIES[0];
  return {
    id: id ?? `local-${item.slug}`,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    description: item.description,
    type: item.type,
    status: item.status,
    priceType: item.priceType,
    basePrice: item.basePrice,
    discountPrice: item.discountPrice,
    priceLabel: item.priceLabel,
    field: item.field,
    level: item.level,
    method: item.method,
    duration: item.duration,
    targetAudience: item.targetAudience,
    learningOutcomes: item.learningOutcomes,
    prerequisites: item.prerequisites,
    features: item.features,
    curriculumSummary: item.curriculumSummary,
    faqs: item.faqs,
    ctaType: item.ctaType,
    ctaText: item.ctaText,
    ctaLink: item.ctaLink,
    isFeatured: item.isFeatured,
    primaryCover: item.coverImage,
    category: {
      id: `cat-${cat.slug}`,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      displayOrder: cat.displayOrder,
    },
    assets: [
      {
        id: `asset-${item.slug}`,
        assetType: "COVER",
        url: item.coverImage,
        altText: `Sampul resmi ${item.title} - Joomha Education`,
        isPrimary: true,
        displayOrder: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export class CatalogService {
  /**
   * List categories with optional item count
   */
  async listCategories(): Promise<CatalogCategoryDTO[]> {
    try {
      const categories = await prisma.catalogCategory.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      if (categories.length > 0) {
        return categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          displayOrder: c.displayOrder,
          itemCount: c._count.items,
        }));
      }
    } catch {
      // Fallback when DB is not yet migrated/connected in initial setup
    }

    return SEED_CATEGORIES.map((c) => ({
      id: `cat-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      displayOrder: c.displayOrder,
      itemCount: RAW_SEED_ITEMS.filter((i) => i.categorySlug === c.slug).length,
    }));
  }

  /**
   * Retrieve catalog items with search, filter, and pagination
   */
  async listCatalogItems(
    filters: CatalogFilterInput = { sortBy: "newest", page: 1, limit: 12 }
  ): Promise<PaginatedResult<CatalogItemDTO>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 12));
    const skip = (page - 1) * limit;

    try {
      const whereClause: Record<string, unknown> = {};

      if (filters.type) {
        whereClause.type = filters.type;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.categorySlug) {
        whereClause.category = { slug: filters.categorySlug };
      }
      if (filters.field) {
        whereClause.field = filters.field;
      }
      if (filters.level) {
        whereClause.level = filters.level;
      }
      if (typeof filters.isFeatured === "boolean") {
        whereClause.isFeatured = filters.isFeatured;
      }
      if (filters.search && filters.search.trim() !== "") {
        whereClause.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { shortDescription: { contains: filters.search, mode: "insensitive" } },
          { field: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const orderByClause: Record<string, "asc" | "desc"> = {};
      if (filters.sortBy === "price_asc") {
        orderByClause.basePrice = "asc";
      } else if (filters.sortBy === "price_desc") {
        orderByClause.basePrice = "desc";
      } else if (filters.sortBy === "title_asc") {
        orderByClause.title = "asc";
      } else {
        orderByClause.createdAt = "desc";
      }

      const [items, total] = await Promise.all([
        prisma.catalogItem.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: orderByClause,
          include: {
            category: true,
            assets: { orderBy: { displayOrder: "asc" } },
          },
        }),
        prisma.catalogItem.count({ where: whereClause }),
      ]);

      if (items.length > 0 || total > 0) {
        const data: CatalogItemDTO[] = items.map((item) => {
          const primaryAsset = item.assets.find((a) => a.isPrimary) ?? item.assets[0];
          return {
            id: item.id,
            title: item.title,
            slug: item.slug,
            shortDescription: item.shortDescription,
            description: item.description,
            type: item.type as CatalogItemDTO["type"],
            status: item.status as CatalogItemDTO["status"],
            priceType: item.priceType as CatalogItemDTO["priceType"],
            basePrice: item.basePrice ? Number(item.basePrice) : null,
            discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
            priceLabel: item.priceLabel,
            field: item.field,
            level: item.level,
            method: item.method,
            duration: item.duration,
            targetAudience: item.targetAudience,
            learningOutcomes: item.learningOutcomes,
            prerequisites: item.prerequisites,
            features: item.features,
            curriculumSummary: item.curriculumSummary,
            faqs: (item.faqs as { question: string; answer: string }[]) ?? [],
            ctaType: item.ctaType,
            ctaText: item.ctaText,
            ctaLink: item.ctaLink,
            isFeatured: item.isFeatured,
            primaryCover: primaryAsset?.url ?? `/images/catalog/${item.slug}.svg`,
            category: {
              id: item.category.id,
              name: item.category.name,
              slug: item.category.slug,
              description: item.category.description,
              icon: item.category.icon,
              displayOrder: item.category.displayOrder,
            },
            assets: item.assets.map((a) => ({
              id: a.id,
              assetType: a.assetType,
              url: a.url,
              altText: a.altText,
              isPrimary: a.isPrimary,
              displayOrder: a.displayOrder,
            })),
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          };
        });

        const totalPages = Math.ceil(total / limit);
        return {
          data,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }
    } catch {
      // Fallback to static seed items
    }

    // Filter memory fallback
    let filtered = [...RAW_SEED_ITEMS];

    if (filters.type) {
      filtered = filtered.filter((i) => i.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.categorySlug) {
      filtered = filtered.filter((i) => i.categorySlug === filters.categorySlug);
    }
    if (filters.field) {
      filtered = filtered.filter((i) => i.field.toLowerCase() === filters.field?.toLowerCase());
    }
    if (filters.level) {
      filtered = filtered.filter((i) => i.level?.toLowerCase() === filters.level?.toLowerCase());
    }
    if (typeof filters.isFeatured === "boolean") {
      filtered = filtered.filter((i) => i.isFeatured === filters.isFeatured);
    }
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.shortDescription.toLowerCase().includes(q) ||
          i.field.toLowerCase().includes(q)
      );
    }

    if (filters.sortBy === "price_asc") {
      filtered.sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
    } else if (filters.sortBy === "price_desc") {
      filtered.sort((a, b) => (b.basePrice ?? 0) - (a.basePrice ?? 0));
    } else if (filters.sortBy === "title_asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const data = paginated.map((item) => mapRawToDTO(item));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single catalog item by unique slug
   */
  async getCatalogItemBySlug(slug: string): Promise<CatalogItemDTO | null> {
    try {
      const item = await prisma.catalogItem.findUnique({
        where: { slug },
        include: {
          category: true,
          assets: { orderBy: { displayOrder: "asc" } },
        },
      });

      if (item) {
        const primaryAsset = item.assets.find((a) => a.isPrimary) ?? item.assets[0];
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          description: item.description,
          type: item.type as CatalogItemDTO["type"],
          status: item.status as CatalogItemDTO["status"],
          priceType: item.priceType as CatalogItemDTO["priceType"],
          basePrice: item.basePrice ? Number(item.basePrice) : null,
          discountPrice: item.discountPrice ? Number(item.discountPrice) : null,
          priceLabel: item.priceLabel,
          field: item.field,
          level: item.level,
          method: item.method,
          duration: item.duration,
          targetAudience: item.targetAudience,
          learningOutcomes: item.learningOutcomes,
          prerequisites: item.prerequisites,
          features: item.features,
          curriculumSummary: item.curriculumSummary,
          faqs: (item.faqs as { question: string; answer: string }[]) ?? [],
          ctaType: item.ctaType,
          ctaText: item.ctaText,
          ctaLink: item.ctaLink,
          isFeatured: item.isFeatured,
          primaryCover: primaryAsset?.url ?? `/images/catalog/${item.slug}.svg`,
          category: {
            id: item.category.id,
            name: item.category.name,
            slug: item.category.slug,
            description: item.category.description,
            icon: item.category.icon,
            displayOrder: item.category.displayOrder,
          },
          assets: item.assets.map((a) => ({
            id: a.id,
            assetType: a.assetType,
            url: a.url,
            altText: a.altText,
            isPrimary: a.isPrimary,
            displayOrder: a.displayOrder,
          })),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const raw = RAW_SEED_ITEMS.find((i) => i.slug === slug);
    if (!raw) return null;
    return mapRawToDTO(raw);
  }

  /**
   * Check if a catalog item is currently purchasable (for Agent 04 Commerce integration)
   */
  async checkCatalogItemPurchasability(itemIdOrSlug: string): Promise<PurchasabilityResult> {
    const item =
      (await this.getCatalogItemBySlug(itemIdOrSlug)) ??
      (await this.listCatalogItems({ limit: 100 })).data.find(
        (i) => i.id === itemIdOrSlug || i.slug === itemIdOrSlug
      );

    if (!item) {
      return {
        canPurchase: false,
        reason: "Item katalog tidak ditemukan.",
        checkoutType: "UNAVAILABLE",
        ctaText: "Tidak Tersedia",
        ctaLink: "/katalog",
      };
    }

    // Business Services and Tutoring require consultation/proposal
    if (item.type === "BUSINESS_SERVICE") {
      return {
        canPurchase: false,
        reason: "Jasa digitalisasi membutuhkan analisis kebutuhan dan proposal resmi.",
        checkoutType: "CONSULTATION_REQUIRED",
        ctaText: "Ajukan Kebutuhan Proyek",
        ctaLink: `/katalog/${item.slug}#konsultasi`,
      };
    }

    if (item.type === "PRIVATE_TUTORING") {
      return {
        canPurchase: false,
        reason: "Les privat memerlukan konfirmasi jadwal instruktur dan penawaran resmi.",
        checkoutType: "CONSULTATION_REQUIRED",
        ctaText: "Konsultasikan Jadwal & Materi",
        ctaLink: `/les-privat?materi=${item.slug}`,
      };
    }

    // Coming soon courses & digital products without final deliverables
    if (item.status === "COMING_SOON" || item.status === "DRAFT") {
      return {
        canPurchase: false,
        reason: "Produk/kursus ini sedang dalam tahap persiapan akhir materi dan segera tersedia.",
        checkoutType: "COMING_SOON",
        ctaText: "Segera Hadir",
        ctaLink: `/katalog/${item.slug}`,
      };
    }

    if (item.status === "AVAILABLE" && (item.type === "DIGITAL_PRODUCT" || item.type === "SELF_PACED_COURSE")) {
      return {
        canPurchase: true,
        checkoutType: "IMMEDIATE",
        ctaText: item.type === "SELF_PACED_COURSE" ? "Daftar Kursus" : "Beli Sekarang",
        ctaLink: `/checkout?item=${item.slug}`,
      };
    }

    return {
      canPurchase: false,
      reason: "Item tidak aktif atau diarsipkan.",
      checkoutType: "UNAVAILABLE",
      ctaText: "Diarsipkan",
      ctaLink: "/katalog",
    };
  }
}

export const catalogService = new CatalogService();

