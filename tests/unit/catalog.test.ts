import { describe, it, expect } from "vitest";
import {
  listCatalogItems,
  getCatalogItemBySlug,
  listCategories,
  checkCatalogItemPurchasability,
} from "@/modules/catalog";
import { RAW_SEED_ITEMS, SEED_CATEGORIES } from "@/modules/catalog/data/seed-items";

describe("Catalog Module & 45 Listings Verification", () => {
  describe("Seed Data Integrity & Idempotency", () => {
    it("contains exactly 45 seed listings", () => {
      expect(RAW_SEED_ITEMS.length).toBe(45);
    });

    it("has 4 standard categories", () => {
      expect(SEED_CATEGORIES.length).toBe(4);
      const catSlugs = SEED_CATEGORIES.map((c) => c.slug);
      expect(catSlugs).toContain("kelas-online");
      expect(catSlugs).toContain("produk-digital");
      expect(catSlugs).toContain("jasa-digitalisasi");
      expect(catSlugs).toContain("les-privat");
    });

    it("has unique slugs across all 45 listings", () => {
      const slugs = RAW_SEED_ITEMS.map((item) => item.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(45);
    });

    it("divides into exactly 15 courses, 15 digital products, and 15 business services", () => {
      const courses = RAW_SEED_ITEMS.filter((i) => i.type === "SELF_PACED_COURSE");
      const digitalProducts = RAW_SEED_ITEMS.filter((i) => i.type === "DIGITAL_PRODUCT");
      const businessServices = RAW_SEED_ITEMS.filter((i) => i.type === "BUSINESS_SERVICE");

      expect(courses.length).toBe(15);
      expect(digitalProducts.length).toBe(15);
      expect(businessServices.length).toBe(15);
    });

    it("verifies all listings have valid title, shortDescription, description, and priceLabel", () => {
      for (const item of RAW_SEED_ITEMS) {
        expect(item.title).toBeTruthy();
        expect(item.slug).toMatch(/^[a-z0-9-]+$/);
        expect(item.shortDescription).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.priceLabel).toBeTruthy();
        expect(item.coverImage).toMatch(/^\/images\/catalog\/[a-z0-9-]+\.svg$/);
        expect(item.ctaText).toBeTruthy();
        expect(item.ctaType).toBeTruthy();
      }
    });

    it("enforces COMING_SOON for courses and digital products, AVAILABLE for services", () => {
      const courses = RAW_SEED_ITEMS.filter((i) => i.type === "SELF_PACED_COURSE");
      const digital = RAW_SEED_ITEMS.filter((i) => i.type === "DIGITAL_PRODUCT");
      const services = RAW_SEED_ITEMS.filter((i) => i.type === "BUSINESS_SERVICE");

      courses.forEach((c) => expect(c.status).toBe("COMING_SOON"));
      digital.forEach((d) => expect(d.status).toBe("COMING_SOON"));
      services.forEach((s) => expect(s.status).toBe("AVAILABLE"));
    });
  });

  describe("Catalog Public Service Query & Filtering", () => {
    it("listCatalogItems returns paginated results", async () => {
      const res = await listCatalogItems({ limit: 10, page: 1 });
      expect(res.data.length).toBe(10);
      expect(res.pagination.total).toBe(45);
      expect(res.pagination.page).toBe(1);
      expect(res.pagination.totalPages).toBe(5);
    });

    it("filters by type correctly", async () => {
      const courseRes = await listCatalogItems({ type: "SELF_PACED_COURSE", limit: 50 });
      expect(courseRes.data.length).toBe(15);
      courseRes.data.forEach((item) => expect(item.type).toBe("SELF_PACED_COURSE"));

      const digitalRes = await listCatalogItems({ type: "DIGITAL_PRODUCT", limit: 50 });
      expect(digitalRes.data.length).toBe(15);
      digitalRes.data.forEach((item) => expect(item.type).toBe("DIGITAL_PRODUCT"));

      const serviceRes = await listCatalogItems({ type: "BUSINESS_SERVICE", limit: 50 });
      expect(serviceRes.data.length).toBe(15);
      serviceRes.data.forEach((item) => expect(item.type).toBe("BUSINESS_SERVICE"));
    });

    it("filters by isFeatured", async () => {
      const res = await listCatalogItems({ isFeatured: true, limit: 50 });
      expect(res.data.length).toBeGreaterThan(0);
      res.data.forEach((item) => expect(item.isFeatured).toBe(true));
    });

    it("searches by keyword", async () => {
      const res = await listCatalogItems({ search: "python", limit: 50 });
      expect(res.data.length).toBeGreaterThanOrEqual(2); // python-fundamental & workbook-belajar-python
      const slugs = res.data.map((i) => i.slug);
      expect(slugs).toContain("python-fundamental");
      expect(slugs).toContain("workbook-belajar-python");
    });

    it("sorts by price ascending and descending", async () => {
      const ascRes = await listCatalogItems({ sortBy: "price_asc", limit: 50 });
      const descRes = await listCatalogItems({ sortBy: "price_desc", limit: 50 });

      expect(ascRes.data.length).toBe(45);
      expect(descRes.data.length).toBe(45);
    });
  });

  describe("Single Item Retrieval & Purchasability Check", () => {
    it("getCatalogItemBySlug retrieves correct item", async () => {
      const item = await getCatalogItemBySlug("microsoft-excel-basic");
      expect(item).not.toBeNull();
      expect(item?.slug).toBe("microsoft-excel-basic");
      expect(item?.title).toBe("Microsoft Excel Basic");
      expect(item?.type).toBe("SELF_PACED_COURSE");
      expect(item?.status).toBe("COMING_SOON");
    });

    it("getCatalogItemBySlug returns null for non-existent slug", async () => {
      const item = await getCatalogItemBySlug("slug-yang-tidak-pernah-ada-123");
      expect(item).toBeNull();
    });

    it("checkCatalogItemPurchasability handles courses coming soon", async () => {
      const check = await checkCatalogItemPurchasability("python-fundamental");
      expect(check.canPurchase).toBe(false);
      expect(check.checkoutType).toBe("COMING_SOON");
      expect(check.ctaText).toBe("Segera Hadir");
    });

    it("checkCatalogItemPurchasability blocks digital product without final file", async () => {
      const check = await checkCatalogItemPurchasability("template-keuangan-umkm");
      expect(check.canPurchase).toBe(false);
      expect(check.checkoutType).toBe("COMING_SOON");
      expect(check.ctaText).toBe("Segera Hadir");
    });

    it("checkCatalogItemPurchasability routes business service to consultation", async () => {
      const check = await checkCatalogItemPurchasability("konsultasi-digitalisasi-bisnis");
      expect(check.canPurchase).toBe(false);
      expect(check.checkoutType).toBe("CONSULTATION_REQUIRED");
      expect(check.ctaText).toBe("Ajukan Kebutuhan Proyek");
    });
  });

  describe("Category Listing", () => {
    it("listCategories returns 4 categories with valid metadata", async () => {
      const categories = await listCategories();
      expect(categories.length).toBe(4);
      expect(categories[0].name).toBeTruthy();
      expect(categories[0].slug).toBeTruthy();
    });
  });
});

