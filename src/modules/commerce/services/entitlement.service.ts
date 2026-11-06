import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/events";
import { DigitalEntitlementDTO } from "../types";

export class EntitlementService {
  /**
   * Automatically grants digital entitlements for purchasable digital products upon order payment verification.
   * Only grants if the order is PAID and item status is AVAILABLE.
   */
  public async grantDigitalEntitlementsForOrder(orderId: string): Promise<DigitalEntitlementDTO[]> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== "PAID") {
      throw new Error(
        `Cannot grant entitlements: Order ${order.orderNumber} is in status ${order.status}, not PAID.`
      );
    }

    const recipientUserId = order.userId || `guest_${order.customerEmail.toLowerCase()}`;
    const grantedList: DigitalEntitlementDTO[] = [];

    for (const item of order.items) {
      if (item.itemType !== "DIGITAL_PRODUCT" || !item.catalogItemId) {
        continue;
      }

      // Check if catalog item is AVAILABLE
      const catalogItem = await prisma.catalogItem.findUnique({
        where: { id: item.catalogItemId },
        include: {
          assets: true,
        },
      });

      if (!catalogItem || catalogItem.status !== "AVAILABLE") {
        console.warn(
          `Digital entitlement skipped for item ${item.title}: Item status is not AVAILABLE.`
        );
        continue;
      }

      // Determine downloadable asset URL
      const primaryAsset =
        catalogItem.assets.find((a) => a.assetType === "FILE" || a.isPrimary) ||
        catalogItem.assets[0];

      const assetDownloadUrl = primaryAsset?.url || `/downloads/products/${catalogItem.slug}.zip`;

      // Idempotently upsert entitlement
      const entitlement = await prisma.digitalEntitlement.upsert({
        where: {
          userId_catalogItemId: {
            userId: recipientUserId,
            catalogItemId: item.catalogItemId,
          },
        },
        create: {
          orderId: order.id,
          userId: recipientUserId,
          catalogItemId: item.catalogItemId,
          itemTitle: item.title,
          assetDownloadUrl,
          isRevoked: false,
          grantedAt: new Date(),
        },
        update: {
          orderId: order.id,
          itemTitle: item.title,
          assetDownloadUrl,
          isRevoked: false,
        },
      });

      // Publish event
      await eventBus.publish("digital.entitlement.granted", {
        entitlementId: entitlement.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: recipientUserId,
        catalogItemId: item.catalogItemId,
        itemTitle: item.title,
        downloadUrl: assetDownloadUrl,
      });

      grantedList.push({
        id: entitlement.id,
        orderId: entitlement.orderId,
        userId: entitlement.userId,
        catalogItemId: entitlement.catalogItemId,
        itemTitle: entitlement.itemTitle,
        assetDownloadUrl: entitlement.assetDownloadUrl,
        isRevoked: entitlement.isRevoked,
        grantedAt: entitlement.grantedAt.toISOString(),
        expiresAt: entitlement.expiresAt?.toISOString() || null,
      });
    }

    return grantedList;
  }

  /**
   * Retrieves active, unrevoked digital entitlements owned by a user.
   */
  public async getUserDigitalEntitlements(userId: string): Promise<DigitalEntitlementDTO[]> {
    const list = await prisma.digitalEntitlement.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: { grantedAt: "desc" },
    });

    return list.map((e) => ({
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
  }

  /**
   * Revokes an entitlement upon refund or cancellation.
   */
  public async revokeEntitlement(entitlementId: string, reason: string): Promise<void> {
    await prisma.digitalEntitlement.update({
      where: { id: entitlementId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    await eventBus.publish("digital.entitlement.revoked", {
      entitlementId,
      reason,
    });
  }
}

export const entitlementService = new EntitlementService();

