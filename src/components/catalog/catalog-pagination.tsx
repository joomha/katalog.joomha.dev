import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  baseUrl,
  searchParams,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== "page") {
        params.set(key, val);
      }
    });
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t">
      <div className="text-sm text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{startItem}</span> -{" "}
        <span className="font-semibold text-foreground">{endItem}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> listing katalog
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </span>
        )}

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const isCurrent = page === currentPage;
            return (
              <Link
                key={page}
                href={createPageUrl(page)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 px-3 py-1.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

