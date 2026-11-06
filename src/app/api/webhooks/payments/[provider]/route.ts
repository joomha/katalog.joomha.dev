import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/modules/commerce";

/**
 * Server-only payment gateway webhook endpoint.
 * Route: /api/webhooks/payments/[provider]
 *
 * Verifies authenticity, guarantees idempotency, logs audit events, and updates order/payment state.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  try {
    const rawBody = await request.text();
    let payload: unknown;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON webhook payload" },
        { status: 400 }
      );
    }

    // Extract all incoming HTTP headers into a flat map
    const headers: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const result = await paymentService.handleWebhookEvent(
      provider,
      payload,
      headers
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason || "Webhook verification or processing failed",
        },
        { status: 400 }
      );
    }

    // Return 200 OK for successful or already processed duplicate events
    return NextResponse.json({
      success: true,
      duplicate: Boolean(result.duplicate),
      ignored: Boolean(result.ignored),
      message: result.reason || "Webhook processed successfully",
      status: result.status,
    });
  } catch (error: unknown) {
    console.error(`[Webhook Error: ${provider}]`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error during webhook processing",
      },
      { status: 500 }
    );
  }
}
