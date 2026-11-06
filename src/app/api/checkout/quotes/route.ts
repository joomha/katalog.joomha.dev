import { NextRequest, NextResponse } from "next/server";
import { orderService, QuoteToPaymentSchema } from "@/modules/commerce";

/**
 * POST /api/checkout/quotes
 * Converts an approved tutoring quote or business proposal into an invoice/payment session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = QuoteToPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasi penawaran gagal",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const result = await orderService.createPaymentForApprovedQuote(parsed.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[Quote to Payment API Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal membuat invoice penawaran" },
      { status: 400 }
    );
  }
}
