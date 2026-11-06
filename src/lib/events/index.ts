/**
 * Minimal typed event baseline for in-process asynchronous domain decoupled events.
 * Domain agents (02-09) publish their respective domain events using this standard envelope.
 */

export interface DomainEvent<TPayload = unknown> {
  eventId: string;
  eventName: string;
  occurredAt: Date;
  aggregateId?: string;
  payload: TPayload;
}

export type EventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent
) => Promise<void> | void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe an asynchronous handler to a domain event by name.
   */
  public subscribe<TPayload>(
    eventName: string,
    handler: EventHandler<DomainEvent<TPayload>>
  ): () => void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler as EventHandler);
    this.handlers.set(eventName, list);

    return () => {
      const current = this.handlers.get(eventName) ?? [];
      this.handlers.set(
        eventName,
        current.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Publish an event to all registered listeners.
   */
  public async publish<TPayload>(
    eventName: string,
    payload: TPayload,
    aggregateId?: string
  ): Promise<void> {
    const event: DomainEvent<TPayload> = {
      eventId: crypto.randomUUID(),
      eventName,
      occurredAt: new Date(),
      aggregateId,
      payload,
    };

    const listeners = this.handlers.get(eventName) ?? [];
    await Promise.allSettled(listeners.map((listener) => listener(event)));
  }
}

// Global singleton event bus across HMR cycles
const globalForEventBus = globalThis as unknown as { eventBus: EventBus };
export const eventBus = globalForEventBus.eventBus ?? new EventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.eventBus = eventBus;
}

