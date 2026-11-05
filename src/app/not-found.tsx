import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <span className="text-6xl font-black text-primary/30">404</span>
        <h1 className="text-2xl font-bold tracking-tight">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia, sudah dipindahkan, atau alamat URL yang Anda masukkan salah.
        </p>
        <div className="pt-2">
          <Button asChild variant="default">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

