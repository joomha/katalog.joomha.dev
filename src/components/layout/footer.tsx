import Link from "next/link";
import { Sparkles, Mail, MessageSquare, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base shadow-sm">
                J
              </div>
              <span className="font-bold text-lg text-foreground">
                Joomha <span className="text-primary font-black">Education</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Platform ekosistem terpadu untuk pembelajaran digital, aset produktivitas bisnis, dan solusi transformasi digital praktis di Indonesia.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Katalog Terverifikasi & Resmi</span>
            </div>
          </div>

          {/* Kolom Layanan */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Layanan & Katalog
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/katalog?type=SELF_PACED_COURSE" className="hover:text-primary transition-colors">
                  Kelas Online Mandiri (15 Kursus)
                </Link>
              </li>
              <li>
                <Link href="/katalog?type=DIGITAL_PRODUCT" className="hover:text-primary transition-colors">
                  Produk & Template Digital (15 Template)
                </Link>
              </li>
              <li>
                <Link href="/katalog?type=BUSINESS_SERVICE" className="hover:text-primary transition-colors">
                  Jasa Solusi Digitalisasi (15 Layanan)
                </Link>
              </li>
              <li>
                <Link href="/les-privat" className="hover:text-primary transition-colors">
                  Les Privat Daring / Tatap Muka
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-primary transition-colors font-medium text-foreground">
                  Semua 45 Listing Katalog &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom Bantuan & AI */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Fitur Cerdas
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/konsultan-ai" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Konsultan AI Joomha</span>
                </Link>
              </li>
              <li>
                <Link href="/katalog?category=kelas-online" className="hover:text-primary transition-colors">
                  Peta Kurikulum & Roadmaps
                </Link>
              </li>
              <li>
                <Link href="/katalog?category=jasa-digitalisasi" className="hover:text-primary transition-colors">
                  Konsultasi Bisnis & Proposal
                </Link>
              </li>
              <li>
                <Link href="/admin/catalog" className="hover:text-primary transition-colors text-xs text-muted-foreground/70">
                  Panel Katalog (Internal)
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom Kontak */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Hubungi Kami
            </h4>
            <p className="text-sm text-muted-foreground">
              Butuh konsultasi kurikulum khusus, pelatihan in-house kantor, atau paket digitalisasi kustom?
            </p>
            <div className="space-y-2 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>halo@joomha.dev</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                <span>Konsultasi WhatsApp Tersedia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Joomha Education. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <Link href="/katalog" className="hover:text-foreground">Katalog</Link>
            <Link href="/les-privat" className="hover:text-foreground">Les Privat</Link>
            <Link href="/konsultan-ai" className="hover:text-foreground">AI Konsultan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

