import Link from "next/link";
import { 
  ShoppingBag, 
  Search, 
  ChevronRight,
  Server
} from "lucide-react";
import { orderService, getPaymentProviderStatus, OrderStatus } from "@/modules/commerce";
import { Button } from "@/components/ui/button";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const status = (params.status && params.status !== "ALL" ? params.status : undefined) as OrderStatus | undefined;
  const page = parseInt(params.page || "1", 10);

  const { data: orders, total, totalPages } = await orderService.getAdminOrders({
    search,
    status,
    page,
    limit: 15,
  });

  const providerStatus = getPaymentProviderStatus();

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
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Top Banner & Provider Health */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Manajemen Transaksi & Pesanan (Admin)
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit pesanan, rekonsiliasi pembayaran, dan inspeksi webhook event idempotency.
          </p>
        </div>

        {/* Gateway Health Indicator */}
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-xs">
          <Server className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="font-bold text-foreground">
              Provider Aktif: <span className="uppercase text-primary">{providerStatus.activeProvider}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {providerStatus.isMockEnabled ? "Mock Sandbox Siap Digunakan" : "Mode Live Gateway"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form method="GET" className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Cari nomor order, email, nama..."
              className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Cari
          </Button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {["ALL", "PAID", "PENDING", "CANCELLED", "EXPIRED", "REFUNDED"].map((st) => (
            <Link
              key={st}
              href={`/admin/commerce/orders?status=${st}${search ? `&search=${search}` : ""}`}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors border ${
                (params.status || "ALL") === st
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {st === "ALL" ? "Semua Status" : st}
            </Link>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Nomor Order</th>
                <th className="px-5 py-3 font-semibold">Pelanggan</th>
                <th className="px-5 py-3 font-semibold">Item & Tipe</th>
                <th className="px-5 py-3 font-semibold">Total Nilai</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Waktu Dibuat</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    Tidak ada data pesanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                      {o.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground">{o.customerName}</div>
                      <div className="text-muted-foreground text-[11px]">{o.customerEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-foreground">{o.itemCount} Item</span>
                      <span className="block text-[10px] text-muted-foreground uppercase">{o.sourceType}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      Rp {o.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full border px-2 py-0.5 font-bold text-[10px] ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-8 gap-1">
                        <Link href={`/admin/commerce/orders/${o.id}`}>
                          <span>Detail</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
          <span>Total {total} pesanan terdaftar</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link href={`/admin/commerce/orders?page=${page - 1}${search ? `&search=${search}` : ""}${params.status ? `&status=${params.status}` : ""}`}>
                  Sebelumnya
                </Link>
              </Button>
            )}
            <span>Halaman {page} dari {totalPages}</span>
            {page < totalPages && (
              <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                <Link href={`/admin/commerce/orders?page=${page + 1}${search ? `&search=${search}` : ""}${params.status ? `&status=${params.status}` : ""}`}>
                  Berikutnya
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
