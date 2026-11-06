import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES, RAW_SEED_ITEMS } from "../../src/modules/catalog/data/seed-items";

const prisma = new PrismaClient();

export async function seedCatalog() {
  console.log("🌱 Starting Catalog & Storefront Seeding (45 Initial Listings)...");

  // 1. Seed Categories
  const categoryMap = new Map<string, string>();
  for (const cat of SEED_CATEGORIES) {
    const upsertedCat = await prisma.catalogCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
      },
    });
    categoryMap.set(cat.slug, upsertedCat.id);
  }
  console.log(`✅ Seeded ${categoryMap.size} categories.`);

  // 2. Seed 45 Items
  let count = 0;
  for (const item of RAW_SEED_ITEMS) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`Category slug '${item.categorySlug}' not found for item '${item.slug}'`);
      continue;
    }

    const upsertedItem = await prisma.catalogItem.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        type: item.type,
        status: item.status,
        priceType: item.priceType,
        basePrice: item.basePrice,
        discountPrice: item.discountPrice,
        priceLabel: item.priceLabel,
        categoryId: categoryId,
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
      },
      create: {
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
        categoryId: categoryId,
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
      },
    });

    // Seed Primary Asset / Cover
    await prisma.catalogAsset.deleteMany({
      where: { itemId: upsertedItem.id, assetType: "COVER" },
    });

    await prisma.catalogAsset.create({
      data: {
        itemId: upsertedItem.id,
        assetType: "COVER",
        url: item.coverImage,
        altText: `Sampul resmi ${item.title} - Joomha Education`,
        isPrimary: true,
        displayOrder: 0,
      },
    });

    count++;
  }

  console.log(`✅ Idempotently seeded ${count} catalog items & primary assets.`);
}

// Allow direct execution via tsx/node if invoked standalone
if (process.argv[1]?.includes("catalog.seed")) {
  seedCatalog()
    .catch((e) => {
      console.error("Error seeding catalog:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

