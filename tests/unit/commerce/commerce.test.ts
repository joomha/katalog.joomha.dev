import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { MockPaymentProvider } from "@/modules/commerce/providers/mock.provider";
import { MidtransPaymentProvider } from "@/modules/commerce/providers/midtrans.provider";
import { getPaymentProvider, getPaymentProviderStatus } from "@/modules/commerce/providers";
import { checkoutService } from "@/modules/commerce/services/checkout.service";
import {
  QuoteToPaymentSchema,
  AddToCartSchema,
  CreateCheckoutOrderSchema,
} from "@/modules/commerce/types";
import crypto from "crypto";

describe("Agent 04: Commerce, Checkout & Payment Gateway", () => {
  describe("1. Mock Payment Provider", () => {
    const mockProvider = new MockPaymentProvider("test-secret-key-123");

    it("is configured and ready for dev/testing", () => {
      expect(mockProvider.name).toBe("mock");
      expect(mockProvider.isConfigured()).toBe(true);
    });

    it("creates payment intent with verifiable mock signature and human-readable payment number", async () => {
      const intent = await mockProvider.createPaymentIntent({
        orderId: "ord_123",
        orderNumber: "ORD-20261106-99999",
        amount: 150000,
        currency: "IDR",
        customerName: "Budi",
        customerEmail: "budi@example.com",
        items: [{ title: "Template Excel", unitPrice: 150000, quantity: 1 }],
      });

      expect(intent.provider).toBe("mock");
      expect(intent.status).toBe("PENDING");
      expect(intent.paymentNumber).toMatch(/^PAY-\d{8}-[A-Z0-9]{5}$/);
      expect(intent.checkoutUrl).toContain("/api/checkout/mock-pay");
      expect(intent.checkoutUrl).toContain("paymentNumber=");
      expect(intent.checkoutUrl).toContain("sig=");
    });

    it("verifies webhook with valid signature and rejects tampered signature", async () => {
      const paymentNumber = "PAY-20261106-TEST1";
      const orderNumber = "ORD-20261106-TEST1";
      const amount = 250000;

      const validSig = mockProvider.generateMockSignature(paymentNumber, orderNumber, amount);

      // Valid signature
      const validResult = await mockProvider.verifyWebhook(
        { paymentNumber, orderNumber, amount },
        { "x-mock-signature": validSig }
      );
      expect(validResult.isValid).toBe(true);

      // Tampered amount signature
      const invalidResult = await mockProvider.verifyWebhook(
        { paymentNumber, orderNumber, amount: 999999 },
        { "x-mock-signature": validSig }
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.reason).toContain("signature");
    });

    it("normalizes provider events to domain PaymentStatus correctly", () => {
      const paidEvent = mockProvider.normalizeWebhookEvent({
        eventId: "evt_1",
        paymentNumber: "PAY-001",
        orderNumber: "ORD-001",
        amount: 100000,
        status: "SETTLEMENT",
      });
      expect(paidEvent.status).toBe("PAID");
      expect(paidEvent.paidAt).toBeInstanceOf(Date);

      const failedEvent = mockProvider.normalizeWebhookEvent({
        eventId: "evt_2",
        status: "DENY",
      });
      expect(failedEvent.status).toBe("FAILED");

      const expiredEvent = mockProvider.normalizeWebhookEvent({
        eventId: "evt_3",
        status: "EXPIRE",
      });
      expect(expiredEvent.status).toBe("EXPIRED");

      const refundEvent = mockProvider.normalizeWebhookEvent({
        eventId: "evt_4",
        status: "REFUND",
      });
      expect(refundEvent.status).toBe("REFUNDED");
    });

    it("simulates refund and cancel successfully", async () => {
      const refund = await mockProvider.refund({
        paymentNumber: "PAY-001",
        amount: 50000,
        reason: "Customer request",
      });
      expect(refund.success).toBe(true);
      expect(refund.status).toBe("COMPLETED");
      expect(refund.providerRefundId).toBeTruthy();

      const cancel = await mockProvider.cancel({
        paymentNumber: "PAY-001",
      });
      expect(cancel.success).toBe(true);
    });
  });

  describe("2. Midtrans Extension Provider (Security & Safety)", () => {
    it("is inactive/disabled by default if MIDTRANS_SERVER_KEY is absent", () => {
      const originalKey = process.env.MIDTRANS_SERVER_KEY;
      delete process.env.MIDTRANS_SERVER_KEY;

      const midtrans = new MidtransPaymentProvider();
      expect(midtrans.name).toBe("midtrans");
      expect(midtrans.isConfigured()).toBe(false);

      process.env.MIDTRANS_SERVER_KEY = originalKey;
    });

    it("prevents transaction creation when unconfigured and points to mock", async () => {
      const originalKey = process.env.MIDTRANS_SERVER_KEY;
      delete process.env.MIDTRANS_SERVER_KEY;

      const midtrans = new MidtransPaymentProvider();
      await expect(
        midtrans.createPaymentIntent({
          orderId: "ord_1",
          orderNumber: "ORD-1",
          amount: 50000,
          currency: "IDR",
          customerName: "Test",
          customerEmail: "test@example.com",
          items: [],
        })
      ).rejects.toThrow(/disabled because MIDTRANS_SERVER_KEY is not configured/);

      process.env.MIDTRANS_SERVER_KEY = originalKey;
    });

    it("verifies official SHA512 signature formula accurately", async () => {
      const serverKey = "SB-Mid-server-TEST123456789";
      process.env.MIDTRANS_SERVER_KEY = serverKey;
      const midtrans = new MidtransPaymentProvider();

      const orderId = "ORD-20261106-MID01";
      const statusCode = "200";
      const grossAmount = "150000.00";

      // SHA512(order_id + status_code + gross_amount + ServerKey)
      const expectedSignature = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");

      const verifyValid = await midtrans.verifyWebhook(
        {
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: expectedSignature,
        },
        {}
      );
      expect(verifyValid.isValid).toBe(true);

      const verifyTampered = await midtrans.verifyWebhook(
        {
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: "tampered-signature-hash",
        },
        {}
      );
      expect(verifyTampered.isValid).toBe(false);
      expect(verifyTampered.reason).toContain("mismatch");

      delete process.env.MIDTRANS_SERVER_KEY;
    });

    it("normalizes Midtrans statuses (settlement, capture, expire, cancel, refund)", () => {
      const midtrans = new MidtransPaymentProvider();

      const settlement = midtrans.normalizeWebhookEvent({
        order_id: "ORD-1",
        transaction_status: "settlement",
        gross_amount: "100000",
      });
      expect(settlement.status).toBe("PAID");

      const captureAccept = midtrans.normalizeWebhookEvent({
        order_id: "ORD-2",
        transaction_status: "capture",
        fraud_status: "accept",
        gross_amount: "200000",
      });
      expect(captureAccept.status).toBe("PAID");

      const expire = midtrans.normalizeWebhookEvent({
        order_id: "ORD-3",
        transaction_status: "expire",
      });
      expect(expire.status).toBe("EXPIRED");

      const cancel = midtrans.normalizeWebhookEvent({
        order_id: "ORD-4",
        transaction_status: "cancel",
      });
      expect(cancel.status).toBe("FAILED");
    });
  });

  describe("3. Provider Registry & Health", () => {
    it("returns mock provider by default and falls back gracefully", () => {
      const provider = getPaymentProvider("mock");
      expect(provider.name).toBe("mock");

      const unknown = getPaymentProvider("non-existent");
      expect(unknown.name).toBe("mock");
    });

    it("reports system provider readiness status without exposing keys", () => {
      const status = getPaymentProviderStatus();
      expect(status.activeProvider).toBeDefined();
      expect(status.isMockEnabled).toBe(true);
      expect(status.providers.length).toBeGreaterThanOrEqual(2);
      expect(status.providers[0].name).toBe("mock");
    });
  });

  describe("4. Decimal Math & Order Snapshot Precision", () => {
    it("generates human-readable, non-sequential order numbers (ORD-YYYYMMDD-XXXXX)", () => {
      const ord1 = checkoutService.generateOrderNumber();
      const ord2 = checkoutService.generateOrderNumber();

      expect(ord1).toMatch(/^ORD-\d{8}-[A-F0-9]{5}$/);
      expect(ord2).toMatch(/^ORD-\d{8}-[A-F0-9]{5}$/);
      expect(ord1).not.toBe(ord2);
    });

    it("calculates Decimal subtotals, discounts and total without floating-point inaccuracies", () => {
      // Test Decimal arithmetic with known IEEE 754 floating point issues (e.g. 0.1 + 0.2)
      const price1 = new Prisma.Decimal("199999.99");
      const price2 = new Prisma.Decimal("299999.01");
      const discount = new Prisma.Decimal("50000.00");

      const subtotal = price1.add(price2);
      expect(subtotal.toString()).toBe("499999");

      const total = subtotal.sub(discount);
      expect(total.toString()).toBe("449999");
      expect(Number(total)).toBe(449999);
    });

    it("correctly maps order and payments to client DTOs with numbers and string dates", () => {
      const mockOrder = {
        id: "ord_test_1",
        orderNumber: "ORD-20261106-ABCDE",
        userId: "user_1",
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        customerPhone: "0812345",
        status: "PENDING",
        currency: "IDR",
        subtotal: new Prisma.Decimal(200000),
        discountAmount: new Prisma.Decimal(20000),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(180000),
        notes: "Urgently needed",
        sourceType: "CATALOG",
        sourceReferenceId: null,
        createdAt: new Date("2026-11-06T10:00:00Z"),
        updatedAt: new Date("2026-11-06T10:00:00Z"),
        items: [
          {
            id: "item_1",
            orderId: "ord_test_1",
            catalogItemId: "cat_1",
            title: "Belajar Excel",
            slug: "belajar-excel",
            sku: "SKU-EXCEL",
            itemType: "SELF_PACED_COURSE",
            unitPrice: new Prisma.Decimal(200000),
            quantity: 1,
            discountAmount: new Prisma.Decimal(20000),
            totalPrice: new Prisma.Decimal(180000),
            currency: "IDR",
            metadata: null,
          },
        ],
        payments: [
          {
            id: "pay_1",
            orderId: "ord_test_1",
            paymentNumber: "PAY-20261106-ABCDE",
            provider: "mock",
            providerTransactionId: "mock_tx_1",
            paymentMethod: "mock_instant",
            status: "PENDING",
            amount: new Prisma.Decimal(180000),
            currency: "IDR",
            checkoutUrl: "/api/checkout/mock-pay?paymentNumber=PAY-20261106-ABCDE",
            paidAt: null,
            expiredAt: null,
            createdAt: new Date("2026-11-06T10:00:00Z"),
          },
        ],
      };

      const dto = checkoutService.mapOrderToDetailDTO(mockOrder);
      expect(dto.orderNumber).toBe("ORD-20261106-ABCDE");
      expect(dto.subtotal).toBe(200000);
      expect(dto.discountAmount).toBe(20000);
      expect(dto.totalAmount).toBe(180000);
      expect(dto.items.length).toBe(1);
      expect(dto.items[0].totalPrice).toBe(180000);
      expect(dto.payments[0].amount).toBe(180000);
    });
  });

  describe("5. Quote-to-Payment Validation", () => {
    it("validates quote payment schema strictly", () => {
      const validQuote = {
        quoteId: "quote_tutoring_001",
        sourceType: "TUTORING_QUOTE" as const,
        customerName: "Ahmad Siswa",
        customerEmail: "ahmad@example.com",
        title: "Les Privat Pemrograman Python (4 Sesi)",
        amount: 800000,
        currency: "IDR",
        paymentScheduleTitle: "Pembayaran Penuh",
      };

      const parsed = QuoteToPaymentSchema.safeParse(validQuote);
      expect(parsed.success).toBe(true);

      const invalidAmount = {
        ...validQuote,
        amount: -50000,
      };
      const parsedInvalid = QuoteToPaymentSchema.safeParse(invalidAmount);
      expect(parsedInvalid.success).toBe(false);
    });
  });

  describe("6. Cart and Checkout Input Schemas", () => {
    it("validates AddToCart schema rejects non-positive quantities", () => {
      const valid = AddToCartSchema.safeParse({ catalogItemId: "item_1", quantity: 2 });
      expect(valid.success).toBe(true);

      const invalidQty = AddToCartSchema.safeParse({ catalogItemId: "item_1", quantity: 0 });
      expect(invalidQty.success).toBe(false);

      const missingId = AddToCartSchema.safeParse({ quantity: 1 });
      expect(missingId.success).toBe(false);
    });

    it("validates CreateCheckoutOrder schema requires valid email and customer name", () => {
      const valid = CreateCheckoutOrderSchema.safeParse({
        customerName: "Ahmad",
        customerEmail: "ahmad@example.com",
        customerPhone: "0812345678",
      });
      expect(valid.success).toBe(true);

      const invalidEmail = CreateCheckoutOrderSchema.safeParse({
        customerName: "Ahmad",
        customerEmail: "not-an-email",
      });
      expect(invalidEmail.success).toBe(false);

      const shortName = CreateCheckoutOrderSchema.safeParse({
        customerName: "A",
        customerEmail: "ahmad@example.com",
      });
      expect(shortName.success).toBe(false);
    });
  });
});

