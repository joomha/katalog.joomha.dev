import "server-only";
import { eventBus } from "@/lib/events";
import { enrollFromPaidOrder, type OrderPaidPayload } from "../services/enrollment.service";

/**
 * Contract expected from Agent 04:
 * OrderPaid payload = { orderId, userId, items: [{ catalogItemId, quantity? }] }.
 * Agent 10 must call registerLearningOrderPaidHandler() during integration bootstrap.
 */
let unsubscribe: (() => void) | null = null;
export function registerLearningOrderPaidHandler() {
  if (unsubscribe) return unsubscribe;
  unsubscribe = eventBus.subscribe<OrderPaidPayload>("OrderPaid", async (event) => {
    await enrollFromPaidOrder(event.payload);
  });
  return unsubscribe;
}
