import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  FileText, 
  Briefcase, 
  Clock, 
  Layers, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { CatalogItemDTO, CatalogItemType } from "@/modules/catalog/types";
import { Button } from "@/components/ui/button";

interface CatalogCardProps {
  item: CatalogItemDTO;
}

export function CatalogCard({ item }: CatalogCardProps) {
  const getTypeInfo = (type: CatalogItemType) => {
    switch (type) {
      case "SELF_PACED_COURSE":
        return {
          label: "Kursus Online",
          icon: GraduationCap,
          badgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          cardBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
        };
      case "DIGITAL_PRODUCT":
        return {
          label: "Produk Digital",
          icon: FileText,
          badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          cardBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
        };
      case "BUSINESS_SERVICE":
        return {
          label: "Jasa Digitalisasi",
          icon: Briefcase,
          badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          cardBorder: "hover:border-amber-300 dark:hover:border-amber-700",
        };
      default:
        return {
          label: "Layanan",
          icon: Layers,
          badgeColor: "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200",
          cardBorder: "hover:border-primary/50",
        };
    }
  };

  const typeInfo = getTypeInfo(item.type);
  const TypeIcon = typeInfo.icon;
  const isComingSoon = item.status === "COMING_SOON";

  return (
    <div 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-lg ${typeInfo.cardBorder}`}
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
          <Image
            src={item.primaryCover || "/images/catalog/default-cover.svg"}
            alt={`Sampul resmi ${item.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={item.isFeatured}
          />
          
          {/* Top Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md shadow-sm ${typeInfo.badgeColor}`}
            >
              <TypeIcon className="h-3 w-3" />
              {typeInfo.label}
            </span>

            {isComingSoon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-500/90 text-white px-2 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md">
                Segera Hadir
              </span>
            )}
            {!isComingSoon && item.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/90 text-primary-foreground px-2 py-0.5 text-[11px] font-bold shadow-sm backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                Unggulan
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Category & Meta tag */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-primary">
              {item.category?.name || item.field}
            </span>
            {item.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration}
              </span>
            )}
            {item.level && !item.duration && (
              <span className="capitalize">{item.level}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/katalog/${item.slug}`}>
              {item.title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.shortDescription}
          </p>
        </div>
      </div>

      {/* Card Footer: Price & CTA */}
      <div className="p-5 pt-0 border-t mt-4 bg-muted/10 flex flex-col gap-3">
        <div className="pt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Biaya / Investasi
            </span>
            <span className="text-base font-extrabold text-foreground tracking-tight">
              {item.priceLabel}
            </span>
          </div>
        </div>

        <Button asChild className="w-full justify-between group-hover:shadow-sm" size="sm">
          <Link href={`/katalog/${item.slug}`}>
            <span>{item.ctaText || "Lihat Detail"}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

