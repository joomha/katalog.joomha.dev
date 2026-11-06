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

export class MidtransPaymentProvider implements PaymentProvider {
  public readonly name = "midtrans";
  private serverKey: string;
  private clientKey: string;
  private isProduction: boolean;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  }

  public isConfigured(): boolean {
    return Boolean(this.serverKey && this.serverKey.trim().length > 5);
  }

  private getBaseUrl(): string {
    return this.isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
  }

  public async createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "MidtransPaymentProvider is disabled because MIDTRANS_SERVER_KEY is not configured. Use 'mock' provider for development."
      );
    }

    const snapEndpoint = `${this.getBaseUrl()}/snap/v1/transactions`;
    const basicAuth = Buffer.from(`${this.serverKey}:`).toString("base64");

    const payload = {
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: Math.round(params.amount),
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone || undefined,
      },
      item_details: params.items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        price: Math.round(it.unitPrice),
        quantity: it.quantity,
        name: it.title.substring(0, 50),
      })),
    };

    const response = await fetch(snapEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Midtrans create transaction failed: ${response.status} - ${errText}`);
    }

    const json = (await response.json()) as { token: string; redirect_url: string };

    const paymentNumber = `PAY-MID-${params.orderNumber}`;

    return {
      provider: this.name,
      paymentNumber,
      providerTransactionId: json.token,
      checkoutUrl: json.redirect_url,
      status: "PENDING",
      rawResponse: json as unknown as Record<string, unknown>,
    };
  }

  public async verifyWebhook(
    payload: unknown,
    _headers: Record<string, string>
  ): Promise<WebhookVerificationResult> {
    if (!this.isConfigured()) {
      return { isValid: false, reason: "Midtrans credentials are not configured" };
    }

    if (!payload || typeof payload !== "object") {
      return { isValid: false, reason: "Payload must be an object" };
    }

    const data = payload as Record<string, unknown>;
    const orderId = String(data.order_id || "");
    const statusCode = String(data.status_code || "");
    const grossAmount = String(data.gross_amount || "");
    const signatureKey = String(data.signature_key || "");

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return { isValid: false, reason: "Missing required Midtrans signature fields" };
    }

    // Midtrans official SHA512 signature formula:
    // SHA512(order_id + status_code + gross_amount + ServerKey)
    const rawSignatureString = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(rawSignatureString)
      .digest("hex");

    if (calculatedSignature.toLowerCase() !== signatureKey.toLowerCase()) {
      return { isValid: false, reason: "Midtrans signature mismatch" };
    }

    return { isValid: true };
  }

  public normalizeWebhookEvent(rawPayload: unknown): NormalizedPaymentEvent {
    const data = (rawPayload ?? {}) as Record<string, unknown>;
    const orderId = String(data.order_id || "");
    const transactionId = String(data.transaction_id || `mid_${orderId}`);
    const transactionStatus = String(data.transaction_status || "").toLowerCase();
    const fraudStatus = String(data.fraud_status || "").toLowerCase();
    const grossAmount = Number(data.gross_amount ?? 0);
    const paymentType = String(data.payment_type || "");

    let status: PaymentStatus = "PENDING";

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        status = "PENDING";
      } else if (fraudStatus === "accept") {
        status = "PAID";
      }
    } else if (transactionStatus === "settlement") {
      status = "PAID";
    } else if (["cancel", "deny"].includes(transactionStatus)) {
      status = "FAILED";
    } else if (transactionStatus === "expire") {
      status = "EXPIRED";
    } else if (["refund", "partial_refund"].includes(transactionStatus)) {
      status = "REFUNDED";
    }

    return {
      provider: this.name,
      providerEventId: transactionId,
      providerTransactionId: transactionId,
      paymentNumber: `PAY-MID-${orderId}`,
      orderNumber: orderId,
      eventType: `midtrans.${transactionStatus || "notification"}`,
      status,
      amount: grossAmount,
      currency: "IDR",
      paidAt: status === "PAID" ? new Date() : undefined,
      rawPayload: {
        ...data,
        paymentType,
      },
    };
  }

  public async queryPaymentStatus(
    providerTransactionId: string
  ): Promise<PaymentStatusQueryResult | null> {
    if (!this.isConfigured()) return null;

    const endpoint = `${this.getBaseUrl()}/v2/${providerTransactionId}/status`;
    const basicAuth = Buffer.from(`${this.serverKey}:`).toString("base64");

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const normalized = this.normalizeWebhookEvent(data);

    return {
      provider: this.name,
      providerTransactionId,
      status: normalized.status,
      amount: normalized.amount,
      paidAt: normalized.paidAt,
      rawResponse: data,
    };
  }

  public async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: "REJECTED",
        message: "Midtrans provider is not active/configured",
      };
    }

    const endpoint = `${this.getBaseUrl()}/v2/${params.providerTransactionId}/refund`;
    const basicAuth = Buffer.from(`${this.serverKey}:`).toString("base64");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        refund_key: `ref_${Date.now()}`,
        amount: Math.round(params.amount),
        reason: params.reason,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, status: "REJECTED", message: err };
    }

    const json = (await response.json()) as Record<string, unknown>;
    return {
      success: true,
      providerRefundId: String(json.id || `mid_ref_${Date.now()}`),
      status: "COMPLETED",
    };
  }

  public async cancel(params: CancelParams): Promise<CancelResult> {
    if (!this.isConfigured() || !params.providerTransactionId) {
      return { success: false, message: "Midtrans provider is not active/configured" };
    }

    const endpoint = `${this.getBaseUrl()}/v2/${params.providerTransactionId}/cancel`;
    const basicAuth = Buffer.from(`${this.serverKey}:`).toString("base64");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
    });

    return { success: response.ok };
  }
}

