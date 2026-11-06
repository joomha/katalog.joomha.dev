import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  FileText, 
  Briefcase, 
  UserCheck, 
  CheckCircle2, 
  Zap, 
  Laptop
} from "lucide-react";
import { listCatalogItems } from "@/modules/catalog";
import { CatalogCard } from "@/components/catalog/catalog-card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Joomha Education — Solusi Pembelajaran Digital & Transformasi Bisnis",
  description:
    "Storefront resmi Joomha Education: 45 pilihan kursus online praktis, template & workbook digital, serta jasa transformasi digital bisnis terpercaya di Indonesia.",
};

export default async function HomePage() {
  const featuredResult = await listCatalogItems({ isFeatured: true, limit: 6 });

  const featuredItems = featuredResult.data;

  const pillarCards = [
    {
      title: "Kelas Online Mandiri",
      desc: "15 Kursus praktis mulai dari Microsoft Office, Python, C++, hingga AI Application Development.",
      count: "15 Kursus",
      href: "/katalog?type=SELF_PACED_COURSE",
      icon: GraduationCap,
      color: "from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60",
    },
    {
      title: "Produk & Template Digital",
      desc: "15 Paket template Excel siap pakai, pembukuan UMKM, proposal bisnis, hingga AI Prompt Pack.",
      count: "15 Template",
      href: "/katalog?type=DIGITAL_PRODUCT",
      icon: FileText,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60",
    },
    {
      title: "Jasa Digitalisasi & AI",
      desc: "15 Layanan profesional pembuatan website, otomasi proses bisnis, dashboard data, dan RAG Chatbot.",
      count: "15 Layanan",
      href: "/katalog?type=BUSINESS_SERVICE",
      icon: Briefcase,
      color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60",
    },
    {
      title: "Les Privat Fleksibel",
      desc: "Bimbingan 1-on-1 bersama mentor ahli. Format tatap muka di lokasi atau daring interaktif.",
      count: "Konsultasi Terarah",
      href: "/les-privat",
      icon: UserCheck,
      color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60",
    },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-muted/20 to-background pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Storefront Resmi Terintegrasi &middot; 45 Listing Solusi Siap Jelajah</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            Tingkatkan Skill Digital & Transformasi Bisnis Bersama{" "}
            <span className="text-primary bg-clip-text">Joomha Education</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Platform komprehensif Indonesia untuk kursus online mandiri terarah, aset produktivitas digital siap pakai, dan pendampingan solusi digitalisasi bisnis terpercaya.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-base shadow-md">
              <Link href="/katalog">
                <span>Jelajahi 45 Katalog</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-primary/30 hover:bg-primary/5">
              <Link href="/konsultan-ai" className="gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Tanya Konsultan AI</span>
              </Link>
            </Button>
          </div>

          {/* Quick Stats Badges */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-muted/60 mt-10">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold text-foreground">15</div>
              <div className="text-xs text-muted-foreground font-medium">Kursus Online Mandiri</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold text-foreground">15</div>
              <div className="text-xs text-muted-foreground font-medium">Produk & Template Digital</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold text-foreground">15</div>
              <div className="text-xs text-muted-foreground font-medium">Layanan Solusi Digital</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold text-foreground">1-on-1</div>
              <div className="text-xs text-muted-foreground font-medium">Mentoring Les Privat</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Empat Jalur Layanan Utama */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Empat Ekosistem Layanan Kami
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Pilih jalur pembelajaran atau akselerasi bisnis sesuai dengan fase kebutuhan Anda saat ini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillarCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} border shadow-inner`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                      {card.count}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Lihat Katalog</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Produk & Layanan Unggulan */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Pilihan Editor
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Katalog Unggulan Terfavorit
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rekomendasi kursus populer, template efisiensi kerja, dan solusi transformasi digital bisnis.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/katalog" className="gap-2">
              <span>Buka Semua Katalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredItems.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* 4. Nilai Tambah & Keunggulan */}
      <section className="bg-muted/40 border-y py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Mengapa Memilih Joomha Education?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Kami merancang kurikulum dan produk langsung dari tantangan industri nyata di dunia kerja Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">Kurikulum Aplikatif & Praktis</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bebas dari teori bertele-tele. Setiap modul langsung berfokus pada studi kasus dokumen kantor, pembuatan kode aplikasi, dan automasi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">Aset & Template Siap Pakai</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hemat puluhan jam kerja dengan formula otomatis Excel, dokumen SOP perkantoran, dan prompt pack AI siap eksekusi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">Solusi Bisnis Berbasis Milestone</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Layanan jasa website, dashboard data, dan RAG AI didukung alur proposal transparan dan pendampingan sampai tuntas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Consultation & Les Privat CTA Banner */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-primary px-6 py-12 md:p-16 text-primary-foreground shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Konsultasi Cerdas & Gratis
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Belum Menemukan Kursus atau Solusi yang Cocok?
            </h2>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              Diskusikan langsung dengan <strong>Konsultan AI Joomha</strong> untuk rekomendasi kurikulum personal, atau ajukan les privat privat tatap muka/daring bersama mentor kami.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="secondary" className="font-bold shadow-md">
                <Link href="/konsultan-ai">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Bicara dengan Konsultan AI
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold">
                <Link href="/les-privat">
                  Ajukan Les Privat 1-on-1
                </Link>
              </Button>
            </div>
          </div>

          {/* Decorative background circle */}
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
}

