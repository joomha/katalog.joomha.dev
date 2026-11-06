import Link from "next/link";
import { Metadata } from "next";
import { 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Monitor, 
  RefreshCw, 
  ChevronRight,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Les Privat 1-on-1 Terarah & Fleksibel | Joomha Education",
  description:
    "Layanan bimbingan belajar les privat personal untuk Microsoft Office, coding/pemrograman, AI, dan digitalisasi bisnis. Format tatap muka, daring, atau hybrid.",
};

export default function LesPrivatPage() {
  const formats = [
    {
      title: "Tatap Muka (Offline)",
      desc: "Mentor hadir langsung ke lokasi Anda atau ruang belajar mitra. Fokus maksimal dengan bimbingan langsung.",
      icon: MapPin,
      badge: "Intensif Langsung",
    },
    {
      title: "Daring (Online Interaktif)",
      desc: "Sesi live 1-on-1 melalui Google Meet / Zoom dengan live screen-sharing, code review, dan rekaman sesi.",
      icon: Monitor,
      badge: "Fleksibel Dimana Saja",
    },
    {
      title: "Hybrid (Kombinasi)",
      desc: "Gabungan sesi tatap muka untuk pemahaman konsep awal dan sesi daring untuk praktik pendampingan berkala.",
      icon: RefreshCw,
      badge: "Paling Populer",
    },
  ];

  const topics = [
    {
      title: "Microsoft Office & Administrasi",
      items: ["Formula & Dashboard Excel Lanjutan", "Otomasi Macro & VBA", "Format Surat & Laporan Word", "Presentasi Bisnis PowerPoint"],
    },
    {
      title: "Pemrograman & Web Dev",
      items: ["Python Fundamental & Scripting", "C++ Pemula & Struktur Data", "Modern Web (HTML, CSS, JS, React)", "Mobile App Flutter/React Native"],
    },
    {
      title: "Artificial Intelligence & Otomasi",
      items: ["Prompt Engineering Terapan", "Implementasi AI Perkantoran", "Pembuatan Bot & Workflow Otomatis", "Dasar Machine Learning"],
    },
    {
      title: "Bisnis & Keuangan Digital",
      items: ["Pembukuan Kas & Penjualan", "Penyusunan Proposal & Presentasi", "Strategi Konten & Social Media", "Dashboard Finansial UMKM"],
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Les Privat</span>
      </nav>

      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
          <UserCheck className="h-3.5 w-3.5" />
          Bimbingan Personal 1-on-1
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
          Les Privat Terarah Sesuai Kebutuhan Belajar Anda
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          Belajar dengan kecepatan Anda sendiri. Kami mencocokkan materi, jadwal, dan instruktur berpengalaman sesuai tingkat pemahaman awal Anda.
        </p>
      </div>

      {/* 3 Format Pilihan */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-center">
          Pilihan Format Belajar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Materi yang Tersedia */}
      <div className="space-y-6 rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Topik Pembelajaran Favorit
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Materi dapat disesuaikan dengan kebutuhan tugas sekolah, kuliah, maupun pekerjaan kantor Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {topics.map((top) => (
            <div key={top.title} className="rounded-xl border bg-muted/20 p-5 space-y-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {top.title}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {top.items.map((it, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Langkah Mudah Memulai */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground text-center">
          Alur Pendaftaran Les Privat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center space-y-2">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-foreground">Konsultasi Awal</h4>
            <p className="text-xs text-muted-foreground">Sampaikan topik, level, dan target yang ingin dicapai.</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center space-y-2">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-foreground">Pencocokan Mentor</h4>
            <p className="text-xs text-muted-foreground">Kami menugaskan instruktur spesialis di bidang terkait.</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center space-y-2">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-foreground">Penetapan Jadwal</h4>
            <p className="text-xs text-muted-foreground">Pilih hari dan jam yang sesuai dengan kesibukan Anda.</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center space-y-2">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              4
            </div>
            <h4 className="font-bold text-sm text-foreground">Sesi Dimulai</h4>
            <p className="text-xs text-muted-foreground">Mulai belajar dengan studi kasus dan evaluasi berkala.</p>
          </div>
        </div>
      </div>

      {/* Konsultasi & Action Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <h3 className="text-2xl font-bold text-foreground">Siap Memulai Bimbingan Privat?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Diskusikan kebutuhan Anda dengan Konsultan AI kami untuk rekomendasi silabus kilat, atau langsung chat tim admin kami.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2 shadow-sm">
            <Link href="/konsultan-ai">
              <Sparkles className="h-4 w-4" />
              Tanya Konsultan AI
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="https://wa.me/?text=Halo%20Joomha,%20saya%20ingin%20tanya%20mengenai%20layanan%20Les%20Privat">
              <Send className="h-4 w-4 text-emerald-600" />
              Chat WhatsApp
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

