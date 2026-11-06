import { cartService, CartIdentifier } from "./services/cart.service";
import { checkoutService, CheckoutResult } from "./services/checkout.service";
import { orderService } from "./services/order.service";
import { paymentService, WebhookProcessingResult } from "./services/payment.service";
import { entitlementService } from "./services/entitlement.service";
import { getPaymentProviderStatus } from "./providers";
import {
  AddToCartInput,
  CartDTO,
  CreateCheckoutOrderInput,
  DigitalEntitlementDTO,
  OrderDetailDTO,
  PaymentProviderStatusDTO,
  QuoteToPaymentInput,
  UpdateCartItemQuantityInput,
} from "./types";

export * from "./types";
export * from "./providers/payment-provider.interface";
export { cartService } from "./services/cart.service";
export { checkoutService } from "./services/checkout.service";
export { orderService } from "./services/order.service";
export { paymentService } from "./services/payment.service";
export { entitlementService } from "./services/entitlement.service";
export { getPaymentProvider, getPaymentProviderStatus } from "./providers";

// ==============================================================================
// PUBLIC MODULE CONTRACT (Agent 04)
// Required public functions for other domain agents and storefront route handlers
// ==============================================================================

/**
 * Retrieves the current cart for a user or session, with server-computed totals.
 */
export async function getCart(identifier: CartIdentifier): Promise<CartDTO> {
  return cartService.getCart(identifier);
}

/**
 * Adds an item to cart after verifying purchasability and stock status.
 */
export async function addCartItem(
  identifier: CartIdentifier,
  input: AddToCartInput
): Promise<CartDTO> {
  return cartService.addItem(identifier, input);
}

/**
 * Updates the quantity of an item in the cart.
 */
export async function updateCartItemQuantity(
  identifier: CartIdentifier,
  input: UpdateCartItemQuantityInput
): Promise<CartDTO> {
  return cartService.updateQuantity(identifier, input);
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItem(
  identifier: CartIdentifier,
  cartItemId: string
): Promise<CartDTO> {
  return cartService.removeItem(identifier, cartItemId);
}

/**
 * Clears all items in the user or guest cart.
 */
export async function clearCart(identifier: CartIdentifier): Promise<void> {
  return cartService.clearCart(identifier);
}

/**
 * Merges an anonymous guest session cart into an authenticated user's cart safely upon login.
 */
export async function mergeGuestCartToUser(
  sessionId: string,
  userId: string
): Promise<CartDTO> {
  return cartService.mergeGuestCart(sessionId, userId);
}

/**
 * Creates an immutable checkout order with item snapshots and initiates a payment session.
 */
export async function createCheckoutOrder(
  identifier: CartIdentifier,
  input: CreateCheckoutOrderInput
): Promise<CheckoutResult> {
  return checkoutService.createCheckoutOrder(identifier, input);
}

/**
 * Retrieves an order by ID or orderNumber for customer access verification.
 */
export async function getOrderByIdForCustomer(
  orderIdOrNumber: string,
  customerAuth: { userId?: string; email?: string }
): Promise<OrderDetailDTO | null> {
  return orderService.getOrderByIdForCustomer(orderIdOrNumber, customerAuth);
}

/**
 * Creates a payment order from an approved quote/proposal (Agent 06 / Agent 07).
 */
export async function createPaymentForApprovedQuote(
  input: QuoteToPaymentInput
) {
  return orderService.createPaymentForApprovedQuote(input);
}

/**
 * Processes incoming verified webhook callback event from payment gateways idempotently.
 */
export async function handleVerifiedPaymentEvent(
  providerName: string,
  rawPayload: unknown,
  headers: Record<string, string> = {}
): Promise<WebhookProcessingResult> {
  return paymentService.handleWebhookEvent(providerName, rawPayload, headers);
}

/**
 * Returns payment gateway readiness and configuration status.
 */
export function getPaymentStatusInfo(): PaymentProviderStatusDTO {
  return getPaymentProviderStatus();
}

/**
 * Retrieves digital entitlements owned by a user.
 */
export async function getUserDigitalEntitlements(
  userId: string
): Promise<DigitalEntitlementDTO[]> {
  return entitlementService.getUserDigitalEntitlements(userId);
}
