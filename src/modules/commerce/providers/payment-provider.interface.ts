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
} from "../types";

export interface PaymentProvider {
  /** Unique provider name/identifier (e.g. 'mock', 'midtrans') */
  readonly name: string;

  /** True if provider is properly configured with valid credentials */
  isConfigured(): boolean;

  /** Creates a payment intent or checkout session for customer payment */
  createPaymentIntent(
    params: CreatePaymentIntentParams
  ): Promise<PaymentIntentResult>;

  /** Verifies incoming webhook authenticity and signature */
  verifyWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<WebhookVerificationResult>;

  /** Normalizes raw provider callback payload into standard domain event */
  normalizeWebhookEvent(rawPayload: unknown): NormalizedPaymentEvent;

  /** Queries real-time status of payment from provider API */
  queryPaymentStatus(
    providerTransactionId: string
  ): Promise<PaymentStatusQueryResult | null>;

  /** Requests a full or partial refund if supported */
  refund(params: RefundParams): Promise<RefundResult>;

  /** Cancels an uncompleted payment transaction */
  cancel(params: CancelParams): Promise<CancelResult>;
}

