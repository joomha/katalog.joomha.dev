import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Layers } from "lucide-react";
import { listCatalogItems } from "@/modules/catalog";
import { CatalogFilter } from "@/components/catalog/catalog-filter";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogItemType } from "@/modules/catalog/types";

export const metadata: Metadata = {
  title: "Katalog Kursus, Produk Digital & Solusi Bisnis | Joomha Education",
  description:
    "Eksplorasi 45 listing resmi Joomha Education: Kursus Microsoft Office & Coding, Template Spreadsheet & Dokumen, dan Jasa Digitalisasi Bisnis terpercaya.",
};

interface KatalogPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    field?: string;
    level?: string;
    search?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const resolvedParams = await searchParams;

  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const limit = 12;

  const validTypes: CatalogItemType[] = [
    "DIGITAL_PRODUCT",
    "SELF_PACED_COURSE",
    "PRIVATE_TUTORING",
    "BUSINESS_SERVICE",
  ];

  const typeParam = validTypes.includes(resolvedParams.type as CatalogItemType)
    ? (resolvedParams.type as CatalogItemType)
    : undefined;

  const validSort = ["newest", "price_asc", "price_desc", "title_asc"].includes(
    resolvedParams.sortBy || ""
  )
    ? (resolvedParams.sortBy as "newest" | "price_asc" | "price_desc" | "title_asc")
    : "newest";

  const result = await listCatalogItems({
    search: resolvedParams.search,
    type: typeParam,
    categorySlug: resolvedParams.category,
    field: resolvedParams.field,
    level: resolvedParams.level,
    sortBy: validSort,
    page: isNaN(page) ? 1 : page,
    limit,
  });

  const getHeadingText = () => {
    if (resolvedParams.type === "SELF_PACED_COURSE") return "Katalog Kelas & Kursus Online";
    if (resolvedParams.type === "DIGITAL_PRODUCT") return "Katalog Produk & Template Digital";
    if (resolvedParams.type === "BUSINESS_SERVICE") return "Katalog Layanan & Jasa Digitalisasi";
    return "Katalog Lengkap Joomha Education";
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Katalog</span>
        {resolvedParams.type && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="capitalize text-primary">
              {resolvedParams.type.replace(/_/g, " ").toLowerCase()}
            </span>
          </>
        )}
      </nav>

      {/* Page Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Layers className="h-3.5 w-3.5" />
          Storefront Resmi
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          {getHeadingText()}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
          Temukan 45 pilihan produk dan layanan terverifikasi dari Joomha Education. Gunakan filter di bawah ini untuk menyaring berdasarkan jenis, topik, tingkat keahlian, atau urutan harga.
        </p>
      </div>

      {/* Filter Component */}
      <CatalogFilter />

      {/* Search results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <p>
          Ditemukan <strong className="text-foreground">{result.pagination.total}</strong> listing
          {resolvedParams.search && (
            <span> untuk kata kunci &ldquo;<span className="text-primary">{resolvedParams.search}</span>&rdquo;</span>
          )}
        </p>
      </div>

      {/* Product Cards Grid */}
      <CatalogGrid items={result.data} />

      {/* Pagination Bar */}
      <CatalogPagination
        currentPage={result.pagination.page}
        totalPages={result.pagination.totalPages}
        totalItems={result.pagination.total}
        limit={result.pagination.limit}
        baseUrl="/katalog"
        searchParams={resolvedParams}
      />
    </div>
  );
}

