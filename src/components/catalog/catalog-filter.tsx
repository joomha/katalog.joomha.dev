"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CatalogFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "";
  const currentField = searchParams.get("field") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentSort = searchParams.get("sortBy") || "newest";

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 on filter changes
    newParams.delete("page");

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleClearAll = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    currentSearch || currentType || currentField || currentLevel || (currentSort && currentSort !== "newest")
  );

  const typeOptions = [
    { value: "", label: "Semua Kategori" },
    { value: "SELF_PACED_COURSE", label: "Kursus Online" },
    { value: "DIGITAL_PRODUCT", label: "Produk Digital" },
    { value: "BUSINESS_SERVICE", label: "Jasa Digitalisasi" },
  ];

  const fieldOptions = [
    { value: "", label: "Semua Bidang" },
    { value: "Perkantoran & Administrasi", label: "Perkantoran & Administrasi" },
    { value: "Pemrograman & Pengembangan", label: "Pemrograman & Pengembangan" },
    { value: "Artificial Intelligence", label: "Artificial Intelligence" },
    { value: "Data & Analisis", label: "Data & Analisis" },
    { value: "Bisnis & Keuangan", label: "Bisnis & Keuangan" },
  ];

  const levelOptions = [
    { value: "", label: "Semua Level" },
    { value: "Pemula", label: "Pemula" },
    { value: "Menengah", label: "Menengah" },
    { value: "Semua Tingkat", label: "Semua Tingkat" },
  ];

  const sortOptions = [
    { value: "newest", label: "Terbaru" },
    { value: "price_asc", label: "Harga: Terendah" },
    { value: "price_desc", label: "Harga: Tertinggi" },
    { value: "title_asc", label: "Nama: A ke Z" },
  ];

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
      {/* Search Bar Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kursus, template Excel, jasa pembuatan website, dll..."
            className="w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilters({ search: null });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isPending}>
          Cari
        </Button>
      </form>

      {/* Type Quick Buttons (Tabs) */}
      <div className="flex flex-wrap gap-2 pt-1 border-t">
        {typeOptions.map((opt) => {
          const isActive = currentType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFilters({ type: opt.value })}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Field Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Bidang Keterampilan
          </label>
          <select
            value={currentField}
            onChange={(e) => updateFilters({ field: e.target.value })}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {fieldOptions.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Level Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tingkat Keahlian
          </label>
          <select
            value={currentLevel}
            onChange={(e) => updateFilters({ level: e.target.value })}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {levelOptions.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Urutkan
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Reset Bar */}
      {hasActiveFilters && (
        <div className="pt-2 flex items-center justify-between border-t text-xs text-muted-foreground">
          <span className="italic">
            Filter aktif diterapkan {isPending && "(memperbarui...)"}
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
}

