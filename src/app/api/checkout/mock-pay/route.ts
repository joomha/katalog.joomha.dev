import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { paymentService } from "@/modules/commerce";

/**
 * GET /api/checkout/mock-pay
 * Displays an interactive simulation page for developers and testers to trigger payment outcomes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentNumber = searchParams.get("paymentNumber") || "";
  const orderNumber = searchParams.get("orderNumber") || "";
  const amountStr = searchParams.get("amount") || "0";

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(paymentNumber ? [{ paymentNumber }] : []),
        ...(orderNumber ? [{ order: { orderNumber } }] : []),
      ],
    },
    include: { order: true },
  });

  const resolvedAmount = payment ? Number(payment.amount) : Number(amountStr);
  const resolvedPaymentNo = payment?.paymentNumber || paymentNumber;
  const resolvedOrderNo = payment?.order?.orderNumber || orderNumber;
  const currentStatus = payment?.status || "PENDING";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulasi Mock Payment - Joomha Education</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #3b82f6; color: white; margin-bottom: 16px; }
    .badge.paid { background: #10b981; }
    .badge.failed { background: #ef4444; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
    p { color: #94a3b8; font-size: 14px; margin: 0 0 24px 0; }
    .details { background: #0f172a; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #334155; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .details-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #e2e8f0; }
    .amount { font-size: 20px; font-weight: 800; color: #38bdf8; }
    .btn { display: block; width: 100%; padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s; margin-bottom: 10px; text-align: center; text-decoration: none; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-warning:hover { background: #d97706; }
    .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
    .btn-outline:hover { background: #334155; }
    .alert { padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; display: none; }
    .alert-success { background: #064e3b; color: #6ee7b7; border: 1px solid #047857; }
    .alert-danger { background: #7f1d1d; color: #fca5a5; border: 1px solid #b91c1c; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge ${currentStatus === "PAID" ? "paid" : currentStatus === "FAILED" ? "failed" : ""}">${currentStatus}</span>
    <h1>Simulasi Gateway Pembayaran (Mock)</h1>
    <p>Lingkungan pengujian transaksi aman tanpa uang sungguhan.</p>

    <div class="details">
      <div class="details-row">
        <span class="label">Nomor Pesanan</span>
        <span class="value">${resolvedOrderNo || "-"}</span>
      </div>
      <div class="details-row">
        <span class="label">Nomor Transaksi</span>
        <span class="value">${resolvedPaymentNo || "-"}</span>
      </div>
      <div class="details-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #1e293b;">
        <span class="label">Total Pembayaran</span>
        <span class="amount">Rp ${resolvedAmount.toLocaleString("id-ID")}</span>
      </div>
    </div>

    <div id="alertBox" class="alert"></div>

    <div id="actionButtons">
      ${
        currentStatus === "PAID"
          ? `<a href="/akun/pesanan/${resolvedOrderNo}" class="btn btn-success">Buka Pesanan Anda (Sudah Lunas)</a>`
          : `
        <button onclick="triggerSimulate('PAID')" class="btn btn-success">Simulasi Bayar Berhasil (Instant Success)</button>
        <button onclick="triggerSimulate('FAILED')" class="btn btn-danger">Simulasi Pembayaran Gagal / Ditolak</button>
        <button onclick="triggerSimulate('EXPIRED')" class="btn btn-warning">Simulasi Waktu Habis (Expired)</button>
        <button onclick="triggerSimulate('CANCELLED')" class="btn btn-outline">Simulasi Pembatalan Transaksi</button>
      `
      }
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="/katalog" style="color: #64748b; font-size: 12px; text-decoration: none;">&larr; Kembali ke Katalog Joomha</a>
    </div>
  </div>

  <script>
    async function triggerSimulate(status) {
      const alertBox = document.getElementById('alertBox');
      alertBox.style.display = 'none';
      
      try {
        const res = await fetch('/api/checkout/mock-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentNumber: '${resolvedPaymentNo}',
            action: status
          })
        });
        const data = await res.json();
        
        if (data.success) {
          alertBox.className = 'alert alert-success';
          alertBox.textContent = 'Status pembayaran berhasil disimulasikan: ' + status + '. Mengalihkan...';
          alertBox.style.display = 'block';
          setTimeout(() => {
            window.location.href = '/akun/pesanan/${resolvedOrderNo}';
          }, 1200);
        } else {
          alertBox.className = 'alert alert-danger';
          alertBox.textContent = data.error || 'Simulasi gagal';
          alertBox.style.display = 'block';
        }
      } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = err.message || 'Koneksi error';
        alertBox.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * POST /api/checkout/mock-pay
 * Executes a simulated payment action.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentNumber, action } = body;

    if (!paymentNumber || !action) {
      return NextResponse.json(
        { success: false, error: "paymentNumber and action ('PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED') are required" },
        { status: 400 }
      );
    }

    const result = await paymentService.simulateMockPayment(paymentNumber, action);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[Mock Pay Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Simulasi pembayaran gagal" },
      { status: 500 }
    );
  }
}
