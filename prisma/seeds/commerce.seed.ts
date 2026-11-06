import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Commerce Domain Seed
 * Owned by Agent 04. Provides sample orders, payments, payment events, and entitlements for testing and demo.
 */
export async function seedCommerce(prisma: PrismaClient) {
  console.log("🌱 Seeding commerce domain...");

  // 1. Fetch available catalog items to link with demo orders
  const catalogItems = await prisma.catalogItem.findMany({
    where: { status: "AVAILABLE" },
    take: 3,
  });

  if (catalogItems.length === 0) {
    console.log("⚠️ No AVAILABLE catalog items found. Skipping commerce seed until catalog is seeded.");
    return;
  }

  const excelItem = catalogItems.find((i) => i.slug.includes("excel")) || catalogItems[0];
  const courseItem = catalogItems.find((i) => i.type === "SELF_PACED_COURSE") || catalogItems[1] || catalogItems[0];

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  // 2. Demo Order 1: PAID Digital Product
  const paidOrderNumber = `ORD-${dateStr}-DEMO1`;
  const existingPaid = await prisma.order.findUnique({
    where: { orderNumber: paidOrderNumber },
  });

  if (!existingPaid) {
    const itemPrice = excelItem.discountPrice || excelItem.basePrice || new Prisma.Decimal(149000);

    const paidOrder = await prisma.order.create({
      data: {
        orderNumber: paidOrderNumber,
        customerName: "Budi Santoso",
        customerEmail: "budi.santoso@example.com",
        customerPhone: "081234567890",
        status: "PAID",
        currency: "IDR",
        subtotal: itemPrice,
        discountAmount: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: itemPrice,
        notes: "Mohon dikirimkan link template segera ya kak.",
        sourceType: "CATALOG",
        items: {
          create: [
            {
              catalogItemId: excelItem.id,
              title: excelItem.title,
              slug: excelItem.slug,
              sku: `SKU-${excelItem.slug.slice(0, 10).toUpperCase()}`,
              itemType: excelItem.type,
              unitPrice: itemPrice,
              quantity: 1,
              discountAmount: new Prisma.Decimal(0),
              totalPrice: itemPrice,
              currency: "IDR",
            },
          ],
        },
        payments: {
          create: [
            {
              paymentNumber: `PAY-${dateStr}-DEMO1`,
              provider: "mock",
              providerTransactionId: "mock_tx_demo_paid_001",
              paymentMethod: "mock_instant",
              status: "PAID",
              amount: itemPrice,
              currency: "IDR",
              checkoutUrl: `/api/checkout/mock-pay?paymentNumber=PAY-${dateStr}-DEMO1`,
              paidAt: new Date(),
              events: {
                create: [
                  {
                    provider: "mock",
                    providerEventId: `evt_demo_paid_${Date.now()}`,
                    eventType: "payment.settlement",
                    payload: { status: "PAID", amount: Number(itemPrice) },
                    isProcessed: true,
                    processingNotes: "Demo initial seed payment processed successfully",
                  },
                ],
              },
            },
          ],
        },
        entitlements: {
          create: [
            {
              userId: "guest_budi.santoso@example.com",
              catalogItemId: excelItem.id,
              itemTitle: excelItem.title,
              assetDownloadUrl: `/downloads/products/${excelItem.slug}.zip`,
              isRevoked: false,
              grantedAt: new Date(),
            },
          ],
        },
      },
    });

    console.log(`✅ Demo Order Created: ${paidOrder.orderNumber} (PAID)`);
  }

  // 3. Demo Order 2: PENDING Course Purchase
  const pendingOrderNumber = `ORD-${dateStr}-DEMO2`;
  const existingPending = await prisma.order.findUnique({
    where: { orderNumber: pendingOrderNumber },
  });

  if (!existingPending) {
    const coursePrice = courseItem.discountPrice || courseItem.basePrice || new Prisma.Decimal(499000);

    const pendingOrder = await prisma.order.create({
      data: {
        orderNumber: pendingOrderNumber,
        customerName: "Siti Rahma",
        customerEmail: "siti.rahma@example.com",
        customerPhone: "089876543210",
        status: "PENDING",
        currency: "IDR",
        subtotal: coursePrice,
        discountAmount: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: coursePrice,
        sourceType: "CATALOG",
        items: {
          create: [
            {
              catalogItemId: courseItem.id,
              title: courseItem.title,
              slug: courseItem.slug,
              sku: `SKU-${courseItem.slug.slice(0, 10).toUpperCase()}`,
              itemType: courseItem.type,
              unitPrice: coursePrice,
              quantity: 1,
              discountAmount: new Prisma.Decimal(0),
              totalPrice: coursePrice,
              currency: "IDR",
            },
          ],
        },
        payments: {
          create: [
            {
              paymentNumber: `PAY-${dateStr}-DEMO2`,
              provider: "mock",
              providerTransactionId: "mock_tx_demo_pending_002",
              paymentMethod: "bank_transfer",
              status: "PENDING",
              amount: coursePrice,
              currency: "IDR",
              checkoutUrl: `/api/checkout/mock-pay?paymentNumber=PAY-${dateStr}-DEMO2&orderNumber=${pendingOrderNumber}&amount=${coursePrice}`,
            },
          ],
        },
      },
    });

    console.log(`✅ Demo Order Created: ${pendingOrder.orderNumber} (PENDING)`);
  }

  console.log("✨ Commerce domain seeding complete!");
}

