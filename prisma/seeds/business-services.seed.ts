import { PrismaClient } from "@prisma/client";
import { BUSINESS_SERVICE_DEFINITIONS } from "../../src/modules/business-services/data/service-definitions";

const prisma = new PrismaClient();

/**
 * Seeds Agent 07's detail records against the stable Agent 03 CatalogItem slugs.
 * Catalog items and their cover assets remain managed by the catalog seed.
 */
export async function seedBusinessServices() {
  let count = 0;

  for (const definition of BUSINESS_SERVICE_DEFINITIONS) {
    const catalogItem = await prisma.catalogItem.findUnique({
      where: { slug: definition.slug },
      select: { id: true, type: true },
    });

    if (!catalogItem || catalogItem.type !== "BUSINESS_SERVICE") {
      throw new Error(`CatalogItem jasa '${definition.slug}' belum tersedia atau tipenya bukan BUSINESS_SERVICE. Jalankan seed katalog Agent 03 terlebih dahulu.`);
    }

    await prisma.businessServiceDefinition.upsert({
      where: { slug: definition.slug },
      update: {
        catalogItemId: catalogItem.id,
        summary: definition.summary,
        longDescription: definition.longDescription,
        customerProblems: [...definition.customerProblems],
        targetUsers: [...definition.targetUsers],
        possibleDeliverables: [...definition.possibleDeliverables],
        sampleScope: [...definition.sampleScope],
        customerPreparation: [...definition.customerPreparation],
        pricingFactors: [...definition.pricingFactors],
        durationFactors: [...definition.durationFactors],
        ctaLabel: definition.ctaLabel,
        isActive: true,
      },
      create: {
        catalogItemId: catalogItem.id,
        slug: definition.slug,
        summary: definition.summary,
        longDescription: definition.longDescription,
        customerProblems: [...definition.customerProblems],
        targetUsers: [...definition.targetUsers],
        possibleDeliverables: [...definition.possibleDeliverables],
        sampleScope: [...definition.sampleScope],
        customerPreparation: [...definition.customerPreparation],
        pricingFactors: [...definition.pricingFactors],
        durationFactors: [...definition.durationFactors],
        ctaLabel: definition.ctaLabel,
        isActive: true,
      },
    });
    count += 1;
  }

  console.log(`Seeded ${count} business service definitions.`);
}

if (process.argv[1]?.includes("business-services.seed")) {
  seedBusinessServices()
    .catch((error: unknown) => {
      console.error("Business services seed failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
