import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  GraduationCap, 
  FileText, 
  Briefcase, 
  Sparkles, 
  HelpCircle, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  Send,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import { getCatalogItemBySlug } from "@/modules/catalog";
import { Button } from "@/components/ui/button";

interface DetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);

  if (!item) {
    return {
      title: "Produk Tidak Ditemukan | Joomha Education",
    };
  }

  return {
    title: `${item.title} — Joomha Education`,
    description: item.shortDescription,
    openGraph: {
      title: item.title,
      description: item.shortDescription,
      images: [
        {
          url: item.primaryCover,
          width: 1200,
          height: 675,
          alt: `Sampul resmi ${item.title} - Joomha Education`,
        },
      ],
    },
  };
}

export default async function CatalogDetailPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);

  if (!item) {
    notFound();
  }

  const isComingSoon = item.status === "COMING_SOON";
  const isCourse = item.type === "SELF_PACED_COURSE";
  const isDigital = item.type === "DIGITAL_PRODUCT";
  const isService = item.type === "BUSINESS_SERVICE";

  const curriculum = Array.isArray(item.curriculumSummary)
    ? (item.curriculumSummary as { chapter: string; topics: string[] }[])
    : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/katalog" className="hover:text-primary transition-colors">
          Katalog
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/katalog?type=${item.type}`}
          className="hover:text-primary transition-colors"
        >
          {item.category?.name || item.field}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
          {item.title}
        </span>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (8 cols): Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Title & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/80 px-3 py-1 text-xs font-semibold text-foreground">
                {isCourse && <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />}
                {isDigital && <FileText className="h-3.5 w-3.5 text-emerald-500" />}
                {isService && <Briefcase className="h-3.5 w-3.5 text-amber-500" />}
                <span>{item.category?.name || item.field}</span>
              </span>

              {item.level && (
                <span className="rounded-full border border-muted bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                  Tingkat: {item.level}
                </span>
              )}

              {item.duration && (
                <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.duration}
                </span>
              )}

              {isComingSoon && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Segera Hadir
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              {item.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {item.shortDescription}
            </p>
          </div>

          {/* Primary Cover Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border bg-muted shadow-sm">
            <Image
              src={item.primaryCover || "/images/catalog/default-cover.svg"}
              alt={`Sampul visual resmi untuk ${item.title}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
            />
          </div>

          {/* Detailed Description */}
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Tentang Program / Produk Ini
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {item.description}
            </div>
          </div>

          {/* Features / Manfaat Utama */}
          {item.features && item.features.length > 0 && (
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Fitur & Manfaat Utama
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Outcomes (for Courses) */}
          {item.learningOutcomes && item.learningOutcomes.length > 0 && (
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Hasil yang Akan Anda Kuasai
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {item.learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-foreground">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Course Curriculum Summary */}
          {isCourse && curriculum.length > 0 && (
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-500" />
                  Struktur Silabus Pembelajaran
                </h2>
                <span className="text-xs text-muted-foreground">
                  {curriculum.length} Modul Materi
                </span>
              </div>
              <div className="space-y-3">
                {curriculum.map((chap, idx) => (
                  <div key={idx} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">
                        Modul {idx + 1}
                      </span>
                      {chap.chapter}
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {chap.topics.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-block rounded-md bg-background px-2.5 py-1 text-xs text-muted-foreground border"
                        >
                          &bull; {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Audience & Prerequisites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {item.targetAudience && item.targetAudience.length > 0 && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="font-bold text-base text-foreground">
                  Untuk Siapa Program Ini?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {item.targetAudience.map((aud, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      <span>{aud}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.prerequisites && item.prerequisites.length > 0 && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <h3 className="font-bold text-base text-foreground">
                  Prasyarat Mengikuti
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {item.prerequisites.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0 mt-2" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* FAQs Section */}
          {item.faqs && item.faqs.length > 0 && (
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <div className="space-y-4">
                {item.faqs.map((faq, idx) => (
                  <div key={idx} className="border-b last:border-b-0 pb-4 last:pb-0 space-y-1.5">
                    <h3 className="font-semibold text-sm text-foreground">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar (4 cols): Pricing & Action */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-md space-y-6">
              {/* Pricing Box */}
              <div className="space-y-1 pb-4 border-b">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {isService ? "Investasi Layanan" : "Biaya Program"}
                </span>
                <div className="text-3xl font-extrabold text-foreground tracking-tight">
                  {item.priceLabel}
                </div>
                {item.discountPrice && item.basePrice && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="line-through text-muted-foreground">
                      Rp {item.basePrice.toLocaleString("id-ID")}
                    </span>
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-xs font-bold text-rose-600">
                      Diskon
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons depending on type & status */}
              <div className="space-y-3">
                {isComingSoon && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                      <strong>Informasi Ketersediaan:</strong> Item ini saat ini berstatus <em>Segera Hadir</em>. Pendaftaran dan akses materi akan dibuka dalam waktu dekat.
                    </div>
                    <Button className="w-full justify-center gap-2" variant="outline" asChild>
                      <Link href="/konsultan-ai">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Tanya Jadwal ke AI Konsultan
                      </Link>
                    </Button>
                  </div>
                )}

                {isService && (
                  <div className="space-y-3">
                    <Button asChild size="lg" className="w-full justify-center gap-2 font-bold">
                      <Link href={`https://wa.me/?text=Halo%20Joomha,%20saya%20tertarik%20dengan%20layanan%20${encodeURIComponent(item.title)}`}>
                        <Send className="h-4 w-4" />
                        Ajukan Proposal / Konsultasi
                      </Link>
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Konsultasi awal gratis untuk memetakan ruang lingkup dan estimasi waktu proyek.
                    </p>
                  </div>
                )}

                {!isComingSoon && !isService && (
                  <Button size="lg" className="w-full justify-center gap-2 font-bold">
                    <FileCheck className="h-4 w-4" />
                    Beli Sekarang
                  </Button>
                )}
              </div>

              {/* Guarantees and highlights */}
              <div className="pt-4 border-t space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Materi & Aset Resmi Joomha Education</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>Akses Seumur Hidup & Update Berkala</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Dukungan Konsultasi bersama Tim Joomha</span>
                </div>
              </div>
            </div>

            {/* Back to Catalog Link */}
            <div className="text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/katalog" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Semua Katalog
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

