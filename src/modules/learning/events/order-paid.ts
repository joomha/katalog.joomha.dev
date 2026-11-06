import "server-only";
import { eventBus } from "@/lib/events";
import { enrollFromPaidOrder, type OrderPaidPayload } from "../services/enrollment.service";

/**
 * Contract expected from Agent 04:
 * OrderPaid payload = { orderId, userId, items: [{ catalogItemId, quantity? }] }.
 * Agent 10 registers this handler once in the integration bootstrap.
 */
let registered = false;
let removeHandler: (() => void) | undefined;

export function registerLearningOrderPaidHandler() {
  if (registered && removeHandler) return removeHandler;
  const unsubscribe = eventBus.subscribe<OrderPaidPayload>("OrderPaid", async (event) => {
    await enrollFromPaidOrder(event.payload);
  });
  registered = true;
  removeHandler = () => {
    unsubscribe();
    registered = false;
    removeHandler = undefined;
  };
  return removeHandler;
}
