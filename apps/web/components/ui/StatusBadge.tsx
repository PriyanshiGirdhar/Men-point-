import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

const ORDER_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-charcoal-100 text-charcoal-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-mustard-100 text-mustard-800',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-charcoal-100 text-charcoal-600',
  PAID: 'bg-green-100 text-green-700',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn('inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', ORDER_STYLES[status])}>
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cn('inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', PAYMENT_STYLES[status])}>
      {status}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];
