"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Menu, 
  X, 
  GraduationCap, 
  FileText, 
  Briefcase, 
  UserCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/katalog", label: "Semua Katalog", icon: BookOpen },
    { href: "/katalog?type=SELF_PACED_COURSE", label: "Kelas Online", icon: GraduationCap },
    { href: "/katalog?type=DIGITAL_PRODUCT", label: "Produk Digital", icon: FileText },
    { href: "/katalog?type=BUSINESS_SERVICE", label: "Jasa Digitalisasi", icon: Briefcase },
    { href: "/les-privat", label: "Les Privat", icon: UserCheck },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              J
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-tight tracking-tight text-foreground">
                Joomha <span className="text-primary font-black">Education</span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Learning & Solutions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary px-3 py-1.5 rounded-md hover:bg-muted/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Action CTAs (AI Consultant & Auth) */}
        <div className="hidden sm:flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
            <Link href="/konsultan-ai">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Tanya AI</span>
            </Link>
          </Button>

          <Button asChild size="sm">
            <Link href="/login">Masuk</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild variant="outline" size="sm" className="sm:hidden px-2 h-9 text-primary">
            <Link href="/konsultan-ai" aria-label="Tanya AI">
              <Sparkles className="h-4 w-4" />
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Buka menu navigasi</span>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b bg-background px-4 pt-2 pb-6 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full justify-center gap-2">
              <Link href="/konsultan-ai" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles className="h-4 w-4 text-primary" />
                Konsultan AI Joomha
              </Link>
            </Button>
            <Button asChild className="w-full justify-center">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Masuk / Daftar Akun
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

