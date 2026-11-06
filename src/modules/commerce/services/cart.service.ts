import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { checkCatalogItemPurchasability } from "@/modules/catalog";
import {
  AddToCartInput,
  CartDTO,
  CartItemDTO,
  CartSummaryDTO,
  UpdateCartItemQuantityInput,
} from "../types";

export interface CartIdentifier {
  userId?: string | null;
  sessionId?: string | null;
}

export class CartService {
  /**
   * Resolves or initializes a cart record for either a logged-in user or guest session.
   */
  public async getOrCreateCart(identifier: CartIdentifier) {
    const { userId, sessionId } = identifier;

    if (!userId && !sessionId) {
      throw new Error("Cart identifier must contain either a userId or a sessionId");
    }

    if (userId) {
      const userCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true },
      });
      if (userCart) return userCart;

      return prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    if (sessionId) {
      const sessionCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });
      if (sessionCart) return sessionCart;

      return prisma.cart.create({
        data: { sessionId },
        include: { items: true },
      });
    }

    throw new Error("Unable to resolve cart");
  }

  /**
   * Retrieves cart contents with server-side recalculated pricing and purchasability status.
   */
  public async getCart(identifier: CartIdentifier): Promise<CartDTO> {
    const cart = await this.getOrCreateCart(identifier);

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { createdAt: "desc" },
    });

    let subtotalDecimal = new Prisma.Decimal(0);
    let discountDecimal = new Prisma.Decimal(0);
    const itemDTOs: CartItemDTO[] = [];

    for (const item of items) {
      const purchasability = await checkCatalogItemPurchasability(item.catalogItemId);

      // Verify and sync latest price from catalog directly
      const catalogItem = await prisma.catalogItem.findUnique({
        where: { id: item.catalogItemId },
      });

      const effectivePrice = catalogItem?.discountPrice
        ? catalogItem.discountPrice
        : catalogItem?.basePrice ?? item.unitPrice;

      const itemTotal = effectivePrice.mul(item.quantity);

      if (purchasability.canPurchase) {
        subtotalDecimal = subtotalDecimal.add(itemTotal);
        if (catalogItem?.basePrice && catalogItem?.discountPrice) {
          const itemDiscount = catalogItem.basePrice
            .sub(catalogItem.discountPrice)
            .mul(item.quantity);
          discountDecimal = discountDecimal.add(itemDiscount);
        }
      }

      itemDTOs.push({
        id: item.id,
        cartId: item.cartId,
        catalogItemId: item.catalogItemId,
        title: catalogItem?.title ?? item.title,
        slug: catalogItem?.slug ?? item.slug,
        itemType: catalogItem?.type ?? item.itemType,
        unitPrice: Number(effectivePrice),
        quantity: item.quantity,
        totalPrice: Number(itemTotal),
        canPurchase: purchasability.canPurchase,
        unavailableReason: purchasability.reason,
        metadata: item.metadata as Record<string, unknown> | null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    const finalTotalDecimal = subtotalDecimal;
    const summary: CartSummaryDTO = {
      subtotal: Number(subtotalDecimal),
      discountTotal: Number(discountDecimal),
      taxTotal: 0,
      finalTotal: Number(finalTotalDecimal),
      itemCount: itemDTOs.reduce((sum, it) => sum + it.quantity, 0),
      currency: "IDR",
    };

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: itemDTOs,
      summary,
      updatedAt: cart.updatedAt.toISOString(),
    };
  }

  /**
   * Adds an item to the cart with server-side validation against catalog availability.
   */
  public async addItem(
    identifier: CartIdentifier,
    input: AddToCartInput
  ): Promise<CartDTO> {
    const { catalogItemId, quantity } = input;
    if (quantity <= 0) {
      throw new Error("Quantity harus lebih besar dari 0");
    }

    const purchasability = await checkCatalogItemPurchasability(catalogItemId);
    if (!purchasability.canPurchase) {
      throw new Error(
        purchasability.reason || "Item ini saat ini tidak tersedia untuk pembelian langsung."
      );
    }

    const catalogItem = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
    });

    if (!catalogItem) {
      throw new Error("Item katalog tidak ditemukan");
    }

    const cart = await this.getOrCreateCart(identifier);

    // Enforce 1-item rule for digital courses and digital downloads
    const isSingleQuantityType =
      catalogItem.type === "SELF_PACED_COURSE" ||
      catalogItem.type === "DIGITAL_PRODUCT";

    const targetQuantity = isSingleQuantityType ? 1 : quantity;

    const effectiveUnitPrice = catalogItem.discountPrice
      ? catalogItem.discountPrice
      : catalogItem.basePrice ?? new Prisma.Decimal(0);

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_catalogItemId: {
          cartId: cart.id,
          catalogItemId: catalogItem.id,
        },
      },
    });

    if (existingCartItem) {
      const newQty = isSingleQuantityType
        ? 1
        : existingCartItem.quantity + targetQuantity;

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQty,
          unitPrice: effectiveUnitPrice,
          title: catalogItem.title,
          slug: catalogItem.slug,
          itemType: catalogItem.type,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          catalogItemId: catalogItem.id,
          title: catalogItem.title,
          slug: catalogItem.slug,
          itemType: catalogItem.type,
          unitPrice: effectiveUnitPrice,
          quantity: targetQuantity,
        },
      });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return this.getCart(identifier);
  }

  /**
   * Updates the quantity of a specific cart item. If quantity is 0, removes the item.
   */
  public async updateQuantity(
    identifier: CartIdentifier,
    input: UpdateCartItemQuantityInput
  ): Promise<CartDTO> {
    const cart = await this.getOrCreateCart(identifier);
    const { cartItemId, quantity } = input;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new Error("Item tidak ditemukan di keranjang belanja Anda");
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      // Courses and digital products can only have quantity 1
      const isSingleQuantity =
        cartItem.itemType === "SELF_PACED_COURSE" ||
        cartItem.itemType === "DIGITAL_PRODUCT";

      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity: isSingleQuantity ? 1 : quantity,
        },
      });
    }

    return this.getCart(identifier);
  }

  /**
   * Removes an item from the cart.
   */
  public async removeItem(
    identifier: CartIdentifier,
    cartItemId: string
  ): Promise<CartDTO> {
    const cart = await this.getOrCreateCart(identifier);

    await prisma.cartItem.deleteMany({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    return this.getCart(identifier);
  }

  /**
   * Empties the cart.
   */
  public async clearCart(identifier: CartIdentifier): Promise<void> {
    const cart = await this.getOrCreateCart(identifier);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  /**
   * Merges an anonymous guest session cart into an authenticated user's cart safely upon login.
   */
  public async mergeGuestCart(sessionId: string, userId: string): Promise<CartDTO> {
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart({ userId });
    }

    const userCart = await this.getOrCreateCart({ userId });

    for (const item of guestCart.items) {
      const existingUserItem = await prisma.cartItem.findUnique({
        where: {
          cartId_catalogItemId: {
            cartId: userCart.id,
            catalogItemId: item.catalogItemId,
          },
        },
      });

      if (!existingUserItem) {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            catalogItemId: item.catalogItemId,
            title: item.title,
            slug: item.slug,
            itemType: item.itemType,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            metadata: item.metadata ?? Prisma.JsonNull,
          },
        });
      }
    }

    // Clean up guest cart after merging
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });

    return this.getCart({ userId });
  }
}

export const cartService = new CartService();

