import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events";
import { getPaymentProvider, MockPaymentProvider } from "../providers";
import { entitlementService } from "./entitlement.service";
import { PaymentStatus } from "../types";

export interface WebhookProcessingResult {
  success: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  reason?: string;
  orderNumber?: string;
  paymentNumber?: string;
  status?: PaymentStatus;
}

export class PaymentService {
  /**
   * Securely handles incoming payment webhook callbacks from providers.
   * Guarantees idempotency and prevents status regression (e.g. PAID -> PENDING).
   */
  public async handleWebhookEvent(
    providerName: string,
    rawPayload: unknown,
    headers: Record<string, string> = {}
  ): Promise<WebhookProcessingResult> {
    const provider = getPaymentProvider(providerName);

    // 1. Verify Webhook Signature
    const verification = await provider.verifyWebhook(rawPayload, headers);
    if (!verification.isValid) {
      console.warn(`[Commerce Webhook] Verification failed for provider ${providerName}:`, verification.reason);
      return {
        success: false,
        reason: verification.reason || "Invalid webhook signature",
      };
    }

    // 2. Normalize Event Payload
    const normalized = provider.normalizeWebhookEvent(rawPayload);

    // 3. Idempotency Check via PaymentEvent Record
    if (normalized.providerEventId) {
      const existingEvent = await prisma.paymentEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: provider.name,
            providerEventId: normalized.providerEventId,
          },
        },
      });

      if (existingEvent && existingEvent.isProcessed) {
        return {
          success: true,
          duplicate: true,
          reason: `Duplicate callback for event ID ${normalized.providerEventId} already processed`,
          orderNumber: normalized.orderNumber,
          paymentNumber: normalized.paymentNumber,
          status: normalized.status,
        };
      }
    }

    // 4. Resolve Target Payment and Order
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(normalized.paymentNumber ? [{ paymentNumber: normalized.paymentNumber }] : []),
          ...(normalized.providerTransactionId ? [{ providerTransactionId: normalized.providerTransactionId }] : []),
          ...(normalized.orderNumber ? [{ order: { orderNumber: normalized.orderNumber } }] : []),
        ],
      },
      include: {
        order: {
          include: {
            items: true,
            entitlements: true,
          },
        },
      },
    });

    if (!payment || !payment.order) {
      console.warn(`[Commerce Webhook] Payment not found for event:`, normalized);
      return {
        success: false,
        reason: `Payment or order not found for orderNumber: ${normalized.orderNumber}, paymentNumber: ${normalized.paymentNumber}`,
      };
    }

    const currentOrder = payment.order;
    const currentOrderStatus = currentOrder.status;

    // 5. State Machine Validation: Prevent regression from PAID
    if (currentOrderStatus === "PAID" && normalized.status !== "REFUNDED") {
      // Order is already paid, record audit event and ignore duplicate/late pending or failure notifications
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          orderId: currentOrder.id,
          provider: provider.name,
          providerEventId: normalized.providerEventId,
          eventType: normalized.eventType,
          payload: (rawPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          isProcessed: true,
          processingNotes: `Ignored: Order ${currentOrder.orderNumber} is already PAID. Incoming status was ${normalized.status}.`,
        },
      });

      return {
        success: true,
        ignored: true,
        reason: "Order is already marked as PAID. Reverting state is not allowed.",
        orderNumber: currentOrder.orderNumber,
        status: "PAID",
      };
    }

    // 6. Execute Transactional State Update
    await prisma.$transaction(async (tx) => {
      // Record payment event for full audit log
      await tx.paymentEvent.upsert({
        where: {
          provider_providerEventId: {
            provider: provider.name,
            providerEventId: normalized.providerEventId,
          },
        },
        create: {
          paymentId: payment.id,
          orderId: currentOrder.id,
          provider: provider.name,
          providerEventId: normalized.providerEventId,
          eventType: normalized.eventType,
          payload: (rawPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          isProcessed: true,
          processingNotes: `Successfully processed status change to ${normalized.status}`,
        },
        update: {
          isProcessed: true,
          processingNotes: `Reprocessed event status: ${normalized.status}`,
        },
      });

      if (normalized.status === "PAID") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: normalized.paidAt || new Date(),
            providerTransactionId: normalized.providerTransactionId || payment.providerTransactionId,
          },
        });

        await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: "PAID" },
        });
      } else if (normalized.status === "FAILED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });

        await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: "CANCELLED" },
        });
      } else if (normalized.status === "EXPIRED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "EXPIRED",
            expiredAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: "EXPIRED" },
        });
      } else if (normalized.status === "REFUNDED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });

        await tx.order.update({
          where: { id: currentOrder.id },
          data: { status: "REFUNDED" },
        });

        // Revoke any digital entitlements
        for (const ent of currentOrder.entitlements) {
          await tx.digitalEntitlement.update({
            where: { id: ent.id },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
              revokedReason: "Order refunded",
            },
          });
        }
      }
    });

    // 7. Post-transaction decoupled actions & domain events
    if (normalized.status === "PAID") {
      // Grant digital entitlements if any digital products are in the order
      try {
        await entitlementService.grantDigitalEntitlementsForOrder(currentOrder.id);
      } catch (err) {
        console.error("[Entitlement Error] Failed to grant digital entitlements:", err);
      }

      // Publish OrderPaid event for LMS (Agent 05), Tutoring (Agent 06), Business (Agent 07)
      await eventBus.publish("order.paid", {
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        userId: currentOrder.userId,
        customerEmail: currentOrder.customerEmail,
        customerName: currentOrder.customerName,
        sourceType: currentOrder.sourceType,
        sourceReferenceId: currentOrder.sourceReferenceId,
        items: currentOrder.items.map((it) => ({
          catalogItemId: it.catalogItemId,
          title: it.title,
          slug: it.slug,
          itemType: it.itemType,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
        })),
        totalAmount: Number(currentOrder.totalAmount),
        paidAt: new Date(),
      });
    } else if (normalized.status === "FAILED" || normalized.status === "CANCELLED") {
      await eventBus.publish("order.cancelled", {
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        reason: normalized.status === "FAILED" ? "Payment failed or rejected" : "Payment cancelled",
      });
    }

    return {
      success: true,
      orderNumber: currentOrder.orderNumber,
      paymentNumber: payment.paymentNumber,
      status: normalized.status,
    };
  }

  /**
   * Helper for developer/test simulation: triggers mock payment status update.
   */
  public async simulateMockPayment(
    paymentNumber: string,
    targetStatus: "PAID" | "FAILED" | "EXPIRED" | "CANCELLED"
  ): Promise<WebhookProcessingResult> {
    const payment = await prisma.payment.findUnique({
      where: { paymentNumber },
      include: { order: true },
    });

    if (!payment || !payment.order) {
      throw new Error(`Payment with number ${paymentNumber} not found`);
    }

    const mockProvider = new MockPaymentProvider();
    const signature = mockProvider.generateMockSignature(
      payment.paymentNumber,
      payment.order.orderNumber,
      Number(payment.amount)
    );

    const payload = {
      provider: "mock",
      eventId: `sim_evt_${Date.now()}`,
      paymentNumber: payment.paymentNumber,
      orderNumber: payment.order.orderNumber,
      amount: Number(payment.amount),
      status: targetStatus,
      signature,
    };

    return this.handleWebhookEvent("mock", payload, {
      "x-mock-signature": signature,
    });
  }
}

export const paymentService = new PaymentService();

