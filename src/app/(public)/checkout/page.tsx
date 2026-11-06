"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowLeft, 
  Loader2, 
  Lock
} from "lucide-react";
import { CartDTO } from "@/modules/commerce/types";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mock_instant");

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch("/api/checkout/cart");
        const json = await res.json();
        if (json.success) {
          setCart(json.data);
          if (json.data.items.length === 0) {
            router.push("/cart");
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail checkout");
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert("Nama dan Email wajib diisi untuk pengiriman lisensi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
          notes: notes || undefined,
          paymentMethod,
        }),
      });

      const json = await res.json();

      if (json.success && json.data.checkoutUrl) {
        // Redirect to payment provider checkout page (Mock or live)
        window.location.href = json.data.checkoutUrl;
      } else {
        setError(json.error || "Gagal memproses pesanan checkout");
        setSubmitting(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Menyiapkan halaman checkout Anda...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const summary = cart?.summary;

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Keranjang
        </Link>
      </div>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
          <Lock className="h-6 w-6 text-primary" />
          Checkout Pembayaran Aman
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Lengkapi data pemesan untuk menerima akses instan materi dan invoice resmi.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Customer Form & Payment Method */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Details Form */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              1. Informasi Pemesan
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Ahmad Jumhadi"
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com (Lisensi dikirim ke email ini)"
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nomor WhatsApp / Telepon (Opsional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan untuk pesanan atau instruktur..."
                  className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              2. Metode Pembayaran
            </h2>

            <div className="space-y-2.5">
              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  paymentMethod === "mock_instant"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mock_instant"
                  checked={paymentMethod === "mock_instant"}
                  onChange={() => setPaymentMethod("mock_instant")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      Simulasi Gateway (Mock Instant)
                    </span>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      Development Mode
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pengujian alur transaksi instan tanpa saldo uang sungguhan.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  paymentMethod === "qris"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qris"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground">
                    QRIS & E-Wallet (GoPay, OVO, ShopeePay)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Scan kode QRIS instan dari seluruh aplikasi mobile banking atau dompet digital.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  paymentMethod === "bank_transfer"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() => setPaymentMethod("bank_transfer")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground">
                    Virtual Account Bank (BCA, Mandiri, BRI, BNI)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Pembayaran transfer otomatis tanpa konfirmasi manual.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Order Items Review & Pay Button */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm text-xs">
            <h3 className="font-bold text-foreground text-sm">Rincian Pesanan</h3>

            <div className="divide-y max-h-60 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="py-2.5 flex justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground line-clamp-1">{it.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {it.quantity} x Rp {it.unitPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="font-bold text-foreground shrink-0">
                    Rp {it.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground font-semibold">
                  Rp {summary?.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              {Number(summary?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Promo</span>
                  <span>- Rp {summary?.discountTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Biaya Transaksi</span>
                <span className="text-foreground font-semibold">Gratis</span>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-foreground">Total Bayar:</span>
              <span className="font-black text-lg text-primary">
                Rp {summary?.finalTotal.toLocaleString("id-ID")}
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full justify-center gap-2 font-bold shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Bayar Sekarang</span>
                </>
              )}
            </Button>

            <div className="pt-2 text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Garansi transaksi aman Joomha Education</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
