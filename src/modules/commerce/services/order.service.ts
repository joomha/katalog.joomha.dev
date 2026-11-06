import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { checkoutService } from "./checkout.service";
import { getPaymentProvider } from "../providers";
import {
  OrderDetailDTO,
  OrderDTO,
  OrderStatus,
  OrderSourceType,
  QuoteToPaymentInput,
} from "../types";

export interface AdminOrderAuditEventDTO {
  id: string;
  paymentId: string | null;
  paymentNumber: string;
  provider: string;
  providerEventId: string | null;
  eventType: string;
  isProcessed: boolean;
  processingNotes: string | null;
  receivedAt: string;
}

export class OrderService {
  /**
   * Retrieves an order detail for a customer, verifying ownership via userId or email.
   */
  public async getOrderByIdForCustomer(
    orderIdOrNumber: string,
    customerAuth: { userId?: string; email?: string }
  ): Promise<OrderDetailDTO | null> {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        ...(customerAuth.userId || customerAuth.email
          ? {
              OR: [
                ...(customerAuth.userId ? [{ userId: customerAuth.userId }] : []),
                ...(customerAuth.email ? [{ customerEmail: customerAuth.email.toLowerCase() }] : []),
              ],
            }
          : {}),
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        refunds: true,
        entitlements: true,
      },
    });

    if (!order) return null;

    return checkoutService.mapOrderToDetailDTO(order);
  }

  /**
   * Lists order history for an authenticated customer.
   */
  public async listCustomerOrders(
    customerAuth: { userId?: string; email?: string },
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: OrderDTO[]; total: number; page: number; totalPages: number }> {
    const whereClause: Prisma.OrderWhereInput = {
      OR: [
        ...(customerAuth.userId ? [{ userId: customerAuth.userId }] : []),
        ...(customerAuth.email ? [{ customerEmail: customerAuth.email.toLowerCase() }] : []),
      ],
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
    ]);

    const data: OrderDTO[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      status: o.status as OrderStatus,
      currency: o.currency,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      taxAmount: Number(o.taxAmount),
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      sourceType: o.sourceType as OrderSourceType,
      sourceReferenceId: o.sourceReferenceId,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      itemCount: o.items.reduce((sum, it) => sum + it.quantity, 0),
    }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves orders overview for admin dashboard.
   */
  public async getAdminOrders(filters: {
    search?: string;
    status?: OrderStatus;
    sourceType?: OrderSourceType;
    page?: number;
    limit?: number;
  }): Promise<{ data: OrderDTO[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20));

    const where: Prisma.OrderWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNumber: { contains: filters.search, mode: "insensitive" } },
              { customerName: { contains: filters.search, mode: "insensitive" } },
              { customerEmail: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
    ]);

    const data: OrderDTO[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      status: o.status as OrderStatus,
      currency: o.currency,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      taxAmount: Number(o.taxAmount),
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      sourceType: o.sourceType as OrderSourceType,
      sourceReferenceId: o.sourceReferenceId,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      itemCount: o.items.reduce((sum, it) => sum + it.quantity, 0),
    }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves full admin order detail, including payment events audit log.
   */
  public async getAdminOrderDetail(orderId: string): Promise<(OrderDetailDTO & { auditEvents: AdminOrderAuditEventDTO[] }) | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
          include: { events: { orderBy: { receivedAt: "desc" } } },
        },
        refunds: { orderBy: { createdAt: "desc" } },
        entitlements: true,
      },
    });

    if (!order) return null;

    const detailDTO = checkoutService.mapOrderToDetailDTO(order);

    const auditEvents = order.payments.flatMap((p) =>
      p.events.map((e) => ({
        id: e.id,
        paymentId: e.paymentId,
        paymentNumber: p.paymentNumber,
        provider: e.provider,
        providerEventId: e.providerEventId,
        eventType: e.eventType,
        isProcessed: e.isProcessed,
        processingNotes: e.processingNotes,
        receivedAt: e.receivedAt.toISOString(),
      }))
    );

    return {
      ...detailDTO,
      auditEvents,
    };
  }

  /**
   * Creates an official invoice/payment request from an approved Tutoring Quote (Agent 06)
   * or Business Service Proposal / Milestone (Agent 07).
   */
  public async createPaymentForApprovedQuote(input: QuoteToPaymentInput) {
    if (input.amount <= 0) {
      throw new Error("Nominal pembayaran harus lebih besar dari 0");
    }

    const orderNumber = checkoutService.generateOrderNumber();
    const amountDecimal = new Prisma.Decimal(input.amount);
    const provider = getPaymentProvider();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order linked to Quote / Proposal
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim().toLowerCase(),
          customerPhone: input.customerPhone?.trim() || null,
          status: "PENDING",
          currency: input.currency || "IDR",
          subtotal: amountDecimal,
          discountAmount: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          totalAmount: amountDecimal,
          notes: input.notes?.trim() || null,
          sourceType: input.sourceType,
          sourceReferenceId: input.quoteId,
          metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });

      // 2. Snapshot as OrderItem
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          title: input.title,
          sku: `QUOTE-${input.quoteId.slice(0, 8).toUpperCase()}`,
          itemType: input.sourceType === "TUTORING_QUOTE" ? "PRIVATE_TUTORING" : "BUSINESS_SERVICE",
          unitPrice: amountDecimal,
          quantity: 1,
          discountAmount: new Prisma.Decimal(0),
          totalPrice: amountDecimal,
          currency: input.currency || "IDR",
          metadata: {
            quoteId: input.quoteId,
            scheduleTitle: input.paymentScheduleTitle || "Pembayaran Penuh",
            ...(input.metadata || {}),
          },
        },
      });

      // 3. Create Payment Intent
      const paymentIntent = await provider.createPaymentIntent({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: input.amount,
        currency: input.currency || "IDR",
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        items: [
          {
            title: input.title,
            unitPrice: input.amount,
            quantity: 1,
          },
        ],
      });

      // 4. Save Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          paymentNumber: paymentIntent.paymentNumber,
          provider: provider.name,
          providerTransactionId: paymentIntent.providerTransactionId,
          paymentMethod: "quote_invoice",
          status: "PENDING",
          amount: amountDecimal,
          currency: input.currency || "IDR",
          checkoutUrl: paymentIntent.checkoutUrl,
          rawResponse: (paymentIntent.rawResponse ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });

      return { order, payment, checkoutUrl: paymentIntent.checkoutUrl };
    });

    return {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      paymentNumber: result.payment.paymentNumber,
      checkoutUrl: result.checkoutUrl,
      amount: input.amount,
      currency: input.currency || "IDR",
      status: result.order.status,
    };
  }
}

export const orderService = new OrderService();
