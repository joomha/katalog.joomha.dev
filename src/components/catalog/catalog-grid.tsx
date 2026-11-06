import { CatalogItemDTO } from "@/modules/catalog/types";
import { CatalogCard } from "./catalog-card";
import { BookOpen } from "lucide-react";

interface CatalogGridProps {
  items: CatalogItemDTO[];
}

export function CatalogGrid({ items }: CatalogGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Tidak ada item ditemukan</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          Kriteria pencarian atau filter yang Anda pilih tidak memiliki hasil yang cocok. Coba reset filter atau gunakan kata kunci lain.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {items.map((item) => (
        <CatalogCard key={item.id} item={item} />
      ))}
    </div>
  );
}

