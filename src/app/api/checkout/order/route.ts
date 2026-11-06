import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  checkoutService,
  orderService,
  CreateCheckoutOrderSchema,
} from "@/modules/commerce";

const GUEST_CART_COOKIE = "joomha_cart_session";

/**
 * POST /api/checkout/order
 * Creates an immutable order, snapshots items, and initiates payment intent.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCheckoutOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasi checkout gagal",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(GUEST_CART_COOKIE)?.value;

    const result = await checkoutService.createCheckoutOrder(
      { sessionId },
      parsed.data
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[Checkout API Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memproses pesanan checkout",
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/checkout/order?orderNumber=ORD-XXXXX&email=user@example.com
 * Fetches order details.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber") || searchParams.get("orderId");
    const email = searchParams.get("email");

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Nomor pesanan wajib disertakan" },
        { status: 400 }
      );
    }

    const order = await orderService.getOrderByIdForCustomer(orderNumber, {
      email: email || undefined,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error("[Order Detail API Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal memuat data pesanan" },
      { status: 500 }
    );
  }
}
