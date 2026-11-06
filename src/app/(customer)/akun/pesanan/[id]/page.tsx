import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Download, 
  GraduationCap, 
  CreditCard,
  FileText,
  ShieldCheck,
  Receipt
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { checkoutService } from "@/modules/commerce";
import { Button } from "@/components/ui/button";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orderRecord = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      refunds: true,
      entitlements: true,
    },
  });

  if (!orderRecord) {
    notFound();
  }

  const order = checkoutService.mapOrderToDetailDTO(orderRecord);
  const primaryPayment = order.payments[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return {
          label: "LUNAS / BERHASIL",
          desc: "Pembayaran Anda telah terverifikasi resmi oleh sistem.",
          icon: CheckCircle2,
          classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
        };
      case "PENDING":
        return {
          label: "MENUNGGU PEMBAYARAN",
          desc: "Silakan selesaikan pembayaran sebelum batas waktu berakhir.",
          icon: Clock,
          classes: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
        };
      case "CANCELLED":
        return {
          label: "DIBATALKAN",
          desc: "Transaksi ini telah dibatalkan.",
          icon: XCircle,
          classes: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400",
        };
      case "EXPIRED":
        return {
          label: "KEDALUWARSA",
          desc: "Batas waktu pembayaran pesanan telah habis.",
          icon: AlertCircle,
          classes: "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400",
        };
      default:
        return {
          label: status,
          desc: "Status transaksi saat ini.",
          icon: Clock,
          classes: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const statusInfo = getStatusBadge(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/akun/pesanan"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Pesanan
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Pesanan #{order.orderNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo.classes}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dibuat pada{" "}
            {new Date(order.createdAt).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Action Button if Pending */}
        {order.status === "PENDING" && primaryPayment?.checkoutUrl && (
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-md">
            <Link href={primaryPayment.checkoutUrl}>
              <CreditCard className="h-4 w-4" />
              Lanjutkan Pembayaran
            </Link>
          </Button>
        )}
      </div>

      {/* Main Grid: Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Entitlements */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items Snapshot Card */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Rincian Item yang Dipesan
            </h2>

            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                        {item.itemType === "DIGITAL_PRODUCT" ? "Produk Digital" : item.itemType === "SELF_PACED_COURSE" ? "Kelas Online" : item.itemType}
                      </span>
                      <span>
                        {item.quantity} x Rp {item.unitPrice.toLocaleString("id-ID")}
                      </span>
                      {item.discountAmount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          (Hemat Rp {item.discountAmount.toLocaleString("id-ID")})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground shrink-0">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* If Paid: Digital Product Downloads & LMS access */}
          {order.status === "PAID" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <h2 className="font-bold text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Akses Produk & Layanan Anda
              </h2>

              <p className="text-xs text-muted-foreground">
                Pembayaran Anda telah sukses. Berikut adalah akses file atau link kelas Anda:
              </p>

              {/* Digital Entitlements */}
              {order.entitlements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Aset Digital Siap Unduh
                  </span>
                  {order.entitlements.map((ent) => (
                    <div
                      key={ent.id}
                      className="flex items-center justify-between rounded-lg border bg-background p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-xs text-foreground">
                            {ent.itemTitle}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            Akses Resmi Terverifikasi
                          </span>
                        </div>
                      </div>

                      {ent.assetDownloadUrl ? (
                        <Button asChild size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                          <a href={ent.assetDownloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5 text-primary" />
                            Unduh File
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">File sedang disiapkan</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Course items LMS link */}
              {order.items.some((it) => it.itemType === "SELF_PACED_COURSE") && (
                <div className="pt-2">
                  <Button asChild className="gap-2 w-full sm:w-auto" size="sm">
                    <Link href="/belajar">
                      <GraduationCap className="h-4 w-4" />
                      Buka Dashboard Kelas (LMS)
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Payment & Audit Info */}
          {primaryPayment && (
            <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm text-xs">
              <h3 className="font-bold text-foreground">Informasi Pembayaran</h3>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>Provider:</div>
                <div className="font-semibold text-foreground capitalize">{primaryPayment.provider}</div>
                <div>Metode Bayar:</div>
                <div className="font-semibold text-foreground uppercase">{primaryPayment.paymentMethod || "Instant Mock"}</div>
                <div>ID Transaksi:</div>
                <div className="font-mono text-foreground">{primaryPayment.paymentNumber}</div>
                <div>Waktu Pelunasan:</div>
                <div className="text-foreground">
                  {primaryPayment.paidAt
                    ? new Date(primaryPayment.paidAt).toLocaleString("id-ID")
                    : "-"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Cost Summary & Customer Info */}
        <div className="space-y-6">
          {/* Cost Summary Card */}
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm text-sm">
            <h3 className="font-bold text-foreground">Ringkasan Biaya</h3>
            <div className="space-y-2 border-b pb-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal Item</span>
                <span className="text-foreground font-medium">
                  Rp {order.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Potongan Diskon</span>
                  <span>- Rp {order.discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Pajak / Biaya Layanan</span>
                <span className="text-foreground font-medium">Rp 0</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-foreground">Total Pembayaran</span>
              <span className="text-lg font-black text-primary">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm text-xs">
            <h3 className="font-bold text-foreground">Data Pemesan</h3>
            <div className="space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">{order.customerName}</p>
              <p>{order.customerEmail}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
            </div>
            {order.notes && (
              <div className="border-t pt-2 mt-2">
                <span className="text-muted-foreground">Catatan:</span>
                <p className="italic text-foreground mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Security & Guarantee Note */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Jaminan Keamanan Joomha
            </div>
            <p>
              Transaksi Anda dilindungi sistem enkripsi mutakhir. Seluruh hak akses kursus dan unduhan aset aktif selamanya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

