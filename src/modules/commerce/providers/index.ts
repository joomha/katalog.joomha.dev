import { PaymentProvider } from "./payment-provider.interface";
import { MockPaymentProvider } from "./mock.provider";
import { MidtransPaymentProvider } from "./midtrans.provider";
import { PaymentProviderStatusDTO } from "../types";

export * from "./payment-provider.interface";
export * from "./mock.provider";
export * from "./midtrans.provider";

const mockProvider = new MockPaymentProvider();
const midtransProvider = new MidtransPaymentProvider();

const providers: Record<string, PaymentProvider> = {
  mock: mockProvider,
  midtrans: midtransProvider,
};

/**
 * Returns the requested payment provider, or resolves the default from environment.
 * Gracefully falls back to MockPaymentProvider if the requested provider is unconfigured.
 */
export function getPaymentProvider(requestedName?: string): PaymentProvider {
  const envProviderName = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
  const name = (requestedName || envProviderName).toLowerCase();

  const provider = providers[name];

  if (!provider) {
    console.warn(`Payment provider '${name}' not found, falling back to mock provider.`);
    return mockProvider;
  }

  // If midtrans is requested but not configured, log warning and use mock
  if (name === "midtrans" && !provider.isConfigured()) {
    console.warn("Midtrans is selected but MIDTRANS_SERVER_KEY is missing. Falling back to mock provider.");
    return mockProvider;
  }

  return provider;
}

/**
 * Returns the health and readiness status of available payment providers for admin/system visibility.
 */
export function getPaymentProviderStatus(): PaymentProviderStatusDTO {
  const activeProvider = process.env.PAYMENT_PROVIDER || "mock";
  const isMockEnabled = process.env.PAYMENT_MOCK_ENABLED !== "false";

  return {
    activeProvider,
    isMockEnabled,
    providers: [
      {
        name: "mock",
        isConfigured: true,
        description: "Simulated in-memory/instant payment gateway for local, QA, and testing environments.",
      },
      {
        name: "midtrans",
        isConfigured: midtransProvider.isConfigured(),
        description: "Indonesian Payment Gateway (Snap & Core API: QRIS, GoPay, BCA/Mandiri/BRI VA, Cards). Extension ready.",
      },
    ],
  };
}

