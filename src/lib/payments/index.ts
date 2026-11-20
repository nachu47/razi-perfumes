import 'server-only';
import { mockProvider } from './mock';
import type { PaymentProvider } from './types';

/**
 * Returns the configured online payment gateway, or null when only Cash on Delivery
 * is offered (PAYMENT_PROVIDER="none" or unset). Register real gateways here.
 */
export function getPaymentProvider(): PaymentProvider | null {
  const id = (process.env.PAYMENT_PROVIDER || 'none').toLowerCase();
  switch (id) {
    case 'mock':
      // Never allow the sandbox to mark real orders as paid in production
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') return null;
      return mockProvider;
    default:
      return null;
  }
}

export function enabledPaymentMethods(): string[] {
  return ['COD', ...(getPaymentProvider()?.methods ?? [])];
}
