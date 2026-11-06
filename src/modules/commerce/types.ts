import { z } from "zod";

// ==============================================================================
// ENUMS & CONSTANTS
// ==============================================================================

export const OrderStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSourceTypeEnum = z.enum([
  "CATALOG",
  "TUTORING_QUOTE",
  "BUSINESS_PROPOSAL",
]);
export type OrderSourceType = z.infer<typeof OrderSourceTypeEnum>;

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const RefundStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
]);
export type RefundStatus = z.infer<typeof RefundStatusEnum>;

// ==============================================================================
// CART DTOs & SCHEMAS
// ==============================================================================

export const AddToCartSchema = z.object({
  catalogItemId: z.string().min(1, "ID item katalog wajib diisi"),
  quantity: z.coerce.number().int().positive().default(1),
});
export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemQuantitySchema = z.object({
  cartItemId: z.string().min(1, "ID item keranjang wajib diisi"),
  quantity: z.coerce.number().int().min(0, "Jumlah tidak boleh negatif"),
});
export type UpdateCartItemQuantityInput = z.infer<typeof UpdateCartItemQuantitySchema>;

export interface CartItemDTO {
  id: string;
  cartId: string;
  catalogItemId: string;
  title: string;
  slug: string;
  itemType: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  canPurchase: boolean;
  unavailableReason?: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CartSummaryDTO {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  finalTotal: number;
  itemCount: number;
  currency: string;
}

export interface CartDTO {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: CartItemDTO[];
  summary: CartSummaryDTO;
  updatedAt: string;
}

// ==============================================================================
// CHECKOUT & ORDER DTOs & SCHEMAS
// ==============================================================================

export const CreateCheckoutOrderSchema = z.object({
  customerName: z.string().min(2, "Nama pemesan minimal 2 karakter"),
  customerEmail: z.string().email("Format email pemesan tidak valid"),
  customerPhone: z.string().optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().optional(),
  paymentMethod: z.string().optional().default("mock_instant"),
  // If direct checkout without cart:
  directItemId: z.string().optional(),
  directQuantity: z.coerce.number().int().positive().optional().default(1),
});
export type CreateCheckoutOrderInput = z.infer<typeof CreateCheckoutOrderSchema>;

export interface OrderItemDTO {
  id: string;
  orderId: string;
  catalogItemId: string | null;
  title: string;
  slug: string | null;
  sku: string | null;
  itemType: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
  currency: string;
  metadata?: Record<string, unknown> | null;
}

export interface PaymentDTO {
  id: string;
  orderId: string;
  paymentNumber: string;
  provider: string;
  providerTransactionId: string | null;
  paymentMethod: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  paidAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}

export interface PaymentEventDTO {
  id: string;
  paymentId: string | null;
  orderId: string | null;
  provider: string;
  providerEventId: string | null;
  eventType: string;
  isProcessed: boolean;
  processingNotes: string | null;
  receivedAt: string;
  payload: unknown;
}

export interface RefundDTO {
  id: string;
  orderId: string;
  paymentId: string | null;
  refundNumber: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  approvedByUserId: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface DigitalEntitlementDTO {
  id: string;
  orderId: string;
  userId: string;
  catalogItemId: string;
  itemTitle: string;
  assetDownloadUrl: string | null;
  isRevoked: boolean;
  grantedAt: string;
  expiresAt: string | null;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  sourceType: OrderSourceType;
  sourceReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface OrderDetailDTO extends OrderDTO {
  items: OrderItemDTO[];
  payments: PaymentDTO[];
  refunds: RefundDTO[];
  entitlements: DigitalEntitlementDTO[];
}

// ==============================================================================
// QUOTE TO PAYMENT DTOs & SCHEMAS
// ==============================================================================

export const QuoteToPaymentSchema = z.object({
  quoteId: z.string().min(1, "ID penawaran/quote wajib diisi"),
  sourceType: z.enum(["TUTORING_QUOTE", "BUSINESS_PROPOSAL"]),
  customerName: z.string().min(2, "Nama pemesan minimal 2 karakter"),
  customerEmail: z.string().email("Format email pemesan tidak valid"),
  customerPhone: z.string().optional(),
  title: z.string().min(2, "Judul penawaran wajib diisi"),
  amount: z.coerce.number().positive("Nilai pembayaran harus lebih dari 0"),
  currency: z.string().default("IDR"),
  notes: z.string().optional(),
  paymentScheduleTitle: z.string().optional(), // e.g. "Pembayaran Penuh", "Termin 1 (DP 50%)"
  metadata: z.record(z.unknown()).optional(),
});
export type QuoteToPaymentInput = z.infer<typeof QuoteToPaymentSchema>;

// ==============================================================================
// PAYMENT GATEWAY & WEBHOOK TYPES
// ==============================================================================

export interface CreatePaymentIntentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  paymentMethod?: string;
  items: {
    title: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export interface PaymentIntentResult {
  provider: string;
  paymentNumber: string;
  providerTransactionId: string;
  checkoutUrl: string;
  status: PaymentStatus;
  rawResponse?: Record<string, unknown>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  reason?: string;
}

export interface NormalizedPaymentEvent {
  provider: string;
  providerEventId: string;
  providerTransactionId?: string;
  paymentNumber?: string;
  orderNumber?: string;
  eventType: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  rawPayload: unknown;
}

export interface PaymentStatusQueryResult {
  provider: string;
  providerTransactionId: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: Date | null;
  rawResponse: unknown;
}

export interface RefundParams {
  paymentNumber: string;
  providerTransactionId?: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  providerRefundId?: string;
  status: RefundStatus;
  message?: string;
}

export interface CancelParams {
  paymentNumber: string;
  providerTransactionId?: string;
  reason?: string;
}

export interface CancelResult {
  success: boolean;
  message?: string;
}

export interface PaymentProviderStatusDTO {
  activeProvider: string;
  isMockEnabled: boolean;
  providers: {
    name: string;
    isConfigured: boolean;
    description: string;
  }[];
}

