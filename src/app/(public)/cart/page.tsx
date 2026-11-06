"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { CartDTO } from "@/modules/commerce/types";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout/cart");
      const json = await res.json();
      if (json.success) {
        setCart(json.data);
      } else {
        setError(json.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat keranjang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (cartItemId: string, newQty: number) => {
    setActionLoading(cartItemId);
    try {
      const res = await fetch("/api/checkout/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, quantity: newQty }),
      });
      const json = await res.json();
      if (json.success) {
        setCart(json.data);
      } else {
        alert(json.error || "Gagal memperbarui jumlah item");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Koneksi bermasalah");
    } finally {
      setActionLoading(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setActionLoading(cartItemId);
    try {
      const res = await fetch(`/api/checkout/cart?cartItemId=${encodeURIComponent(cartItemId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setCart(json.data);
      } else {
        alert(json.error || "Gagal menghapus item");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Koneksi bermasalah");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Memuat keranjang belanja Anda...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const hasItems = items.length > 0;
  const hasUnpurchasable = items.some((it) => !it.canPurchase);

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8 max-w-5xl">
      {/* Breadcrumb & Heading */}
      <div className="mb-6 space-y-2">
        <Link
          href="/katalog"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Lanjut Belanja di Katalog
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
          <ShoppingBag className="h-6 w-6 text-primary" />
          Keranjang Belanja
        </h1>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {!hasItems ? (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Keranjang Belanja Anda Kosong</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Belum ada kelas atau produk digital yang Anda pilih. Silakan jelajahi materi unggulan kami.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/katalog">Jelajahi Katalog Sekarang</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {hasUnpurchasable && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Beberapa item dalam keranjang Anda saat ini tidak tersedia atau dalam status Segera Hadir. Harap hapus item tersebut untuk melanjutkan checkout.
                </span>
              </div>
            )}

            <div className="divide-y rounded-xl border bg-card shadow-sm">
              {items.map((item) => {
                const isSingle =
                  item.itemType === "SELF_PACED_COURSE" ||
                  item.itemType === "DIGITAL_PRODUCT";
                const isItemLoading = actionLoading === item.id;

                return (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {item.itemType === "DIGITAL_PRODUCT" ? "Produk Digital" : "Kelas Online"}
                      </span>
                      <Link
                        href={`/katalog/${item.slug}`}
                        className="font-bold text-base text-foreground hover:text-primary transition-colors block"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Rp {item.unitPrice.toLocaleString("id-ID")} per item
                      </p>

                      {!item.canPurchase && (
                        <p className="text-xs text-rose-500 font-semibold mt-1">
                          {item.unavailableReason || "Tidak tersedia saat ini"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                      {/* Quantity Controls */}
                      {!isSingle ? (
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isItemLoading || item.quantity <= 1}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isItemLoading}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          1 Lisensi
                        </span>
                      )}

                      {/* Item Total Price */}
                      <span className="font-extrabold text-sm text-foreground min-w-[100px] text-right">
                        Rp {item.totalPrice.toLocaleString("id-ID")}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={isItemLoading}
                        className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary Card */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <h2 className="font-bold text-base text-foreground">Ringkasan Belanja</h2>

              <div className="space-y-2 text-xs text-muted-foreground border-b pb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({cart?.summary.itemCount} item)</span>
                  <span className="text-foreground font-medium">
                    Rp {cart?.summary.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {Number(cart?.summary.discountTotal || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Diskon Promo</span>
                    <span>- Rp {cart?.summary.discountTotal.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak & Biaya Transaksi</span>
                  <span className="text-foreground font-medium">Gratis</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Total Investasi</span>
                <span className="text-xl font-black text-primary">
                  Rp {cart?.summary.finalTotal.toLocaleString("id-ID")}
                </span>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full justify-center gap-2 font-bold shadow-md"
                disabled={hasUnpurchasable}
              >
                <Link href="/checkout">
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Transaksi dijamin aman & terenkripsi</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
