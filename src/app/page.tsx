import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="z-10 max-w-4xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Fondasi Siap &middot; Next.js 15 &middot; React 19 &middot; Tailwind &middot; Prisma 6
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Joomha <span className="text-primary">Education</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Platform Digital Learning & Business Solutions. Menggabungkan kursus online, produk
            digital, les privat terarah, dan transformasi digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
            <h3 className="font-semibold text-base">E-Commerce & LMS</h3>
            <p className="text-sm text-muted-foreground">
              Katalog kursus, produk digital instan, modul materi bertingkat, evaluasi/quiz, dan sertifikat digital terverifikasi.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
            <h3 className="font-semibold text-base">Les Privat Fleksibel</h3>
            <p className="text-sm text-muted-foreground">
              Format tatap muka offline, daring interaktif, atau hybrid dengan estimasi biaya dinamis dan konfirmasi jadwal real-time.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
            <h3 className="font-semibold text-base">Jasa Digitalisasi & AI</h3>
            <p className="text-sm text-muted-foreground">
              Konsultasi transformasi bisnis, proposal bertahap berbasis milestone, dan asisten cerdas AI bertenaga OpenRouter RAG.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button asChild size="lg">
            <Link href="/katalog">Jelajahi Katalog</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/konsultan-ai">Tanya Konsultan AI</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

