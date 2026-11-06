import { describe, it, expect, vi } from "vitest";
import { eventBus } from "@/lib/events";

describe("Domain Event Bus", () => {
  it("subscribes to and receives published domain events", async () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.subscribe("OrderPaid", handler);

    const payload = { orderId: "ord-123", amount: 250000 };
    await eventBus.publish("OrderPaid", payload, "ord-123");

    expect(handler).toHaveBeenCalledTimes(1);
    const calledEvent = handler.mock.calls[0][0];
    expect(calledEvent.eventName).toBe("OrderPaid");
    expect(calledEvent.aggregateId).toBe("ord-123");
    expect(calledEvent.payload).toEqual(payload);
    expect(calledEvent.eventId).toBeDefined();

    unsubscribe();
    await eventBus.publish("OrderPaid", payload, "ord-123");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

