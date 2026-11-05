import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Joomha Education — Digital Learning & Business Solutions",
    template: "%s | Joomha Education",
  },
  description:
    "Platform edukasi, kursus online, produk digital, les privat, dan layanan digitalisasi bisnis terintegrasi.",
  keywords: [
    "Joomha Education",
    "Kursus Online",
    "Les Privat",
    "Produk Digital",
    "Digitalisasi Bisnis",
    "LMS Indonesia",
  ],
  authors: [{ name: "Joomha Education" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}

