import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  cartService,
  AddToCartSchema,
  UpdateCartItemQuantitySchema,
} from "@/modules/commerce";

const GUEST_CART_COOKIE = "joomha_cart_session";

async function getOrCreateSessionId(): Promise<{ sessionId: string; isNew: boolean }> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (existing) {
    return { sessionId: existing, isNew: false };
  }
  const newSessionId = `sess_${crypto.randomUUID()}`;
  return { sessionId: newSessionId, isNew: true };
}

/**
 * GET /api/checkout/cart
 * Returns current cart and summary.
 */
export async function GET(_request: NextRequest) {
  try {
    const { sessionId, isNew } = await getOrCreateSessionId();
    const cart = await cartService.getCart({ sessionId });

    const response = NextResponse.json({ success: true, data: cart });
    if (isNew) {
      response.cookies.set(GUEST_CART_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }
    return response;
  } catch (error: unknown) {
    console.error("[Cart API Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal memuat keranjang" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout/cart
 * Adds an item to the cart.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AddToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Input tidak valid",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { sessionId, isNew } = await getOrCreateSessionId();
    const updatedCart = await cartService.addItem({ sessionId }, parsed.data);

    const response = NextResponse.json({ success: true, data: updatedCart });
    if (isNew) {
      response.cookies.set(GUEST_CART_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
    return response;
  } catch (error: unknown) {
    console.error("[Cart Add Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal menambahkan item ke keranjang" },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/checkout/cart
 * Updates quantity of a cart item.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UpdateCartItemQuantitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Input tidak valid",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { sessionId } = await getOrCreateSessionId();
    const updatedCart = await cartService.updateQuantity({ sessionId }, parsed.data);

    return NextResponse.json({ success: true, data: updatedCart });
  } catch (error: unknown) {
    console.error("[Cart Update Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal mengubah jumlah item" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/checkout/cart
 * Removes a specific item (via query ?cartItemId=xxx) or clears the entire cart (via ?clear=true).
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("cartItemId");
    const clear = searchParams.get("clear");
    const { sessionId } = await getOrCreateSessionId();

    if (clear === "true") {
      await cartService.clearCart({ sessionId });
      const emptyCart = await cartService.getCart({ sessionId });
      return NextResponse.json({ success: true, data: emptyCart });
    }

    if (!cartItemId) {
      return NextResponse.json(
        { success: false, error: "Parameter cartItemId atau clear wajib diberikan" },
        { status: 400 }
      );
    }

    const updatedCart = await cartService.removeItem({ sessionId }, cartItemId);
    return NextResponse.json({ success: true, data: updatedCart });
  } catch (error: unknown) {
    console.error("[Cart Delete Error]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Gagal menghapus item dari keranjang" },
      { status: 400 }
    );
  }
}
