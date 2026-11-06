import crypto from "crypto";
import { PaymentProvider } from "./payment-provider.interface";
import {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  WebhookVerificationResult,
  NormalizedPaymentEvent,
  PaymentStatusQueryResult,
  RefundParams,
  RefundResult,
  CancelParams,
  CancelResult,
  PaymentStatus,
} from "../types";

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = "mock";
  private secretKey: string;

  constructor(secretKey: string = process.env.AUTH_SECRET || "mock-secret-key-joomha") {
    this.secretKey = secretKey;
  }

  public isConfigured(): boolean {
    return true;
  }

  public async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const paymentNumber = `PAY-${dateStr}-${randomSuffix}`;
    const providerTransactionId = `mock_tx_${timestamp}_${randomSuffix.toLowerCase()}`;

    // Generate mock token for tamper-proof simulation link
    const signature = this.generateMockSignature(
      paymentNumber,
      params.orderNumber,
      params.amount
    );

    const checkoutUrl = `/api/checkout/mock-pay?paymentNumber=${encodeURIComponent(
      paymentNumber
    )}&orderNumber=${encodeURIComponent(
      params.orderNumber
    )}&amount=${params.amount}&sig=${encodeURIComponent(signature)}`;

    return {
      provider: this.name,
      paymentNumber,
      providerTransactionId,
      checkoutUrl,
      status: "PENDING",
      rawResponse: {
        provider: "mock",
        transactionId: providerTransactionId,
        paymentNumber,
        orderNumber: params.orderNumber,
        amount: params.amount,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public async verifyWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<WebhookVerificationResult> {
    if (!payload || typeof payload !== "object") {
      return { isValid: false, reason: "Payload must be a non-null object" };
    }

    const body = payload as Record<string, unknown>;
    const paymentNumber = String(body.paymentNumber ?? "");
    const orderNumber = String(body.orderNumber ?? "");
    const amount = Number(body.amount ?? 0);
    const signature = String(headers["x-mock-signature"] || body.signature || "");

    if (!paymentNumber || !orderNumber) {
      return { isValid: false, reason: "Missing paymentNumber or orderNumber" };
    }

    // In mock mode, verify signature match
    const expectedSig = this.generateMockSignature(paymentNumber, orderNumber, amount);
    if (signature && (signature === expectedSig || signature === this.secretKey)) {
      return { isValid: true };
    }

    // Allow unsigned webhook only if explicitly allowed in environment
    if (!signature && process.env.ALLOW_UNSIGNED_MOCK_WEBHOOK === "true") {
      return { isValid: true };
    }

    return {
      isValid: false,
      reason: "Invalid mock payment webhook signature",
    };
  }

  public normalizeWebhookEvent(rawPayload: unknown): NormalizedPaymentEvent {
    const body = (rawPayload ?? {}) as Record<string, unknown>;
    const eventId = String(
      body.eventId || body.providerEventId || `mock_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    );
    const paymentNumber = String(body.paymentNumber || "");
    const orderNumber = String(body.orderNumber || "");
    const amount = Number(body.amount ?? 0);
    const currency = String(body.currency || "IDR");
    const rawStatus = String(body.status || "PAID").toUpperCase();

    let status: PaymentStatus = "PENDING";
    if (["PAID", "SETTLEMENT", "SUCCESS", "CAPTURE"].includes(rawStatus)) {
      status = "PAID";
    } else if (["FAILED", "DENY", "CANCELLED", "CANCEL"].includes(rawStatus)) {
      status = "FAILED";
    } else if (["EXPIRED", "EXPIRE"].includes(rawStatus)) {
      status = "EXPIRED";
    } else if (["REFUNDED", "REFUND"].includes(rawStatus)) {
      status = "REFUNDED";
    }

    return {
      provider: this.name,
      providerEventId: eventId,
      providerTransactionId: String(body.providerTransactionId || `mock_tx_${paymentNumber}`),
      paymentNumber,
      orderNumber,
      eventType: String(body.eventType || `payment.${status.toLowerCase()}`),
      status,
      amount,
      currency,
      paidAt: status === "PAID" ? new Date() : undefined,
      rawPayload,
    };
  }

  public async queryPaymentStatus(
    providerTransactionId: string
  ): Promise<PaymentStatusQueryResult | null> {
    return {
      provider: this.name,
      providerTransactionId,
      status: "PAID",
      amount: 0,
      paidAt: new Date(),
      rawResponse: { simulated: true, providerTransactionId },
    };
  }

  public async refund(params: RefundParams): Promise<RefundResult> {
    const refundId = `mock_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      success: true,
      providerRefundId: refundId,
      status: "COMPLETED",
      message: `Simulated refund of Rp ${params.amount.toLocaleString("id-ID")} approved. Reason: ${params.reason}`,
    };
  }

  public async cancel(params: CancelParams): Promise<CancelResult> {
    return {
      success: true,
      message: `Simulated payment cancelled: ${params.paymentNumber}. Reason: ${params.reason ?? "Customer cancelled"}`,
    };
  }

  public generateMockSignature(
    paymentNumber: string,
    orderNumber: string,
    amount: number
  ): string {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(`${paymentNumber}:${orderNumber}:${amount}`)
      .digest("hex");
  }
}
