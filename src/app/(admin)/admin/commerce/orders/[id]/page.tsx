import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  Activity, 
  Sparkles
} from "lucide-react";
import { orderService } from "@/modules/commerce";
import { Button } from "@/components/ui/button";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await orderService.getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400";
      case "PENDING":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400";
      case "EXPIRED":
        return "bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400";
      case "REFUNDED":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/commerce/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Pesanan Admin
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Audit Pesanan #{order.orderNumber}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            ID Database: <span className="font-mono">{order.id}</span> • Dibuat:{" "}
            {new Date(order.createdAt).toLocaleString("id-ID")}
          </p>
        </div>

        {/* Quick Simulation Link for Pending Orders */}
        {order.status === "PENDING" && order.payments[0] && (
          <Button asChild size="sm" variant="outline" className="gap-2 text-xs">
            <Link href={order.payments[0].checkoutUrl || `/api/checkout/mock-pay?paymentNumber=${order.payments[0].paymentNumber}`}>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Buka Simulator Mock Payment
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Item Snapshots & Audit Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Snapshot Card */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Item Snapshot (Terekam Permanen)
            </h2>

            <div className="divide-y text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-foreground">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                        {item.sku || "NO-SKU"}
                      </span>
                      <span>Tipe: {item.itemType}</span>
                      <span>
                        {item.quantity} x Rp {item.unitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateway Transactions */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Transaksi Pembayaran
            </h2>

            <div className="space-y-3">
              {order.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada transaksi pembayaran tercatat.</p>
              ) : (
                order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border bg-muted/20 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">
                        {p.paymentNumber}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 font-bold ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>Provider: <span className="text-foreground capitalize">{p.provider}</span></div>
                      <div>Metode: <span className="text-foreground">{p.paymentMethod || "Default"}</span></div>
                      <div>Nominal: <span className="text-foreground font-bold">Rp {p.amount.toLocaleString("id-ID")}</span></div>
                      <div>Waktu Bayar: <span className="text-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleString("id-ID") : "-"}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Webhook Audit Log & Idempotency Events */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Riwayat Webhook & Idempotency Audit
            </h2>

            <div className="space-y-3">
              {order.auditEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada webhook callback event yang tercatat untuk pesanan ini.
                </p>
              ) : (
                order.auditEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-lg border bg-muted/10 p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-primary">
                        {evt.eventType}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(evt.receivedAt).toLocaleTimeString("id-ID")}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-[11px]">
                      Provider: <strong className="text-foreground">{evt.provider}</strong> • Event ID:{" "}
                      <span className="font-mono text-foreground">{evt.providerEventId || "-"}</span>
                    </p>

                    <div className="rounded bg-background p-2 text-[11px] font-mono text-muted-foreground border">
                      Catatan: {evt.processingNotes || "Event diproses"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Customer & Totals */}
        <div className="space-y-6">
          {/* Totals Card */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs shadow-sm">
            <h3 className="font-bold text-foreground text-sm">Rekapitulasi Keuangan</h3>
            <div className="space-y-2 border-b pb-3 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground">Rp {order.subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Diskon:</span>
                <span className="font-semibold text-emerald-600">- Rp {order.discountAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak:</span>
                <span className="font-semibold text-foreground">Rp {order.taxAmount.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex justify-between pt-1 text-sm font-bold">
              <span className="text-foreground">Total Order:</span>
              <span className="text-primary font-black text-base">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Customer Metadata Card */}
          <div className="rounded-xl border bg-card p-5 space-y-3 text-xs shadow-sm">
            <h3 className="font-bold text-foreground text-sm">Profil Pelanggan</h3>
            <div className="space-y-1.5 text-muted-foreground">
              <p><strong className="text-foreground">Nama:</strong> {order.customerName}</p>
              <p><strong className="text-foreground">Email:</strong> {order.customerEmail}</p>
              <p><strong className="text-foreground">No. Telepon:</strong> {order.customerPhone || "-"}</p>
              <p><strong className="text-foreground">User ID:</strong> {order.userId || "Tamu / Guest"}</p>
            </div>
          </div>

          {/* Source Attribution */}
          <div className="rounded-xl border bg-card p-5 space-y-2 text-xs shadow-sm">
            <h3 className="font-bold text-foreground text-sm">Sumber Pesanan</h3>
            <div className="space-y-1 text-muted-foreground">
              <p>Tipe Sumber: <strong className="text-foreground">{order.sourceType}</strong></p>
              {order.sourceReferenceId && (
                <p>Ref ID: <span className="font-mono text-foreground">{order.sourceReferenceId}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
