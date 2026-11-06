import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { checkCatalogItemPurchasability } from "@/modules/catalog";
import { cartService, CartIdentifier } from "./cart.service";
import { getPaymentProvider } from "../providers";
import {
  CreateCheckoutOrderInput,
  OrderDetailDTO,
  PaymentDTO,
  OrderStatus,
  OrderSourceType,
  PaymentStatus,
  RefundStatus,
} from "../types";

export interface CheckoutResult {
  order: OrderDetailDTO;
  payment: PaymentDTO;
  checkoutUrl: string;
}

export class CheckoutService {
  /**
   * Generates a unique, non-sequential, human-readable order number.
   * Pattern: ORD-YYYYMMDD-XXXXX (e.g. ORD-20261106-4X8KD)
   */
  public generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
    return `ORD-${dateStr}-${randomSuffix}`;
  }

  /**
   * Executes a checkout process, snapshotting order items and issuing a payment intent.
   * Calculates all prices server-side using Decimal.
   */
  public async createCheckoutOrder(
    identifier: CartIdentifier,
    input: CreateCheckoutOrderInput
  ): Promise<CheckoutResult> {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" } },
          refunds: true,
          entitlements: true,
        },
      });

      if (existingOrder) {
        const primaryPayment = existingOrder.payments[0];
        return {
          order: this.mapOrderToDetailDTO(existingOrder),
          payment: this.mapPaymentToDTO(primaryPayment),
          checkoutUrl: primaryPayment?.checkoutUrl || `/api/checkout/mock-pay?paymentNumber=${primaryPayment?.paymentNumber}`,
        };
      }
    }

    // 2. Prepare items to checkout (Direct Purchase OR from Cart)
    interface PreparedItem {
      catalogItemId: string;
      title: string;
      slug: string;
      itemType: string;
      unitPrice: Prisma.Decimal;
      discountAmount: Prisma.Decimal;
      quantity: number;
      totalPrice: Prisma.Decimal;
    }

    const preparedItems: PreparedItem[] = [];

    if (input.directItemId) {
      // Direct Purchase Mode (Beli Sekarang)
      const purchasability = await checkCatalogItemPurchasability(input.directItemId);
      if (!purchasability.canPurchase) {
        throw new Error(
          purchasability.reason || "Item ini saat ini tidak dapat dibeli langsung."
        );
      }

      const catalogItem = await prisma.catalogItem.findUnique({
        where: { id: input.directItemId },
      });
      if (!catalogItem) {
        throw new Error("Item katalog tidak ditemukan");
      }

      const isSingleQuantity =
        catalogItem.type === "SELF_PACED_COURSE" ||
        catalogItem.type === "DIGITAL_PRODUCT";

      const qty = isSingleQuantity ? 1 : Math.max(1, input.directQuantity ?? 1);
      const basePrice = catalogItem.basePrice ?? new Prisma.Decimal(0);
      const effectivePrice = catalogItem.discountPrice ? catalogItem.discountPrice : basePrice;
      const discount = catalogItem.discountPrice ? basePrice.sub(catalogItem.discountPrice) : new Prisma.Decimal(0);

      preparedItems.push({
        catalogItemId: catalogItem.id,
        title: catalogItem.title,
        slug: catalogItem.slug,
        itemType: catalogItem.type,
        unitPrice: basePrice,
        discountAmount: discount,
        quantity: qty,
        totalPrice: effectivePrice.mul(qty),
      });
    } else {
      // Cart-based Checkout Mode
      const cart = await cartService.getCart(identifier);
      if (!cart || cart.items.length === 0) {
        throw new Error("Keranjang belanja Anda masih kosong. Silakan pilih produk terlebih dahulu.");
      }

      for (const cartItem of cart.items) {
        if (!cartItem.canPurchase) {
          throw new Error(
            `Item "${cartItem.title}" tidak lagi tersedia untuk dibeli: ${cartItem.unavailableReason}`
          );
        }

        const catalogItem = await prisma.catalogItem.findUnique({
          where: { id: cartItem.catalogItemId },
        });

        if (!catalogItem) {
          throw new Error(`Item ${cartItem.title} tidak ditemukan`);
        }

        const basePrice = catalogItem.basePrice ?? new Prisma.Decimal(cartItem.unitPrice);
        const effectivePrice = catalogItem.discountPrice ? catalogItem.discountPrice : basePrice;
        const discount = catalogItem.discountPrice ? basePrice.sub(catalogItem.discountPrice) : new Prisma.Decimal(0);

        preparedItems.push({
          catalogItemId: catalogItem.id,
          title: catalogItem.title,
          slug: catalogItem.slug,
          itemType: catalogItem.type,
          unitPrice: basePrice,
          discountAmount: discount,
          quantity: cartItem.quantity,
          totalPrice: effectivePrice.mul(cartItem.quantity),
        });
      }
    }

    if (preparedItems.length === 0) {
      throw new Error("Tidak ada item yang dapat dicheckout");
    }

    // 3. Compute Totals using Decimal
    let subtotalDecimal = new Prisma.Decimal(0);
    let discountDecimal = new Prisma.Decimal(0);
    let totalDecimal = new Prisma.Decimal(0);

    for (const item of preparedItems) {
      subtotalDecimal = subtotalDecimal.add(item.unitPrice.mul(item.quantity));
      discountDecimal = discountDecimal.add(item.discountAmount.mul(item.quantity));
      totalDecimal = totalDecimal.add(item.totalPrice);
    }

    // Security guard: total cannot be negative
    if (totalDecimal.lessThan(0)) {
      totalDecimal = new Prisma.Decimal(0);
    }

    const orderNumber = this.generateOrderNumber();
    const resolvedUserId = identifier.userId || null;

    // 4. Resolve Payment Provider
    const provider = getPaymentProvider();

    // 5. Database Transaction: Order + OrderItems + Payment
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: resolvedUserId,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim().toLowerCase(),
          customerPhone: input.customerPhone?.trim() || null,
          status: "PENDING",
          currency: "IDR",
          subtotal: subtotalDecimal,
          discountAmount: discountDecimal,
          taxAmount: new Prisma.Decimal(0),
          totalAmount: totalDecimal,
          notes: input.notes?.trim() || null,
          idempotencyKey: input.idempotencyKey || null,
          sourceType: "CATALOG",
        },
      });

      // Insert item snapshots
      for (const item of preparedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            catalogItemId: item.catalogItemId,
            title: item.title,
            slug: item.slug,
            sku: `SKU-${item.slug.toUpperCase().slice(0, 15)}`,
            itemType: item.itemType,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            discountAmount: item.discountAmount,
            totalPrice: item.totalPrice,
            currency: "IDR",
          },
        });
      }

      // Initiate provider intent
      const paymentIntent = await provider.createPaymentIntent({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(totalDecimal),
        currency: "IDR",
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        paymentMethod: input.paymentMethod,
        items: preparedItems.map((p) => ({
          title: p.title,
          unitPrice: Number(p.totalPrice.div(p.quantity)),
          quantity: p.quantity,
        })),
      });

      // Save initial payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          paymentNumber: paymentIntent.paymentNumber,
          provider: provider.name,
          providerTransactionId: paymentIntent.providerTransactionId,
          paymentMethod: input.paymentMethod || "mock_instant",
          status: "PENDING",
          amount: totalDecimal,
          currency: "IDR",
          checkoutUrl: paymentIntent.checkoutUrl,
          rawResponse: (paymentIntent.rawResponse ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });

      // If checkout was from cart, empty the cart
      if (!input.directItemId && (identifier.userId || identifier.sessionId)) {
        const cart = await tx.cart.findFirst({
          where: {
            OR: [
              ...(identifier.userId ? [{ userId: identifier.userId }] : []),
              ...(identifier.sessionId ? [{ sessionId: identifier.sessionId }] : []),
            ],
          },
        });
        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      }

      return { order, payment, checkoutUrl: paymentIntent.checkoutUrl };
    });

    // Re-fetch complete order with relations for response
    const fullOrder = await prisma.order.findUniqueOrThrow({
      where: { id: result.order.id },
      include: {
        items: true,
        payments: true,
        refunds: true,
        entitlements: true,
      },
    });

    return {
      order: this.mapOrderToDetailDTO(fullOrder),
      payment: this.mapPaymentToDTO(result.payment),
      checkoutUrl: result.checkoutUrl,
    };
  }

  // Mapper helpers
  public mapOrderToDetailDTO(order: {
    id: string;
    orderNumber: string;
    userId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    status: string;
    currency: string;
    subtotal: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    notes: string | null;
    sourceType: string;
    sourceReferenceId: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      orderId: string;
      catalogItemId: string | null;
      title: string;
      slug: string | null;
      sku: string | null;
      itemType: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      discountAmount: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
      currency: string;
      metadata: unknown;
    }>;
    payments?: Array<{
      id: string;
      orderId: string;
      paymentNumber: string;
      provider: string;
      providerTransactionId: string | null;
      paymentMethod: string | null;
      status: string;
      amount: Prisma.Decimal;
      currency: string;
      checkoutUrl: string | null;
      paidAt: Date | null;
      expiredAt: Date | null;
      createdAt: Date;
    }>;
    refunds?: Array<{
      id: string;
      orderId: string;
      paymentId: string | null;
      refundNumber: string;
      amount: Prisma.Decimal;
      currency: string;
      reason: string;
      status: string;
      approvedByUserId: string | null;
      processedAt: Date | null;
      createdAt: Date;
    }>;
    entitlements?: Array<{
      id: string;
      orderId: string;
      userId: string;
      catalogItemId: string;
      itemTitle: string;
      assetDownloadUrl: string | null;
      isRevoked: boolean;
      grantedAt: Date;
      expiresAt: Date | null;
    }>;
  }): OrderDetailDTO {
    const items = (order.items || []).map((it) => ({
      id: it.id,
      orderId: it.orderId,
      catalogItemId: it.catalogItemId,
      title: it.title,
      slug: it.slug,
      sku: it.sku,
      itemType: it.itemType,
      unitPrice: Number(it.unitPrice),
      quantity: it.quantity,
      discountAmount: Number(it.discountAmount),
      totalPrice: Number(it.totalPrice),
      currency: it.currency,
      metadata: it.metadata as Record<string, unknown> | null,
    }));

    const payments = (order.payments || []).map((p) => this.mapPaymentToDTO(p));

    const refunds = (order.refunds || []).map((r) => ({
      id: r.id,
      orderId: r.orderId,
      paymentId: r.paymentId,
      refundNumber: r.refundNumber,
      amount: Number(r.amount),
      currency: r.currency,
      reason: r.reason,
      status: r.status as RefundStatus,
      approvedByUserId: r.approvedByUserId,
      processedAt: r.processedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));

    const entitlements = (order.entitlements || []).map((e) => ({
      id: e.id,
      orderId: e.orderId,
      userId: e.userId,
      catalogItemId: e.catalogItemId,
      itemTitle: e.itemTitle,
      assetDownloadUrl: e.assetDownloadUrl,
      isRevoked: e.isRevoked,
      grantedAt: e.grantedAt.toISOString(),
      expiresAt: e.expiresAt?.toISOString() || null,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status as OrderStatus,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      sourceType: order.sourceType as OrderSourceType,
      sourceReferenceId: order.sourceReferenceId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
      items,
      payments,
      refunds,
      entitlements,
    };
  }

  public mapPaymentToDTO(p: {
    id: string;
    orderId: string;
    paymentNumber: string;
    provider: string;
    providerTransactionId: string | null;
    paymentMethod: string | null;
    status: string;
    amount: Prisma.Decimal;
    currency: string;
    checkoutUrl: string | null;
    paidAt: Date | null;
    expiredAt: Date | null;
    createdAt: Date;
  }): PaymentDTO {
    return {
      id: p.id,
      orderId: p.orderId,
      paymentNumber: p.paymentNumber,
      provider: p.provider,
      providerTransactionId: p.providerTransactionId,
      paymentMethod: p.paymentMethod,
      status: p.status as PaymentStatus,
      amount: Number(p.amount),
      currency: p.currency,
      checkoutUrl: p.checkoutUrl,
      paidAt: p.paidAt?.toISOString() || null,
      expiredAt: p.expiredAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

export const checkoutService = new CheckoutService();
